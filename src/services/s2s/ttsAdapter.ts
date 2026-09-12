/**
 * Bhasha Setu — S2S TTS Adapter Architecture
 * 
 * Implements a pluggable adapter pattern separating the conversation pipeline
 * from the underlying speech synthesis engines:
 * 
 *                  Target Text
 *                       │
 *                       ▼
 *              [ TTSAdapterRegistry ]
 *                       │
 *         ┌─────────────┼─────────────┐
 *         ▼                           ▼
 * [ PhoneticTTSAdapter ]     [ NeuralSantaliTTSAdapter ]
 * (Active: Romanization)     (Future: On-device Neural)
 * (Status: PHONETIC BRIDGE)   (Status: FUTURE)
 * 
 * The conversation engine interacts ONLY with the adapter interface,
 * allowing seamless future integration of native tribal neural TTS models
 * with ZERO changes to the turn controller or conversation UI.
 */

import { playTextSpeech } from '../translationService';
import { TTSPlaybackOptions } from './ttsEngine';

export type TTSEngineType = 'PHONETIC_TTS_BRIDGE' | 'NEURAL_ON_DEVICE_TTS' | 'BROWSER_NATIVE_TTS';
export type TTSValidationStatus = 'IMPLEMENTED' | 'TESTED' | 'REAL-WORLD VALIDATED' | 'FUTURE' | 'NOT YET IMPLEMENTED';

export interface ITTSAdapter {
  readonly id: string;
  readonly name: string;
  readonly engineType: TTSEngineType;
  readonly validationStatus: TTSValidationStatus;
  canHandle(langCode: string): boolean;
  synthesize(text: string, langCode: string, options?: TTSPlaybackOptions): void;
  stop(): void;
}

/**
 * PhoneticTTSAdapter: Current active adapter for Santali.
 * Transliterates Ol Chiki to phonetic Romanization before dispatching
 * through high-clarity Indian acoustic speech synthesis.
 */
export class PhoneticTTSAdapter implements ITTSAdapter {
  public readonly id = 'phonetic_tts_bridge';
  public readonly name = 'Phonetic Romanization Speech Bridge';
  public readonly engineType: TTSEngineType = 'PHONETIC_TTS_BRIDGE';
  public readonly validationStatus: TTSValidationStatus = 'TESTED';

  public canHandle(langCode: string): boolean {
    const code = langCode.toLowerCase().trim();
    return code === 'sat' || code === 'santali';
  }

  public synthesize(text: string, langCode: string, options: TTSPlaybackOptions = {}): void {
    try {
      playTextSpeech(
        text,
        langCode,
        options.rate || 0.9,
        options.onEnd,
        undefined
      );
    } catch (e) {
      options.onError?.(e);
      options.onEnd?.();
    }
  }

  public stop(): void {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  }
}

/**
 * NativeBrowserTTSAdapter: Active adapter for Hindi and Indian English.
 */
export class NativeBrowserTTSAdapter implements ITTSAdapter {
  public readonly id = 'native_browser_tts';
  public readonly name = 'Browser Native SpeechSynthesis (hi-IN / en-IN)';
  public readonly engineType: TTSEngineType = 'BROWSER_NATIVE_TTS';
  public readonly validationStatus: TTSValidationStatus = 'REAL-WORLD VALIDATED';

  public canHandle(langCode: string): boolean {
    const code = langCode.toLowerCase().trim();
    return code === 'hin' || code === 'hindi' || code === 'eng' || code === 'english' || code === 'en' || code === 'hi';
  }

  public synthesize(text: string, langCode: string, options: TTSPlaybackOptions = {}): void {
    try {
      playTextSpeech(
        text,
        langCode,
        options.rate || 0.9,
        options.onEnd,
        undefined
      );
    } catch (e) {
      options.onError?.(e);
      options.onEnd?.();
    }
  }

  public stop(): void {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  }
}

/**
 * NeuralSantaliTTSAdapter: Architecture stub for future native Santali neural voice weights.
 * Prepared for drop-in ONNX / FastSpeech2 / VITS acoustic model deployment.
 */
