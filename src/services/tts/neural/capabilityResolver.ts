/**
 * Bhasha Setu — Phase 6: TTS Capability Resolver
 * 
 * Deterministically resolves the optimal speech synthesis engine and fallback
 * chain based on language, script, network, and model availability.
 * 
 * Engine Priority Hierarchy:
 *   1. NATIVE_VERIFIED_NEURAL (On-device / local verified neural model)
 *   2. TRUSTED_REMOTE_NEURAL  (Verified backend neural microservice)
 *   3. TRUSTED_LOCAL_NEURAL   (Quantized WASM/ONNX model)
 *   4. BROWSER_NATIVE_VOICE   (Device Web Speech API voice)
 *   5. PHONETIC_SPEECH_BRIDGE (Ol Chiki -> Roman phonetic bridge + Indian acoustic voice)
 *   6. SAFE_FALLBACK          (Web Audio chime / text display)
 */

import { EnginePriority, ResolutionPlan, EnvironmentCapabilities } from './types';
import { TTSModelRegistry } from './modelRegistry';

export class TTSCapabilityResolver {
  /**
   * Deterministically resolves the speech synthesis plan for a target language and script.
   */
  public static resolve(
    langCode: string,
    env?: Partial<EnvironmentCapabilities>
  ): ResolutionPlan {
    const code = langCode.toLowerCase().trim();
    const isOnline = env?.isOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);
    const hasWebSpeech = env?.hasWebSpeech ?? (typeof window !== 'undefined' && 'speechSynthesis' in window);

    // -------------------------------------------------------------
    // 1. SANTALI (sat)
    // -------------------------------------------------------------
    if (code === 'sat' || code === 'santali') {
      const santaliModels = TTSModelRegistry.getModelsForLanguage('sat');
      const verifiedNeural = santaliModels.find(m => m.availability === 'available');

      if (verifiedNeural) {
        return {
          preferredEngine: 'NATIVE_VERIFIED_NEURAL',
          fallbackEngine: 'PHONETIC_SPEECH_BRIDGE',
          modelId: verifiedNeural.modelId,
          adapterId: 'neural_santali_tts',
          chain: [
            'NATIVE_VERIFIED_NEURAL',
            'PHONETIC_SPEECH_BRIDGE',
            'SAFE_FALLBACK'
          ],
          reason: 'Native Santali neural model verified and available',
          isNativeNeuralAvailable: true
        };
      }

      // Default production state: Neural weights unavailable -> route to Phonetic Speech Bridge
      return {
        preferredEngine: 'PHONETIC_SPEECH_BRIDGE',
        fallbackEngine: 'SAFE_FALLBACK',
        modelId: 'santali-neural-v1', // Declared manifest
        adapterId: 'phonetic_tts_bridge',
        chain: [
          'PHONETIC_SPEECH_BRIDGE',
          'SAFE_FALLBACK'
        ],
        reason: 'Native Santali neural weights undeployed; routing to verified Phonetic Speech Bridge',
        isNativeNeuralAvailable: false
      };
    }

    // -------------------------------------------------------------
    // 2. HINDI (hin)
    // -------------------------------------------------------------
    if (code === 'hin' || code === 'hindi' || code === 'hi') {
      if (hasWebSpeech) {
        return {
          preferredEngine: 'BROWSER_NATIVE_VOICE',
          fallbackEngine: 'SAFE_FALLBACK',
          modelId: 'hindi-browser-native-v1',
          adapterId: 'native_browser_tts',
          chain: [
            'BROWSER_NATIVE_VOICE',
            'SAFE_FALLBACK'
          ],
          reason: 'Native browser speech synthesis voice available for Hindi (hi-IN)',
          isNativeNeuralAvailable: false
        };
      }
      return {
        preferredEngine: 'SAFE_FALLBACK',
        fallbackEngine: 'SAFE_FALLBACK',
        adapterId: 'audio_chime_fallback',
        chain: ['SAFE_FALLBACK'],
        reason: 'Web Speech API unavailable in browser environment',
        isNativeNeuralAvailable: false
      };
    }

    // -------------------------------------------------------------
    // 3. ENGLISH (eng)
    // -------------------------------------------------------------
    if (code === 'eng' || code === 'english' || code === 'en') {
      if (hasWebSpeech) {
        return {
          preferredEngine: 'BROWSER_NATIVE_VOICE',
          fallbackEngine: 'SAFE_FALLBACK',
          modelId: 'english-browser-native-v1',
          adapterId: 'native_browser_tts',
          chain: [
            'BROWSER_NATIVE_VOICE',
            'SAFE_FALLBACK'
          ],
          reason: 'Native browser speech synthesis voice available for Indian English (en-IN)',
          isNativeNeuralAvailable: false
        };
      }
      return {
        preferredEngine: 'SAFE_FALLBACK',
        fallbackEngine: 'SAFE_FALLBACK',
        adapterId: 'audio_chime_fallback',
        chain: ['SAFE_FALLBACK'],
        reason: 'Web Speech API unavailable in browser environment',
        isNativeNeuralAvailable: false
      };
    }

    // -------------------------------------------------------------
    // 4. BENGALI (ben)
    // -------------------------------------------------------------
    if (code === 'ben' || code === 'bengali' || code === 'bn') {
      if (hasWebSpeech) {
        return {
          preferredEngine: 'BROWSER_NATIVE_VOICE',
          fallbackEngine: 'SAFE_FALLBACK',
          modelId: 'bengali-browser-native-v1',
          adapterId: 'native_browser_tts',
          chain: [
            'BROWSER_NATIVE_VOICE',
            'SAFE_FALLBACK'
          ],
          reason: 'Native browser speech synthesis voice available for Bengali (bn-IN)',
          isNativeNeuralAvailable: false
        };
      }
      return {
        preferredEngine: 'SAFE_FALLBACK',
        fallbackEngine: 'SAFE_FALLBACK',
        adapterId: 'audio_chime_fallback',
        chain: ['SAFE_FALLBACK'],
        reason: 'Web Speech API unavailable in browser environment',
        isNativeNeuralAvailable: false
      };
    }

    // -------------------------------------------------------------
    // 5. MUNDARI (unr) & HO (hoc) — FUTURE SCOPE ISOLATION
    // -------------------------------------------------------------
    if (code === 'unr' || code === 'mundari' || code === 'hoc' || code === 'ho') {
      return {
        preferredEngine: 'SAFE_FALLBACK',
        fallbackEngine: 'SAFE_FALLBACK',
        modelId: code.startsWith('unr') ? 'mundari-future-v1' : 'ho-future-v1',
        adapterId: 'future_indigenous_stub',
        chain: ['SAFE_FALLBACK'],
        reason: `Language '${code}' declared as Future Scope; no neural or browser speech synthesis currently deployed`,
        isNativeNeuralAvailable: false
      };
    }

    // Default Fallback
    return {
      preferredEngine: 'SAFE_FALLBACK',
      fallbackEngine: 'SAFE_FALLBACK',
      adapterId: 'audio_chime_fallback',
      chain: ['SAFE_FALLBACK'],
      reason: `Unsupported language code '${langCode}'`,
      isNativeNeuralAvailable: false
    };
  }

  /**
   * Evaluates whether a language can be served by any high-fidelity speech engine.
   */
  public static canSynthesize(langCode: string): boolean {
    const plan = this.resolve(langCode);
    return plan.preferredEngine !== 'SAFE_FALLBACK';
  }
}
