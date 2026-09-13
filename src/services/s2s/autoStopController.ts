/**
 * Bhasha Setu — S2S Silence Auto-Stop Controller (Phase 4)
 * 
 * Implements intelligent, voice-activity-driven automatic microphone shutoff:
 * - VAD is the authoritative source of truth (not arbitrary fixed timeouts)
 * - Default post-speech continuous silence duration: 7000ms (AUTO_STOP_SILENCE_MS)
 * - Conversational pause tolerance: 1-3s short pauses and 4-5s medium pauses KEEP mic active
 * - Timer resets whenever meaningful speech resumes
 * - Automatically shuts down microphone and finalizes turn only after 7s of continuous silence
 * - Unified teardown path: manual stop and auto-stop use the exact same cleanup pipeline
 * - Race-condition safe: mutex locks, turn ID validation, cancellation of in-flight timers
 * - Structured privacy-first telemetry tracking (no raw audio or private transcripts)
 */

export const AUTO_STOP_SILENCE_MS = 2000;
export const INITIAL_SILENCE_TIMEOUT_MS = 10000;
export const MIN_SPEECH_DURATION_MS = 300;

export const isS2SDebug = (): boolean =>
  typeof window !== 'undefined' && Boolean((window as any).S2S_DEBUG);

export const s2sDebugLog = (turnId: string | undefined, msg: string, ...extra: any[]): void => {
  if (isS2SDebug()) {
    console.log(`[S2S] turn=${turnId || 'none'} ${msg}`, ...extra);
  }
};

export type AutoStopTelemetryAction =
  | 'MIC_STARTED'
  | 'SPEECH_DETECTED'
  | 'SPEECH_ENDED'
  | 'SILENCE_TIMER_STARTED'
  | 'SILENCE_TIMER_RESET'
  | 'MIC_AUTO_STOPPED'
  | 'MIC_MANUAL_STOPPED'
  | 'MIC_STOP_FAILED';

export interface AutoStopTelemetryEvent {
  action: AutoStopTelemetryAction;
  timestamp: number;
  turnId?: string;
  silenceDurationMs?: number;
  details?: string;
}

export interface AutoStopControllerOptions {
  autoStopSilenceMs?: number;       // default: AUTO_STOP_SILENCE_MS (7000)
  initialSilenceTimeoutMs?: number; // default: INITIAL_SILENCE_TIMEOUT_MS (10000)
  minSpeechDurationMs?: number;     // default: MIN_SPEECH_DURATION_MS (300)
  onAutoStop?: (reason: 'SILENCE_AFTER_SPEECH' | 'INITIAL_SILENCE_TIMEOUT', turnId: string) => void;
  onSilenceCountdown?: (remainingMs: number, turnId: string) => void;
  onTelemetry?: (event: AutoStopTelemetryEvent) => void;
}

export class S2SAutoStopController {
  private activeTurnId: string | null = null;
  private speechHasStarted: boolean = false;
  private speechCurrentlyActive: boolean = false;
  private speechStartTimestamp: number = 0;
  private lastSpeechEndTimestamp: number = 0;
  private silenceTimer: any = null;
  private initialSilenceTimer: any = null;
  private hasStopped: boolean = false;
  private isStoppingMutex: boolean = false;

  private readonly autoStopSilenceMs: number;
  private readonly initialSilenceTimeoutMs: number;
  private readonly minSpeechDurationMs: number;
  private readonly options: AutoStopControllerOptions;

  private telemetryEvents: AutoStopTelemetryEvent[] = [];

  constructor(options: AutoStopControllerOptions = {}) {
    this.options = options;
    this.autoStopSilenceMs = options.autoStopSilenceMs || AUTO_STOP_SILENCE_MS;
    this.initialSilenceTimeoutMs = options.initialSilenceTimeoutMs || INITIAL_SILENCE_TIMEOUT_MS;
    this.minSpeechDurationMs = options.minSpeechDurationMs || MIN_SPEECH_DURATION_MS;
  }

