/**
 * Bhasha Setu — S2S High-Level Turn Controller
 * 
 * Orchestrates the full Conversational Dialogue Lifecycle:
 * 1. Generates unique Turn IDs and sets Turn Lock
 * 2. Coordinates ASR -> Translation -> Domain Safety -> Audio Playback
 * 3. Drops stale responses from cancelled / expired turns
 * 4. Persists turn records to IndexedDB and enqueues offline sync
 * 5. Provides clean observer callbacks for the React UI layer
 */

import {
  S2SState,
  SpeakerRole,
  S2STurnRecord,
  TurnMetadata,
  S2SError
} from './s2sTypes';
import { S2SStateMachine } from './s2sStateMachine';
import { LanguageCapabilityRegistry } from './languageRegistry';
import { S2SASRAdapter } from './asrAdapter';
import { TranslationDecisionEngine } from './translationDecisionEngine';
import { DomainSafetyEngine } from './domainSafetyEngine';
import { S2STTSEngine } from './ttsEngine';
import { S2SStorage } from './s2sStorage';
import { S2SAutoStopController } from './autoStopController';

export interface TurnControllerCallbacks {
  onStateChange?: (state: S2SState, turnId?: string) => void;
  onInterimText?: (interim: string, speaker: SpeakerRole) => void;
  onTurnComplete?: (record: S2STurnRecord) => void;
  onStatusMessage?: (message: string | null) => void;
  onGuardrailNotice?: (notice: string | null) => void;
  onSpeakingTurnIdChange?: (turnId: string | null) => void;
  onError?: (error: S2SError) => void;
}

export class S2STurnController {
  private stateMachine: S2SStateMachine;
  private asrAdapter: S2SASRAdapter;
  private callbacks: TurnControllerCallbacks;

  private conversationId: string;
  private currentTurnId: string | null = null;
  private activeSpeaker: SpeakerRole | null = null;
  private autoSpeak: boolean = true;
  private voiceSpeed: number = 0.9;
  private isStartingTurn: boolean = false;
  private autoStopController: S2SAutoStopController;

  constructor(callbacks: TurnControllerCallbacks = {}) {
    this.callbacks = callbacks;
    this.stateMachine = new S2SStateMachine();
    this.conversationId = `conv-${Date.now()}`;

    // Initialize Auto-Stop Controller
    this.autoStopController = new S2SAutoStopController({
      onAutoStop: (_reason, turnId) => {
        if (this.currentTurnId === turnId && this.stateMachine.isListening()) {
          this.callbacks.onStatusMessage?.('Processing speech after silence...');
          this.stopListening();
        }
      }
    });

    // Forward state changes
    this.stateMachine.onStateChange((state, _prev, ctx) => {
      this.callbacks.onStateChange?.(state, ctx?.turnId);
    });

    this.stateMachine.onError((err) => {
      this.callbacks.onError?.(err);
      this.callbacks.onStatusMessage?.(err.message);
    });

    // Initialize ASR Adapter
    this.asrAdapter = new S2SASRAdapter({
      onInterim: (text, turnId) => {
        if (this.currentTurnId === turnId && this.activeSpeaker) {
          this.autoStopController.onSpeechDetected();
          this.callbacks.onInterimText?.(text, this.activeSpeaker);
        }
      },
      onVadActivity: (isSpeaking, rms, turnId) => {
        if (this.currentTurnId === turnId && this.activeSpeaker) {
          this.autoStopController.onSpeechFrame(isSpeaking, rms);
        }
      },
      onSpeechStart: (turnId) => {
        if (this.currentTurnId === turnId && this.activeSpeaker) {
          this.autoStopController.onSpeechDetected();
        }
      },
      onSpeechEnd: (turnId) => {
        if (this.currentTurnId === turnId && this.activeSpeaker) {
          this.autoStopController.onSpeechEnded();
        }
      },
      onFinal: (result) => {
        if (this.currentTurnId === result.turnId && this.activeSpeaker) {
          this.handleASRFinalized(result);
        }
      },
      onError: (err) => {
        if (this.currentTurnId === err.turnId) {
          this.autoStopController.cancel();
          this.stateMachine.emitError(err.code, err.message);
          this.stopTurn();
        }
      }
    });

    // Pre-initialize storage
    S2SStorage.init().catch(() => {});
  }

  public setAutoSpeak(enabled: boolean): void {
    this.autoSpeak = enabled;
  }

