/**
 * Bhasha Setu — Production Voice & Capability Router
 *
 * Implements deterministic browser voice selection, async voice loading protection,
 * and zero-fabrication linguistic capability reporting.
 */

import { TTSPlaybackInfo, TTSEngineType } from './types';

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesInitialized = false;

/**
 * Initializes browser speech synthesis voices with onvoiceschanged support.
 */
function initVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const update = () => {
    try {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        cachedVoices = list;
        voicesInitialized = true;
      }
    } catch {}
  };

  update();

  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = update;
  }
}

// Auto-initialize in browser environments
if (typeof window !== 'undefined') {
  initVoices();
}

export class TTSVoiceRouter {
  /**
   * Returns current list of available browser speech synthesis voices.
   */
  public static getVoices(): SpeechSynthesisVoice[] {
    if (!voicesInitialized && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const list = window.speechSynthesis.getVoices();
        if (list && list.length > 0) {
          cachedVoices = list;
          voicesInitialized = true;
        }
      } catch {}
    }
    return cachedVoices;
  }

  /**
   * Deterministically selects the optimal voice for the given language code.
   */
  public static selectOptimalVoice(langCode: string): { voice: SpeechSynthesisVoice | null; voiceLang: string } {
    const voices = this.getVoices();
    const code = langCode.toLowerCase().trim();

    if (voices.length === 0) {
      return { voice: null, voiceLang: code === 'hin' ? 'hi-IN' : 'en-IN' };
    }

    // 1. Hindi
    if (code === 'hin' || code === 'hindi' || code === 'hi') {
      const exactHindi = voices.find(v => v.lang === 'hi-IN') ||
                         voices.find(v => v.lang.toLowerCase().startsWith('hi'));
      if (exactHindi) {
        return { voice: exactHindi, voiceLang: exactHindi.lang };
      }
      // Hindi fallback: If no Hindi voice installed on system, use Indian English voice
      const indianEng = voices.find(v => v.lang === 'en-IN') ||
                        voices.find(v => v.lang.toLowerCase().startsWith('en'));
      return { voice: indianEng || voices[0], voiceLang: indianEng ? indianEng.lang : 'en-US' };
    }

    // 2. English
    if (code === 'eng' || code === 'english' || code === 'en') {
      const indianEng = voices.find(v => v.lang === 'en-IN') ||
                        voices.find(v => v.lang.toLowerCase().startsWith('en'));
      return { voice: indianEng || voices[0], voiceLang: indianEng ? indianEng.lang : 'en-US' };
    }

    // 3. Tribal Languages (Santali, Mundari, Ho): Phonetic Indian Acoustic Route
    // Prefer Indian English voice for natural cadence, then Hindi voice
    const tribalVoice = voices.find(v => v.lang === 'en-IN') ||
                        voices.find(v => v.lang === 'hi-IN' || v.lang.toLowerCase().startsWith('hi')) ||
                        voices.find(v => v.lang.toLowerCase().startsWith('en')) ||
                        voices[0];

    return {
      voice: tribalVoice,
      voiceLang: tribalVoice ? tribalVoice.lang : 'en-IN'
    };
  }

  /**
   * Returns honest linguistic playback capabilities.
   * STRICT POLICY: Never misleads users that phonetic Indian TTS is a native tribal model.
   */
  public static getSpeechEngineInfo(langCode: string): TTSPlaybackInfo {
    const code = langCode.toLowerCase().trim();
    const isTribal = (code === 'sat' || code === 'santali' || code === 'unr' || code === 'mundari' || code === 'hoc' || code === 'ho');

    if (isTribal) {
      return {
        engineType: 'PHONETIC_TTS_BRIDGE',
        label: 'Phonetic Pronunciation',
        isNative: false,
        notes: 'Native tribal voice model unavailable in browser speech engines — playing verified phonetic pronunciation via Indian English/Hindi voice.'
      };
    }

    if (code === 'hin' || code === 'hindi' || code === 'hi') {
      const voices = this.getVoices();
      const hasHindi = voices.some(v => v.lang.toLowerCase().startsWith('hi'));
      return {
        engineType: 'BROWSER_NATIVE_TTS',
        label: hasHindi ? 'Native Hindi Voice' : 'Phonetic Hindi Speech',
        isNative: hasHindi,
        notes: hasHindi
          ? 'Synthesized using native Hindi speech synthesis.'
          : 'Hindi voice not installed on device; synthesized using Romanized phonetic Indian voice.'
      };
    }

    return {
      engineType: 'BROWSER_NATIVE_TTS',
      label: 'Native English Voice',
      isNative: true,
      notes: 'Synthesized using native English speech synthesis.'
    };
  }

  public static isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  public static isAudioContextSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.AudioContext || (window as any).webkitAudioContext);
  }
}
