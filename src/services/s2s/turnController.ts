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
import { S2SAutoStopController, s2sDebugLog } from './autoStopController';
import { S2STurnLogger } from './s2sLogger';

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
  private finalizedTurnIds: Set<string> = new Set();

  constructor(callbacks: TurnControllerCallbacks = {}) {
    this.callbacks = callbacks;
    this.stateMachine = new S2SStateMachine();
    this.conversationId = `conv-${Date.now()}`;

    // Initialize Auto-Stop Controller
    this.autoStopController = new S2SAutoStopController({
      onAutoStop: (_reason, turnId) => {
        S2STurnLogger.log(turnId, 'VAD_ENDPOINT', { reason: _reason });
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
        if (this.currentTurnId === turnId && this.activeSpeaker && !this.finalizedTurnIds.has(turnId)) {
          this.autoStopController.onSpeechDetected();
          this.callbacks.onInterimText?.(text, this.activeSpeaker);
        }
      },
      onVadActivity: (isSpeaking, rms, turnId) => {
        if (this.currentTurnId === turnId && this.activeSpeaker && !this.finalizedTurnIds.has(turnId)) {
          this.autoStopController.onSpeechFrame(isSpeaking, rms);
        }
      },
      onSpeechStart: (turnId) => {
        if (this.currentTurnId === turnId && this.activeSpeaker && !this.finalizedTurnIds.has(turnId)) {
          this.autoStopController.onSpeechDetected();
        }
      },
      onSpeechEnd: (turnId) => {
        if (this.currentTurnId === turnId && this.activeSpeaker && !this.finalizedTurnIds.has(turnId)) {
          S2STurnLogger.log(turnId, 'VAD_SILENCE_START');
          this.autoStopController.onSpeechEnded();
        }
      },
      onFinal: (result) => {
        if (this.currentTurnId === result.turnId && this.activeSpeaker && !this.finalizedTurnIds.has(result.turnId)) {
          this.finalizeTurn(result);
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
      S2STurnLogger.log(turnId, 'TURN_ID', { speaker, sourceLang, targetLang, speakerRoleText });

      const started = this.stateMachine.transitionTo('LISTENING', {
        turnId,
        speakerRole: speakerRoleText,
        sourceLang,
        targetLang
      });

      if (!started) return false;

      this.callbacks.onStatusMessage?.(`Listening to ${sourceLangName}... Speak clearly.`);
      S2STTSEngine.prewarmVoices();

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
    this.asrAdapter.abortTurn();
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

    await this.finalizeTurn({
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

  /**
   * Authoritative, idempotent single-flight finalization pipeline (Phase 2 & Phase 7).
   * Converges all finalization sources (VAD endpoint, ASR final, onend, fallback timeout).
   */
  public async finalizeTurn(
    asrResult: any,
    manualOverrides?: {
      sourceLang: string;
      targetLang: string;
      sourceLangName: string;
      speakerRoleText: string;
    }
  ): Promise<void> {
    const turnId = asrResult?.turnId;
    if (!turnId || this.currentTurnId !== turnId || this.finalizedTurnIds.has(turnId)) {
      return;
    }
    this.finalizedTurnIds.add(turnId);

    s2sDebugLog(turnId, `handleASRFinalized transcript="${asrResult.transcript}"`);
    S2STurnLogger.log(turnId, 'FINALIZE_START', { transcript: asrResult.transcript, confidence: asrResult.asrConfidence });

    const ctx = this.stateMachine.getContext();
    const sourceLang = manualOverrides?.sourceLang || ctx.sourceLang || 'hin';
    const targetLang = manualOverrides?.targetLang || ctx.targetLang || 'sat';
    const sourceLangName = manualOverrides?.sourceLangName || 'Source';
    const speakerRoleText = manualOverrides?.speakerRoleText || (this.activeSpeaker === 'speakerA' ? 'Person A' : 'Person B');

    // 1. Check for empty transcript
    const rawTranscript = (asrResult.transcript || '').trim();
    if (!rawTranscript) {
      s2sDebugLog(turnId, 'No speech detected, resetting to IDLE');
      S2STurnLogger.log(turnId, 'IDLE', { reason: 'empty_transcript' });
      this.stateMachine.resetToIdle();
      this.activeSpeaker = null;
      this.currentTurnId = null;
      this.callbacks.onStatusMessage?.('No speech detected. Please try again.');
      setTimeout(() => {
        if (!this.currentTurnId) {
          this.callbacks.onStatusMessage?.(null);
        }
      }, 4000);
      this.callbacks.onInterimText?.('', 'speakerA');
      return;
    }

    // 2. Transition to TRANSLATING
    s2sDebugLog(turnId, 'state=TRANSLATING');
    this.stateMachine.transitionTo('TRANSLATING', { turnId });
    this.callbacks.onStatusMessage?.('Translating speech...');
    S2STurnLogger.log(turnId, 'TRANSLATION_START', { sourceLang, targetLang, rawTranscript });

    const translationRes = await TranslationDecisionEngine.resolveTranslation(
      rawTranscript,
      sourceLang,
      targetLang
    );

    S2STurnLogger.log(turnId, 'TRANSLATION_END', {
      targetText: translationRes.targetText,
      confidence: translationRes.translationConfidence,
      method: translationRes.method
    });

    // Turn safety check
    if (this.currentTurnId !== turnId) return;

    // 3. Transition to SAFETY_CHECK
    s2sDebugLog(turnId, 'state=SAFETY_CHECK');
    this.stateMachine.transitionTo('SAFETY_CHECK', { turnId });

    const reliability = DomainSafetyEngine.evaluateTurnReliability(
      asrResult.asrConfidence,
      translationRes.translationConfidence,
      translationRes.method,
      rawTranscript,
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
        asrModelVersion: 'IndicConformer-ONNX-int8 / Faster-Whisper-Base',
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

    // 4. Auto-Speak if enabled and valid target text exists (never speak unavailable message)
    const isUnavailable = !translationRes.targetText || 
      translationRes.targetText.includes('unavailable') || 
      translationRes.translationConfidence === 0.0;

    if (this.autoSpeak && translationRes.targetText && !isUnavailable) {
      s2sDebugLog(turnId, 'state=TTS_PROCESSING');
      this.stateMachine.transitionTo('TTS_PROCESSING', { turnId });
      this.callbacks.onSpeakingTurnIdChange?.(turnId);

      s2sDebugLog(turnId, 'state=PLAYING');
      this.stateMachine.transitionTo('PLAYING', { turnId });
      S2STurnLogger.log(turnId, 'TTS_START', { targetText: translationRes.targetText, targetLang });

      S2STTSEngine.play(
        translationRes.targetText,
        targetLang,
        turnId,
        {
          rate: this.voiceSpeed,
          onStart: () => {
            S2STurnLogger.log(turnId, 'TTS_PLAYBACK_START');
            this.callbacks.onSpeakingTurnIdChange?.(turnId);
          },
          onEnd: () => {
            if (this.currentTurnId === turnId) {
              s2sDebugLog(turnId, 'TTS complete -> state=IDLE');
              S2STurnLogger.log(turnId, 'TTS_PLAYBACK_END');
              S2STurnLogger.log(turnId, 'IDLE');
              this.callbacks.onSpeakingTurnIdChange?.(null);
              this.stateMachine.resetToIdle();
              this.activeSpeaker = null;
              this.currentTurnId = null;
            }
          },
          onError: () => {
            if (this.currentTurnId === turnId) {
              s2sDebugLog(turnId, 'TTS error -> state=IDLE');
              S2STurnLogger.log(turnId, 'TTS_PLAYBACK_END', { error: true });
              S2STurnLogger.log(turnId, 'IDLE');
              this.callbacks.onSpeakingTurnIdChange?.(null);
              this.stateMachine.resetToIdle();
              this.activeSpeaker = null;
              this.currentTurnId = null;
            }
          }
        }
      );
    } else {
      s2sDebugLog(turnId, 'state=IDLE');
      S2STurnLogger.log(turnId, 'IDLE');
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