  public setVoiceSpeed(speed: number): void {
    this.voiceSpeed = Math.max(0.7, Math.min(1.3, speed));
  }

  public getActiveSpeaker(): SpeakerRole | null {
    return this.activeSpeaker;
  }

  public getState(): S2SState {
    return this.stateMachine.getState();
  }

  /**
   * Initiates a new spoken turn for Speaker A or Speaker B.
   */
  public async startTurn(
    speaker: SpeakerRole,
    sourceLang: string,
    targetLang: string,
    sourceLangName: string,
    speakerRoleText: string
  ): Promise<boolean> {
    if (this.isStartingTurn) {
      return false;
    }
    this.isStartingTurn = true;

    try {
      // 1. Guardrail Check (Ethical gating on Mundari & Ho)
      const notice = LanguageCapabilityRegistry.getGuardrailNotice(sourceLang);
      if (notice) {
        this.callbacks.onGuardrailNotice?.(notice);
        return false;
      }
      this.callbacks.onGuardrailNotice?.(null);

      // 2. Turn-Lock: Cleanly terminate any active session
      this.stopTurn();

      const turnId = `turn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      this.currentTurnId = turnId;
      this.activeSpeaker = speaker;

      const started = this.stateMachine.transitionTo('LISTENING', {
        turnId,
        speakerRole: speakerRoleText,
        sourceLang,
        targetLang
      });

      if (!started) return false;

      this.callbacks.onStatusMessage?.(`Listening to ${sourceLangName}... Speak clearly.`);

      await this.asrAdapter.startListening(sourceLang, turnId);
      this.autoStopController.start(turnId);
      return true;
    } catch (e: any) {
      this.autoStopController.cancel();
      this.stateMachine.emitError('MICROPHONE_ERROR', `Microphone start failed: ${e?.message || e}`);
      this.stopTurn();
      return false;
    } finally {
      this.isStartingTurn = false;
    }
  }

  /**
   * Manually stops active listening and triggers finalization.
   */
  public stopListening(): void {
    this.autoStopController.manualStop();
    if (this.stateMachine.isListening()) {
      this.stateMachine.transitionTo('PROCESSING_AUDIO', { turnId: this.currentTurnId || undefined });
      this.asrAdapter.stopListening();
    }
  }

  /**
   * Completely stops/aborts any active turn and resets state to IDLE.
   */
  public stopTurn(): void {
    this.autoStopController.cancel();
    this.asrAdapter.stopListening();
    S2STTSEngine.stop();
    this.stateMachine.abortCurrentTurn();
    this.activeSpeaker = null;
    this.currentTurnId = null;
    this.callbacks.onSpeakingTurnIdChange?.(null);
    this.callbacks.onStatusMessage?.(null);
    this.callbacks.onInterimText?.('', 'speakerA');
  }

  public getAutoStopController(): S2SAutoStopController {
    return this.autoStopController;
  }

  /**
   * Processes a manual phrase (from one-tap verified phrase quick-dial or text input).
   */
  public async processPhraseDirect(
    speaker: SpeakerRole,
    text: string,
    sourceLang: string,
    targetLang: string,
    sourceLangName: string,
    speakerRoleText: string
  ): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    this.stopTurn();

    const turnId = `turn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.currentTurnId = turnId;
    this.activeSpeaker = speaker;

    this.stateMachine.transitionTo('ASR_PROCESSING', { turnId });

    await this.handleASRFinalized({
      transcript: trimmed,
      asrConfidence: 0.99, // Verified phrase
      language: sourceLang,
      engine: 'One-Tap Curated Phrasebook',
      latencyMs: 0,
      isFinal: true,
      turnId,
      wordCount: trimmed.split(/\s+/).filter(Boolean).length
    }, {
      sourceLang,
      targetLang,
      sourceLangName,
      speakerRoleText
    });
  }

  private async handleASRFinalized(
    asrResult: any,
    manualOverrides?: {
      sourceLang: string;
      targetLang: string;
      sourceLangName: string;
      speakerRoleText: string;
    }
  ): Promise<void> {
    const turnId = asrResult.turnId;
    if (this.currentTurnId !== turnId) return;

    const ctx = this.stateMachine.getContext();
    const sourceLang = manualOverrides?.sourceLang || ctx.sourceLang || 'hin';
    const targetLang = manualOverrides?.targetLang || ctx.targetLang || 'sat';
    const sourceLangName = manualOverrides?.sourceLangName || 'Source';
    const speakerRoleText = manualOverrides?.speakerRoleText || (this.activeSpeaker === 'speakerA' ? 'Person A' : 'Person B');

    // 1. Check for empty transcript
    if (!asrResult.transcript) {
      this.stateMachine.resetToIdle();
      this.activeSpeaker = null;
      this.currentTurnId = null;
      this.callbacks.onStatusMessage?.(null);
      this.callbacks.onInterimText?.('', 'speakerA');
      return;
    }

    // 2. Transition to TRANSLATING
    this.stateMachine.transitionTo('TRANSLATING', { turnId });
    this.callbacks.onStatusMessage?.('Translating on-device...');

    const translationRes = await TranslationDecisionEngine.resolveTranslation(
      asrResult.transcript,
      sourceLang,
      targetLang
    );

    // Turn safety check
    if (this.currentTurnId !== turnId) return;

    // 3. Transition to SAFETY_CHECK
    this.stateMachine.transitionTo('SAFETY_CHECK', { turnId });

    const reliability = DomainSafetyEngine.evaluateTurnReliability(
      asrResult.asrConfidence,
      translationRes.translationConfidence,
      translationRes.method,
      asrResult.transcript,
      translationRes.targetText
    );

    const now = new Date();
    const metadata: TurnMetadata = {
      conversationId: this.conversationId,
      turnId,
      speakerId: this.activeSpeaker!,
      speakerRole: speakerRoleText,
      sourceLang,
      targetLang,
      sourceLangName,
      timestamp: Date.now(),
      timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      versionInfo: {
        translationDbVersion: 'v2.4',
        lexiconVersion: '6,780-verified',
        asrModelVersion: 'IndicConformer-ONNX-int8',
        ttsVersion: 'phonetic-roman-bridge-v2'
      }
    };

    const turnRecord: S2STurnRecord = {
      metadata,
      asr: asrResult,
      translation: translationRes,
      reliability,
      verificationStatus: 'AI_OUTPUT',
      audioPlaybackAvailable: true,
      totalLatencyMs: asrResult.latencyMs + translationRes.latencyMs
    };

    // Save to IndexedDB
    S2SStorage.saveTurn(turnRecord).catch(() => {});

    // Commit to UI
    this.callbacks.onTurnComplete?.(turnRecord);
    this.callbacks.onStatusMessage?.(null);
    this.callbacks.onInterimText?.('', 'speakerA');

    // 4. Auto-Speak if enabled
    if (this.autoSpeak && translationRes.targetText) {
      this.stateMachine.transitionTo('TTS_PROCESSING', { turnId });
      this.callbacks.onSpeakingTurnIdChange?.(turnId);

      this.stateMachine.transitionTo('PLAYING', { turnId });
      S2STTSEngine.play(
        translationRes.targetText,
        targetLang,
        turnId,
        {
          rate: this.voiceSpeed,
          onEnd: () => {
            if (this.currentTurnId === turnId) {
              this.callbacks.onSpeakingTurnIdChange?.(null);
              this.stateMachine.resetToIdle();
              this.activeSpeaker = null;
              this.currentTurnId = null;
            }
          },
          onError: () => {
            if (this.currentTurnId === turnId) {
              this.callbacks.onSpeakingTurnIdChange?.(null);
              this.stateMachine.resetToIdle();
              this.activeSpeaker = null;
              this.currentTurnId = null;
            }
          }
        }
      );
    } else {
      this.stateMachine.resetToIdle();
      this.activeSpeaker = null;
      this.currentTurnId = null;
    }
  }

  /**
   * Explicitly plays speech for any historical turn message.
   */
  public playMessageAudio(text: string, langCode: string, msgId: string): void {
    S2STTSEngine.play(text, langCode, msgId, {
      rate: this.voiceSpeed,
      onStart: () => this.callbacks.onSpeakingTurnIdChange?.(msgId),
      onEnd: () => this.callbacks.onSpeakingTurnIdChange?.(null),
      onError: () => this.callbacks.onSpeakingTurnIdChange?.(null)
    });
  }

  /**
   * Saves a human correction for a specific turn.
   */
  public async saveCorrection(
    turnId: string,
    correctedOriginal: string,
    correctedTranslated: string
  ): Promise<void> {
    await S2SStorage.updateTurnCorrection(turnId, correctedOriginal, correctedTranslated, 'USER_CORRECTED');
  }
}
