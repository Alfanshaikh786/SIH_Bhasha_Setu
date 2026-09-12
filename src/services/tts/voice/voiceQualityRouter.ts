/**
 * Bhasha Setu — Voice Quality Scoring & Health Monitoring Router
 *
 * Implements deterministic voice scoring, health tracking, and temporary quarantine
 * with bounded recovery to protect speech playback from buggy or failing browser voices.
 */

import { TTSPlaybackInfo, VoiceHealthStatus } from '../types';
import { TTSVoiceRouter } from '../voiceRouter';

export interface VoiceQuarantineConfig {
  maxFailuresBeforeQuarantine: number;
  quarantineDurationMs: number;
}

export class VoiceQualityRouter {
  private static healthRegistry = new Map<string, VoiceHealthStatus>();
  public static readonly MAX_FAILURES_BEFORE_QUARANTINE = 3;
  public static readonly QUARANTINE_DURATION_MS = 45000; // 45 seconds

  private static config: VoiceQuarantineConfig = {
    maxFailuresBeforeQuarantine: 3,
    quarantineDurationMs: 45000
  };

  /**
   * Updates quarantine thresholds and recovery duration.
   */
  public static setQuarantineConfig(config: Partial<VoiceQuarantineConfig>): void {
    if (config.maxFailuresBeforeQuarantine !== undefined) {
      this.config.maxFailuresBeforeQuarantine = config.maxFailuresBeforeQuarantine;
    }
    if (config.quarantineDurationMs !== undefined) {
      this.config.quarantineDurationMs = config.quarantineDurationMs;
    }
  }

  /**
   * Retrieves active quarantine configuration.
   */
  public static getQuarantineConfig(): VoiceQuarantineConfig {
    return { ...this.config };
  }

  /**
   * Records a speech failure for a voice and applies temporary quarantine if threshold exceeded.
   */
  public static recordVoiceFailure(voiceName: string): void {
    if (!voiceName) return;

    const now = Date.now();
    const existing = this.healthRegistry.get(voiceName) || {
      voiceName,
      failureCount: 0,
      lastFailureTimestamp: now,
      isQuarantined: false,
      quarantineUntil: 0
    };

    existing.failureCount++;
    existing.lastFailureTimestamp = now;

    if (existing.failureCount >= this.config.maxFailuresBeforeQuarantine) {
      existing.isQuarantined = true;
      existing.quarantineUntil = now + this.config.quarantineDurationMs;
      console.warn(`[VoiceQualityRouter] Voice "${voiceName}" exceeded failure threshold (${this.config.maxFailuresBeforeQuarantine}). Quarantined for ${this.config.quarantineDurationMs}ms.`);
    }

    this.healthRegistry.set(voiceName, existing);
  }

  /**
   * Records successful speech synthesis, resetting the failure counter.
   */
  public static recordVoiceSuccess(voiceName: string): void {
    if (!voiceName) return;
    const existing = this.healthRegistry.get(voiceName);
    if (existing) {
      existing.failureCount = 0;
      existing.isQuarantined = false;
      existing.quarantineUntil = 0;
    }
  }