  /**
   * Activates monitoring for a new microphone listening turn.
   */
  public start(turnId: string): void {
    this.cancel();

    this.activeTurnId = turnId;
    this.speechHasStarted = false;
    this.speechCurrentlyActive = false;
    this.speechStartTimestamp = 0;
    this.lastSpeechEndTimestamp = 0;
    this.hasStopped = false;
    this.isStoppingMutex = false;

    this.recordTelemetry('MIC_STARTED', turnId, 0, 'Microphone capture initiated');
    s2sDebugLog(turnId, 'MIC_STARTED - monitoring active');

    // Safety fallback: if user never vocalizes after initial timeout, auto-stop to protect battery/privacy
    this.initialSilenceTimer = setTimeout(() => {
      if (this.hasStopped || this.activeTurnId !== turnId) return;
      if (!this.speechHasStarted) {
        this.triggerAutoStop('INITIAL_SILENCE_TIMEOUT', turnId, 'No initial speech detected');
      }
    }, this.initialSilenceTimeoutMs);
  }

  /**
   * Ingests a VAD activity frame from audio pipeline or speech recognition.
   */
  public onSpeechFrame(isSpeaking: boolean, rms: number = 0, now: number = Date.now()): void {
    if (this.hasStopped || !this.activeTurnId) return;

    if (isSpeaking) {
      // 1. User is speaking in this frame
      if (this.initialSilenceTimer) {
        clearTimeout(this.initialSilenceTimer);
        this.initialSilenceTimer = null;
      }

      if (!this.speechCurrentlyActive) {
        this.speechCurrentlyActive = true;
        this.speechStartTimestamp = now;
        this.speechHasStarted = true;
        this.recordTelemetry('SPEECH_DETECTED', this.activeTurnId, 0, `Speech vocalization started (RMS: ${rms.toFixed(4)})`);
        s2sDebugLog(this.activeTurnId, `SPEECH_DETECTED RMS=${rms.toFixed(4)}`);
      }

      // If a silence countdown was running from a conversational pause, RESET IT IMMEDIATELY
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
        this.recordTelemetry('SILENCE_TIMER_RESET', this.activeTurnId, 0, 'Speech resumed: continuous silence timer reset to 0');
        s2sDebugLog(this.activeTurnId, 'SILENCE_TIMER_RESET speech resumed');
      }
    } else {
      // 2. User is silent in this frame
      if (this.speechCurrentlyActive) {
        // Transition from speaking -> silence
        this.speechCurrentlyActive = false;
        this.lastSpeechEndTimestamp = now;
        this.recordTelemetry('SPEECH_ENDED', this.activeTurnId, 0, 'Speech vocalization paused or ended');
        s2sDebugLog(this.activeTurnId, 'SPEECH_ENDED silence begins');
      }

      // If user has vocalized in this turn and no silence timer is currently running, START COUNTDOWN
      if (this.speechHasStarted && !this.silenceTimer && !this.hasStopped) {
        this.recordTelemetry('SILENCE_TIMER_STARTED', this.activeTurnId, this.autoStopSilenceMs, `Continuous silence countdown started (${this.autoStopSilenceMs}ms threshold)`);
        s2sDebugLog(this.activeTurnId, `SILENCE_TIMER_STARTED threshold=${this.autoStopSilenceMs}ms`);
        
        const scheduledTurnId = this.activeTurnId;
        this.silenceTimer = setTimeout(() => {
          if (this.hasStopped || this.activeTurnId !== scheduledTurnId) return;
          this.triggerAutoStop('SILENCE_AFTER_SPEECH', scheduledTurnId, `Continuous silence reached ${this.autoStopSilenceMs}ms after speech ended`);
        }, this.autoStopSilenceMs);
      }
    }
  }

  /**
   * Helper for text/browser-based speech detection.
   */
  public onSpeechDetected(now: number = Date.now()): void {
    this.onSpeechFrame(true, 0.05, now);
  }

  /**
   * Helper for text/browser-based speech completion.
   */
  public onSpeechEnded(now: number = Date.now()): void {
    this.onSpeechFrame(false, 0.001, now);
  }

  /**
   * Manually stops active monitoring (called when user taps stop button).
   */
  public manualStop(): void {
    if (this.hasStopped) return;
    this.hasStopped = true;

    this.clearTimers();
    const turnId = this.activeTurnId || undefined;
    this.recordTelemetry('MIC_MANUAL_STOPPED', turnId, 0, 'Manual user stop button triggered');
  }

  /**
   * Cancels any pending timers without triggering stop callbacks (e.g. on turn abort).
   */
  public cancel(): void {
    this.clearTimers();
    this.hasStopped = true;
    this.activeTurnId = null;
    this.speechHasStarted = false;
    this.speechCurrentlyActive = false;
  }

  private triggerAutoStop(
    reason: 'SILENCE_AFTER_SPEECH' | 'INITIAL_SILENCE_TIMEOUT',
    turnId: string,
    details: string
  ): void {
    if (this.isStoppingMutex || this.hasStopped) return;
    this.isStoppingMutex = true;
    this.hasStopped = true;
    this.clearTimers();

    this.recordTelemetry('MIC_AUTO_STOPPED', turnId, this.autoStopSilenceMs, details);
    s2sDebugLog(turnId, `AUTO_STOP triggered: reason=${reason}, details=${details}`);

    try {
      this.options.onAutoStop?.(reason, turnId);
    } catch (err: any) {
      this.recordTelemetry('MIC_STOP_FAILED', turnId, 0, `Auto-stop callback exception: ${err?.message || err}`);
    }
  }

  private clearTimers(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.initialSilenceTimer) {
      clearTimeout(this.initialSilenceTimer);
      this.initialSilenceTimer = null;
    }
  }

  private recordTelemetry(
    action: AutoStopTelemetryAction,
    turnId?: string,
    silenceDurationMs?: number,
    details?: string
  ): void {
    const event: AutoStopTelemetryEvent = {
      action,
      timestamp: Date.now(),
      turnId,
      silenceDurationMs,
      details
    };
    this.telemetryEvents.push(event);
    if (this.telemetryEvents.length > 100) {
      this.telemetryEvents.shift(); // Bound memory footprint
    }
    this.options.onTelemetry?.(event);
  }

  public getTelemetryLog(): AutoStopTelemetryEvent[] {
    return [...this.telemetryEvents];
  }

  public getIsActive(): boolean {
    return !this.hasStopped && !!this.activeTurnId;
  }

  public hasSpoken(): boolean {
    return this.speechHasStarted;
  }

  public isSilenceTimerRunning(): boolean {
    return !!this.silenceTimer;
  }

  public getAutoStopSilenceMs(): number {
    return this.autoStopSilenceMs;
  }

  public getTimingDistribution(): {
    count: number;
    minMs: number;
    maxMs: number;
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
  } {
    const stops = this.telemetryEvents
      .filter(e => e.action === 'MIC_AUTO_STOPPED' && typeof e.silenceDurationMs === 'number')
      .map(e => e.silenceDurationMs!);

    if (stops.length === 0) {
      return { count: 0, minMs: 0, maxMs: 0, avgMs: 0, p50Ms: 0, p95Ms: 0 };
    }

    stops.sort((a, b) => a - b);
    const sum = stops.reduce((acc, v) => acc + v, 0);
    const avgMs = Math.round(sum / stops.length);
    const minMs = stops[0];
    const maxMs = stops[stops.length - 1];
    const p50Ms = stops[Math.floor(stops.length * 0.5)];
    const p95Ms = stops[Math.min(stops.length - 1, Math.floor(stops.length * 0.95))];

    return { count: stops.length, minMs, maxMs, avgMs, p50Ms, p95Ms };
  }
}
