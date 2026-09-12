/**
 * Bhasha Setu — Production Speech Queue & Turn Coordinator
 *
 * Implements atomic, chunked speech synthesis with:
 * - Turn / Request ID stamping protecting against stale callbacks & race conditions
 * - Continuous sentence-by-sentence queue execution with prosody pause intervals
 * - Immediate cancellation and active audio thread reset
 * - Per-chunk safety watchdog preventing audio render deadlocks
 * - Infallible fallback to acoustic feedback
 */

import {
  TTSPlaybackOptions,
  TTSQueueState,
  TTSChunk,
  TTSError
} from './types';
import { TTSChunker } from './chunker';
import { TTSVoiceRouter } from './voiceRouter';
import { BrowserResilience } from './resilience/browserResilience';
import { TTSDiagnostics } from './observability/ttsDiagnostics';
import { transliterateDevanagariToRoman } from './pronunciation/pronunciationEngine';

export class TTSQueue {
  private static currentState: TTSQueueState = 'IDLE';
  private static currentRequestId: string | null = null;
  private static activeChunks: TTSChunk[] = [];
  private static currentChunkIndex: number = 0;
  private static chunkWatchdogTimer: any = null;
  private static pauseTimer: any = null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static startTimeMs: number = 0;

  /**
   * Dispatches speech playback through the robust chunked queue.
   */
  public static play(
    text: string,
    langCode: string,
    options: TTSPlaybackOptions = {}
  ): void {
    if (!text || !text.trim()) {
      options.onEnd?.();
      return;
    }

    // Terminate any previous utterance or racing queue
    this.stop();

    const requestId = options.turnId || `tts-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.currentRequestId = requestId;
    this.currentState = 'PROCESSING';
    this.startTimeMs = Date.now();

    // 1. Chunk text into natural sentence / clause segments
    const chunks = TTSChunker.chunkText(text, langCode);
    if (chunks.length === 0) {
      this.currentState = 'IDLE';
      this.currentRequestId = null;
      options.onEnd?.();
      return;
    }

    this.activeChunks = chunks;
    this.currentChunkIndex = 0;

    TTSDiagnostics.recordRequest(langCode, 'BROWSER_NATIVE_OR_BRIDGE', chunks.length);
    options.onStart?.();

    // 2. Begin playback
    this.currentState = 'PLAYING';
    BrowserResilience.startKeepAlive();
    this.playChunk(this.currentChunkIndex, langCode, requestId, options);
  }

  /**
   * Plays an individual chunk and schedules the next chunk upon completion.
   */
  private static playChunk(
    index: number,
    langCode: string,
    requestId: string,
    options: TTSPlaybackOptions
  ): void {
    // Check if request was cancelled or superseded
    if (this.currentRequestId !== requestId || this.currentState !== 'PLAYING') {
      return;
    }

    // Check if all chunks completed
    if (index >= this.activeChunks.length) {
      this.completePlayback(requestId, options);
      return;
    }

    const chunk = this.activeChunks[index];
    options.onChunkStart?.(index, this.activeChunks.length);

    // Verify browser SpeechSynthesis support
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      console.warn('[TTSQueue] Web Speech API unavailable; falling back to acoustic chime.');
      TTSDiagnostics.recordFallback();
      BrowserResilience.playAcousticChime(() => {
        if (this.currentRequestId === requestId) {
          this.completePlayback(requestId, options);
        }
      });
      return;
    }

    try {
      const { voice, voiceLang } = TTSVoiceRouter.selectOptimalVoice(langCode);
      let textToSpeak = chunk.spokenText || chunk.text;

      // Special case: Hindi text when no native Hindi voice exists on device
      const code = langCode.toLowerCase().trim();
      const hasHindiVoice = voice && voice.lang.toLowerCase().startsWith('hi');
      if ((code === 'hin' || code === 'hindi') && !hasHindiVoice) {
        textToSpeak = transliterateDevanagariToRoman(textToSpeak);
      }

      // Create and configure utterance
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      this.currentUtterance = utterance;
      utterance.voice = voice;
      utterance.lang = voice ? voice.lang : voiceLang;
      utterance.rate = Math.max(0.5, Math.min(1.5, options.rate ?? 0.9));
      utterance.pitch = Math.max(0.5, Math.min(1.5, options.pitch ?? 1.0));
      utterance.volume = Math.max(0.0, Math.min(1.0, options.volume ?? 1.0));

      BrowserResilience.retainUtterance(utterance);

      // Scoped per-chunk watchdog (scaled by character count)
      const timeoutMs = Math.max(7000, textToSpeak.length * 220);
      this.chunkWatchdogTimer = setTimeout(() => {
        if (this.currentRequestId === requestId && this.currentUtterance === utterance) {
          console.warn(`[TTSQueue] Watchdog timeout on chunk ${index} (${textToSpeak.length} chars). Skipping to next chunk.`);
          TTSDiagnostics.recordFailure('SPEECH_TIMEOUT');
          this.cleanActiveUtterance();
          this.advanceNextChunk(index, langCode, requestId, options, 0);
        }
      }, timeoutMs);

      utterance.onend = () => {
        if (this.currentRequestId !== requestId) return;
        this.cleanActiveUtterance();
        this.advanceNextChunk(index, langCode, requestId, options, chunk.pauseAfterMs);
      };

      utterance.onerror = (e: any) => {
        if (this.currentRequestId !== requestId) return;
        this.cleanActiveUtterance();

        // Browser cancellation/interruption is expected during stop()
        if (e.error === 'interrupted' || e.error === 'canceled') {
          return;
        }

        console.warn(`[TTSQueue] Synthesis error on chunk ${index}:`, e.error);
        TTSDiagnostics.recordFailure('SPEECH_SYNTHESIS_FAILED');

        // Gracefully attempt next chunk or chime
        if (index === 0 && this.activeChunks.length === 1) {
          BrowserResilience.playAcousticChime(() => {
            this.completePlayback(requestId, options);
          });
        } else {
          this.advanceNextChunk(index, langCode, requestId, options, 0);
        }
      };

      // Chromium resume protection before speaking
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);

    } catch (err: any) {
      console.warn(`[TTSQueue] Exception dispatching chunk ${index}:`, err);
      TTSDiagnostics.recordFailure('BROWSER_ENGINE_ERROR');
      this.cleanActiveUtterance();

      const ttsError: TTSError = {
        code: 'BROWSER_ENGINE_ERROR',
        message: err?.message || 'Browser speech synthesis exception',
        originalError: err,
        timestamp: Date.now()
      };
      options.onError?.(ttsError);

      BrowserResilience.playAcousticChime(() => {
        this.completePlayback(requestId, options);
      });
    }
  }

  /**
   * Advances to the next chunk after a natural prosody pause.
   */
  private static advanceNextChunk(
    currentIndex: number,
    langCode: string,
    requestId: string,
    options: TTSPlaybackOptions,
    pauseMs: number
  ): void {
    if (this.currentRequestId !== requestId) return;

    if (pauseMs > 0) {
      this.pauseTimer = setTimeout(() => {
        if (this.currentRequestId === requestId) {
          this.playChunk(currentIndex + 1, langCode, requestId, options);
        }
      }, pauseMs);
    } else {
      this.playChunk(currentIndex + 1, langCode, requestId, options);
    }
  }

  /**
   * Cleans references and timers for the currently active utterance chunk.
   */
  private static cleanActiveUtterance(): void {
    if (this.chunkWatchdogTimer) {
      clearTimeout(this.chunkWatchdogTimer);
      this.chunkWatchdogTimer = null;
    }
    if (this.currentUtterance) {
      BrowserResilience.releaseUtterance(this.currentUtterance);
      this.currentUtterance = null;
    }
  }

  /**
   * Handles successful completion of all chunks in the queue.
   */
  private static completePlayback(requestId: string, options: TTSPlaybackOptions): void {
    if (this.currentRequestId !== requestId) return;

    const duration = Date.now() - this.startTimeMs;
    TTSDiagnostics.recordSuccess(duration);

    this.currentState = 'IDLE';
    this.currentRequestId = null;
    this.activeChunks = [];
    this.currentChunkIndex = 0;
    BrowserResilience.stopKeepAlive();

    options.onEnd?.();
  }

  /**
   * Immediately stops any active synthesis, clears the queue, and invalidates callbacks.
   */
  public static stop(): void {
    if (this.currentState === 'PLAYING' || this.currentState === 'PROCESSING') {
      TTSDiagnostics.recordCancellation();
    }

    this.currentRequestId = null;
    this.currentState = 'IDLE';
    this.activeChunks = [];
    this.currentChunkIndex = 0;

    if (this.chunkWatchdogTimer) {
      clearTimeout(this.chunkWatchdogTimer);
      this.chunkWatchdogTimer = null;
    }

    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    this.cleanActiveUtterance();
    BrowserResilience.resetBrowserSpeech();
  }

  public static isPlaying(): boolean {
    return this.currentState === 'PLAYING';
  }

  public static getQueueState(): TTSQueueState {
    return this.currentState;
  }

  public static getActiveRequestId(): string | null {
    return this.currentRequestId;
  }
}
