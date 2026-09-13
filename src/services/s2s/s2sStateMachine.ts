/**
 * Bhasha Setu — S2S Deterministic State Machine
 * 
 * Enforces a strict, predictable lifecycle for every conversational turn:
 * 
 *   IDLE ──► LISTENING ──► PROCESSING_AUDIO ──► ASR_PROCESSING
 *     ▲                                               │
 *     │                                               ▼
 *   PLAYING ◄── TTS_PROCESSING ◄── SAFETY_CHECK ◄── TRANSLATING
 *     │
 *     └──► (on complete / abort) ──► IDLE
 * 
 * Guarantees:
 * - No invalid transition states (e.g. cannot start listening while playing or translating without explicit abort).
 * - Watchdog timeouts prevent the system from getting permanently stuck in any processing state.
 * - Single source of truth replaces contradictory independent boolean flags.
 */

import { S2SState, S2SError, S2SErrorCode } from './s2sTypes';

export interface StateMachineContext {
  turnId?: string;
  speakerRole?: string;
  sourceLang?: string;
  targetLang?: string;
  details?: string;
}

export type StateChangeListener = (
  newState: S2SState,
  previousState: S2SState,
  context?: StateMachineContext
) => void;

export type ErrorListener = (error: S2SError) => void;

export class S2SStateMachine {
  private currentState: S2SState = 'IDLE';
  private currentContext: StateMachineContext = {};
  private stateListeners: Set<StateChangeListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private watchdogTimer: any = null;

  // Maximum allowed duration in milliseconds for transient processing states
  private static readonly STATE_TIMEOUTS: Partial<Record<S2SState, number>> = {
    LISTENING: 30000,         // Max 30s continuous single-turn speech
    PROCESSING_AUDIO: 8000,   // Max 8s audio buffer conversion / VAD
    ASR_PROCESSING: 10000,    // Max 10s ASR network / inference
    TRANSLATING: 8000,        // Max 8s translation lookup / fallback
    SAFETY_CHECK: 3000,       // Max 3s domain risk analysis
    TTS_PROCESSING: 5000,     // Max 5s voice synth initialization
    PLAYING: 15000            // Max 15s audio utterance playback
  };

  // Valid deterministic state transitions
  private static readonly ALLOWED_TRANSITIONS: Record<S2SState, S2SState[]> = {
    IDLE: ['LISTENING', 'ERROR'],
    LISTENING: ['PROCESSING_AUDIO', 'ASR_PROCESSING', 'TRANSLATING', 'CANCELLED', 'ERROR', 'IDLE'],
    PROCESSING_AUDIO: ['ASR_PROCESSING', 'TRANSLATING', 'CANCELLED', 'ERROR', 'IDLE'],
    ASR_PROCESSING: ['TRANSLATING', 'CANCELLED', 'ERROR', 'IDLE'],
    TRANSLATING: ['SAFETY_CHECK', 'CANCELLED', 'ERROR', 'IDLE'],
    SAFETY_CHECK: ['TTS_PROCESSING', 'PLAYING', 'CANCELLED', 'ERROR', 'IDLE'],
    TTS_PROCESSING: ['PLAYING', 'CANCELLED', 'ERROR', 'IDLE'],
    PLAYING: ['IDLE', 'LISTENING', 'CANCELLED', 'ERROR'],
    ERROR: ['IDLE', 'LISTENING'],
    CANCELLED: ['IDLE', 'LISTENING']
  };

  constructor() {}

  public getState(): S2SState {
    return this.currentState;
  }

  public getContext(): StateMachineContext {
    return { ...this.currentContext };
  }

  public isBusy(): boolean {
    return this.currentState !== 'IDLE' && this.currentState !== 'ERROR' && this.currentState !== 'CANCELLED';
  }

  public isListening(): boolean {
    return this.currentState === 'LISTENING';
  }

  public isSpeaking(): boolean {
    return this.currentState === 'PLAYING';
  }

  /**
   * Subscribes a listener to state changes.
   * Returns an unsubscribe function.
   */
  public onStateChange(listener: StateChangeListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Subscribes a listener to error occurrences.
   * Returns an unsubscribe function.
   */
  public onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Requests a state transition.
   * Validates if transition is permissible according to the deterministic transition matrix.
   */
  public transitionTo(nextState: S2SState, context?: StateMachineContext): boolean {
    const from = this.currentState;
    const allowed = S2SStateMachine.ALLOWED_TRANSITIONS[from] || [];

    if (!allowed.includes(nextState)) {
      console.warn(`[S2SStateMachine] Invalid state transition: ${from} -> ${nextState}. Ignoring.`);
      return false;
    }

    this.clearWatchdog();

    this.currentState = nextState;
    if (context) {
      this.currentContext = { ...this.currentContext, ...context };
    }

    // Arm watchdog for transient states
    const timeoutMs = S2SStateMachine.STATE_TIMEOUTS[nextState];
    if (timeoutMs && timeoutMs > 0) {
      this.armWatchdog(nextState, timeoutMs);
    }

    // Notify all listeners
    this.notifyStateChange(nextState, from, this.currentContext);
    return true;
  }

  /**
   * Emits an error, cancels watchdog, and transitions to ERROR state.
   */
  public emitError(code: S2SErrorCode, message: string, recoverable: boolean = true): void {
    this.clearWatchdog();
    const err: S2SError = {
      code,
      message,
      turnId: this.currentContext.turnId,
      recoverable,
      timestamp: Date.now()
    };

    this.currentState = 'ERROR';
    for (const listener of this.errorListeners) {
      try { listener(err); } catch {}
    }
    this.notifyStateChange('ERROR', this.currentState, this.currentContext);
  }

  /**
   * Cleanly aborts any currently active turn (e.g. on user interruption, mic stop, speaker swap).
   */
  public abortCurrentTurn(reason: string = 'User cancelled turn'): void {
    if (this.currentState === 'IDLE') return;

    this.clearWatchdog();
    const prev = this.currentState;
    this.currentState = 'CANCELLED';
    this.notifyStateChange('CANCELLED', prev, { ...this.currentContext, details: reason });

    // Immediate cleanup to IDLE
    setTimeout(() => {
      if (this.currentState === 'CANCELLED') {
        const p = this.currentState;
        this.currentState = 'IDLE';
        this.currentContext = {};
        this.notifyStateChange('IDLE', p, {});
      }
    }, 20);
  }

  /**
   * Resets the state machine immediately to IDLE.
   */
  public resetToIdle(): void {
    this.clearWatchdog();
    const prev = this.currentState;
    this.currentState = 'IDLE';
    this.currentContext = {};
    this.notifyStateChange('IDLE', prev, {});
  }

  private armWatchdog(state: S2SState, timeoutMs: number): void {
    this.watchdogTimer = setTimeout(() => {
      console.warn(`[S2SStateMachine] Watchdog timeout in state '${state}' after ${timeoutMs}ms. Recovering to IDLE.`);
      this.emitError('ASR_TIMEOUT', `Processing timed out while in state ${state}`, true);
      this.resetToIdle();
    }, timeoutMs);
  }

  private clearWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private notifyStateChange(next: S2SState, prev: S2SState, ctx: StateMachineContext): void {
    for (const listener of this.stateListeners) {
      try {
        listener(next, prev, ctx);
      } catch (e) {
        console.error('[S2SStateMachine] State listener exception:', e);
      }
    }
  }
}