  /**
   * Checks if a voice is healthy and not currently quarantined.
   */
  public static isVoiceHealthy(voiceName: string): boolean {
    const status = this.healthRegistry.get(voiceName);
    if (!status) return true;

    if (status.isQuarantined) {
      if (Date.now() > status.quarantineUntil) {
        // Bounded trial recovery: quarantine expired
        status.isQuarantined = false;
        status.failureCount = 0;
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Evaluates and scores all available browser voices for the target language.
   */
  public static selectBestScoredVoice(langCode: string): {
    voice: SpeechSynthesisVoice | null;
    voiceLang: string;
    playbackInfo: TTSPlaybackInfo;
  } {
    const voices = TTSVoiceRouter.getVoices();
    const code = langCode.toLowerCase().trim();
    const isTribal = (code === 'sat' || code === 'santali' || code === 'unr' || code === 'hoc');
    const isHindi = (code === 'hin' || code === 'hindi' || code === 'hi');
    const isEnglish = (code === 'eng' || code === 'english' || code === 'en');
    const isBengali = (code === 'ben' || code === 'bn' || code === 'bengali');

    if (voices.length === 0) {
      const fallbackLang = isHindi ? 'hi-IN' : isBengali ? 'bn-IN' : 'en-IN';
      return {
        voice: null,
        voiceLang: fallbackLang,
        playbackInfo: TTSVoiceRouter.getSpeechEngineInfo(langCode)
      };
    }

    // Score all available voices
    const scoredVoices = voices.map(voice => {
      let score = 0;
      const vLang = voice.lang.toLowerCase();
      const healthy = this.isVoiceHealthy(voice.name);

      if (!healthy) {
        score -= 500; // Severe penalty for quarantined voice
      }

      if (isHindi) {
        if (vLang === 'hi-in') score += 100;
        else if (vLang.startsWith('hi')) score += 70;
        else if (vLang === 'en-in') score += 30; // Fallback Indian accent
      } else if (isBengali) {
        if (vLang === 'bn-in') score += 100;
        else if (vLang.startsWith('bn')) score += 70;
        else if (vLang === 'en-in') score += 30;
      } else if (isEnglish) {
        if (vLang === 'en-in') score += 100; // Prefer Indian English
        else if (vLang.startsWith('en')) score += 60;
      } else if (isTribal) {
        // Tribal languages use Indian English or Hindi acoustic voice bridge
        if (vLang === 'en-in') score += 100;
        else if (vLang === 'hi-in') score += 80;
        else if (vLang.startsWith('en')) score += 50;
      }

      if (voice.localService) score += 10;
      if (voice.default) score += 5;

      return { voice, score };
    });

    scoredVoices.sort((a, b) => b.score - a.score);

    // Bounded quarantine fallback: if all candidate voices are quarantined,
    // permit fallback to the least-penalized or default device voice to avoid silence.
    const allQuarantined = scoredVoices.length > 0 && scoredVoices.every(sv => !this.isVoiceHealthy(sv.voice.name));
    let chosen: SpeechSynthesisVoice;
    if (allQuarantined) {
      console.warn('[VoiceQualityRouter] All candidate voices are quarantined. Permitting bounded fallback voice to prevent speech starvation.');
      const defaultVoice = scoredVoices.find(sv => sv.voice.default)?.voice;
      chosen = defaultVoice || scoredVoices[0].voice;
    } else {
      chosen = scoredVoices[0]?.voice || voices[0];
    }

    const playbackInfo = TTSVoiceRouter.getSpeechEngineInfo(langCode);
    if (chosen) {
      playbackInfo.voiceName = chosen.name;
      playbackInfo.voiceLang = chosen.lang;
    }

    // Special case for Bengali playback info
    if (isBengali) {
      const hasNativeBengali = chosen && chosen.lang.toLowerCase().startsWith('bn');
      playbackInfo.engineType = 'BROWSER_NATIVE_TTS';
      playbackInfo.label = hasNativeBengali ? 'Native Bengali Voice' : 'Phonetic Bengali Speech';
      playbackInfo.isNative = hasNativeBengali;
      playbackInfo.notes = hasNativeBengali
        ? 'Synthesized using native Bengali speech synthesis.'
        : 'Bengali voice not installed on device; synthesized using Romanized phonetic Indian voice.';
    }

    return {
      voice: chosen,
      voiceLang: chosen ? chosen.lang : 'en-IN',
      playbackInfo
    };
  }

  public static getHealthRegistry(): Map<string, VoiceHealthStatus> {
    return new Map(this.healthRegistry);
  }

  public static resetHealth(): void {
    this.healthRegistry.clear();
  }
}