export class NeuralSantaliTTSAdapter implements ITTSAdapter {
  public readonly id = 'future_neural_santali_tts';
  public readonly name = 'Native Santali Neural Voice (VITS/FastSpeech2)';
  public readonly engineType: TTSEngineType = 'NEURAL_ON_DEVICE_TTS';
  public readonly validationStatus: TTSValidationStatus = 'FUTURE';

  public canHandle(langCode: string): boolean {
    const code = langCode.toLowerCase().trim();
    return code === 'sat' || code === 'santali';
  }

  public synthesize(text: string, langCode: string, options: TTSPlaybackOptions = {}): void {
    // Native on-device neural voice weights are not yet deployed.
    // Transparently log readiness and fall back safely to PhoneticTTSAdapter
    console.warn('[NeuralSantaliTTSAdapter] Native neural weights not yet loaded. Falling back to phonetic bridge.');
    const fallback = new PhoneticTTSAdapter();
    fallback.synthesize(text, langCode, options);
  }

  public stop(): void {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  }
}

/**
 * FutureNeuralMundariTTSAdapter: Architecture stub for future native Mundari neural voice weights.
 */
export class FutureNeuralMundariTTSAdapter implements ITTSAdapter {
  public readonly id = 'future_neural_mundari_tts';
  public readonly name = 'Native Mundari Neural Voice (Architecture Stub)';
  public readonly engineType: TTSEngineType = 'NEURAL_ON_DEVICE_TTS';
  public readonly validationStatus: TTSValidationStatus = 'FUTURE';

  public canHandle(langCode: string): boolean {
    const code = langCode.toLowerCase().trim();
    return code === 'unr' || code === 'mundari';
  }

  public synthesize(text: string, langCode: string, options: TTSPlaybackOptions = {}): void {
    console.warn('[FutureNeuralMundariTTSAdapter] Native Mundari neural weights not yet loaded. Falling back to phonetic bridge.');
    const fallback = new PhoneticTTSAdapter();
    fallback.synthesize(text, langCode, options);
  }

  public stop(): void {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  }
}

/**
 * FutureNeuralHoTTSAdapter: Architecture stub for future native Ho neural voice weights.
 */
export class FutureNeuralHoTTSAdapter implements ITTSAdapter {
  public readonly id = 'future_neural_ho_tts';
  public readonly name = 'Native Ho Neural Voice (Architecture Stub)';
  public readonly engineType: TTSEngineType = 'NEURAL_ON_DEVICE_TTS';
  public readonly validationStatus: TTSValidationStatus = 'FUTURE';

  public canHandle(langCode: string): boolean {
    const code = langCode.toLowerCase().trim();
    return code === 'hoc' || code === 'ho';
  }

  public synthesize(text: string, langCode: string, options: TTSPlaybackOptions = {}): void {
    console.warn('[FutureNeuralHoTTSAdapter] Native Ho neural weights not yet loaded. Falling back to phonetic bridge.');
    const fallback = new PhoneticTTSAdapter();
    fallback.synthesize(text, langCode, options);
  }

  public stop(): void {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  }
}

/**
 * TTSAdapterRegistry: Coordinates active adapters per language code.
 */
export class TTSAdapterRegistry {
  private static adapters: ITTSAdapter[] = [
    new PhoneticTTSAdapter(),
    new NativeBrowserTTSAdapter(),
    new NeuralSantaliTTSAdapter(),
    new FutureNeuralMundariTTSAdapter(),
    new FutureNeuralHoTTSAdapter()
  ];

  public static getAdapterForLanguage(langCode: string): ITTSAdapter {
    const found = this.adapters.find(a => a.canHandle(langCode));
    return found || this.adapters[0];
  }

  public static registerAdapter(adapter: ITTSAdapter, prepend: boolean = true): void {
    if (prepend) {
      this.adapters.unshift(adapter);
    } else {
      this.adapters.push(adapter);
    }
  }

  public static listAdapters(): Array<{ id: string; name: string; engineType: TTSEngineType; status: TTSValidationStatus }> {
    return this.adapters.map(a => ({
      id: a.id,
      name: a.name,
      engineType: a.engineType,
      status: a.validationStatus
    }));
  }
}
