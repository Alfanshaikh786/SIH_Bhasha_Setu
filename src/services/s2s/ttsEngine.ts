/**
 * Bhasha Setu — S2S Audio Playback & TTS Engine
 * 
 * Coordinates robust speech synthesis via pluggable TTS Adapters:
 * - Decouples conversation pipeline from specific synthesis engine
 * - Routes Santali through Phonetic Romanization bridge
 * - Routes Hindi/English through Native Indian-accented SpeechSynthesis
 * - Prepared for future on-device Santali Neural TTS models
 * - Autoplay restriction handling & interruption safety
 * - Watchdog timeout ensuring UI never hangs in 'speaking' state
 * - Infallible Web Audio API sine wave chime fallback
 */

import { TTSPlaybackOptions } from './s2sTypes';
import { TTSAdapterRegistry, ITTSAdapter } from './ttsAdapter';
import { TTSQueue } from '../tts';

export type { TTSPlaybackOptions } from './s2sTypes';

export class S2STTSEngine {
  private static isSpeakingNow = false;
  private static currentPlaybackTurnId: string | null = null;
  private static playbackWatchdog: any = null;

  /**
   * Pre-warms voices in the browser so initial playback has zero loading delay.
   */
  public static prewarmVoices(): void {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }
    } catch {}
  }

  /**
   * Speaks target text with speed control, adapter routing, and automatic safety cleanup.
   */
  public static play(
    text: string,
    langCode: string,
    turnId: string,
    options: TTSPlaybackOptions = {}
  ): void {
    if (!text || !text.trim()) {
      options.onEnd?.();
      return;
    }

    // Abort any prior playback
    this.stop();

    // Chromium unpause protection
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    } catch {}

    this.isSpeakingNow = true;
    this.currentPlaybackTurnId = turnId;
    options.onStart?.();

    // Dynamic Watchdog scaled to character length (6s to 15s max, avoiding 30s freeze)
    const timeoutMs = Math.max(6000, Math.min(15000, text.length * 140));
    this.playbackWatchdog = setTimeout(() => {
      if (this.isSpeakingNow && this.currentPlaybackTurnId === turnId) {
        console.warn(`[S2STTSEngine] Utterance watchdog timeout (${timeoutMs}ms), force stopping speech.`);
        this.stop();
        options.onEnd?.();
      }
    }, timeoutMs);

    const cleanup = () => {
      if (this.playbackWatchdog) {
        clearTimeout(this.playbackWatchdog);
        this.playbackWatchdog = null;
      }
      this.isSpeakingNow = false;
      this.currentPlaybackTurnId = null;
    };

    try {
      const adapter = TTSAdapterRegistry.getAdapterForLanguage(langCode);
      adapter.synthesize(text, langCode, {
        rate: options.rate || 0.9,
        onEnd: () => {
          cleanup();
          options.onEnd?.();
        },
        onError: (err: any) => {
          console.warn('[S2STTSEngine] Adapter synthesis error:', err);
          cleanup();
          options.onError?.(err);
          options.onEnd?.();
        }
      });
    } catch (e) {
      console.warn('[S2STTSEngine] Exception during adapter dispatch:', e);
      cleanup();
      options.onError?.(e);
      options.onEnd?.();
    }
  }

  /**
   * Immediately terminates any active speech synthesis across the entire application.
   */
  public static stop(): void {
    if (this.playbackWatchdog) {
      clearTimeout(this.playbackWatchdog);
      this.playbackWatchdog = null;
    }

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}

    try {
      TTSAdapterRegistry.getAdapterForLanguage('sat').stop();
      TTSAdapterRegistry.getAdapterForLanguage('hin').stop();
      TTSAdapterRegistry.getAdapterForLanguage('eng').stop();
    } catch {}

    try {
      TTSQueue.stop();
    } catch {}

    this.isSpeakingNow = false;
    this.currentPlaybackTurnId = null;
  }

  public static isPlaying(): boolean {
    return this.isSpeakingNow;
  }

  public static getActiveTurnId(): string | null {
    return this.currentPlaybackTurnId;
  }

  public static getActiveAdapter(langCode: string): ITTSAdapter {
    return TTSAdapterRegistry.getAdapterForLanguage(langCode);
  }
}
