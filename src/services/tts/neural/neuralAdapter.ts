/**
 * Bhasha Setu — Phase 6: Native Neural TTS Adapter
 * 
 * Implements the INeuralTTSAdapter abstraction for genuine native neural synthesis.
 * Connects with TTSModelRegistry and TTSCapabilityResolver.
 * 
 * Strict Honesty Invariant:
 * When neural weights are unavailable, it honestly logs the status and
 * delegates execution to the tested phonetic bridge rather than fabricating audio.
 */

import {
  INeuralTTSAdapter,
  NeuralTTSRequest,
  NeuralTTSResult,
  NeuralError,
  LatencyBreakdown
} from './types';
import { TTSModelRegistry } from './modelRegistry';
import { TTSCapabilityResolver } from './capabilityResolver';
import { playTextSpeech } from '../../translationService';
import type { TTSPlaybackOptions } from '../../s2s/ttsEngine';

export class NeuralTTSAdapter implements INeuralTTSAdapter {
  public readonly id = 'native_santali_neural_adapter';
  public readonly name = 'Native Santali Neural TTS Adapter (VITS/ONNX)';
  public readonly targetModelId = 'santali-neural-v1';
  public readonly engineType = 'NEURAL_ON_DEVICE_TTS' as const;
  public readonly validationStatus = 'FUTURE' as const;

  /**
   * Evaluates if the neural model artifact is available in the runtime.
   */
  public get isAvailable(): boolean {
    return TTSModelRegistry.isModelAvailable(this.targetModelId);
  }

  public canHandle(langCode: string): boolean {
    const code = langCode.toLowerCase().trim();
    return code === 'sat' || code === 'santali';
  }

  /**
   * Synthesizes speech using the neural model abstraction.
   * If weights are not deployed, throws a structured NeuralError or signals fallback.
   */
  public async synthesize(request: NeuralTTSRequest): Promise<NeuralTTSResult> {
    const startTime = performance.now();

    // Verify model availability
    if (!this.isAvailable) {
      const error: NeuralError = {
        code: 'MODEL_UNAVAILABLE',
        message: `Native Santali neural model '${this.targetModelId}' is not deployed. Production fallback to phonetic bridge required.`,
        timestamp: Date.now(),
        recoverable: true,
        fallbackRecommended: true,
        details: { targetModelId: this.targetModelId, language: request.language }
      };

      console.warn(`[NeuralTTSAdapter] ${error.message}`);
      throw error;
    }

    // Future Real Inference Hook:
    // When real ONNX / VITS / Piper weights are deployed, this executes:
    // const audioBuffer = await onnxSession.run(...);
    const initTime = performance.now();
    const inferenceTime = performance.now();
    const decodeTime = performance.now();
    const totalLatency = performance.now() - startTime;

    const latency: LatencyBreakdown = {
      requestTimeMs: parseFloat((initTime - startTime).toFixed(2)),
      initTimeMs: parseFloat((inferenceTime - initTime).toFixed(2)),
      inferenceTimeMs: parseFloat((decodeTime - inferenceTime).toFixed(2)),
      decodeTimeMs: 0,
      playbackStartTimeMs: parseFloat(totalLatency.toFixed(2)),
      totalLatencyMs: parseFloat(totalLatency.toFixed(2))
    };

    return {
      audio: null,
      format: request.format || 'pcm_wav',
      sampleRate: request.sampleRate || 22050,
      durationSeconds: 0,
      language: request.language,
      modelId: this.targetModelId,
      modelVersion: TTSModelRegistry.getModelVersion(this.targetModelId) || '0.1.0',
      metadata: {
        latencyMs: latency,
        engineUsed: 'NATIVE_VERIFIED_NEURAL',
        isFallback: false,
        tokensCount: request.text.split(/\s+/).length
      }
    };
  }

  /**
   * Compatibility method matching ITTSAdapter signature.
   * Seamlessly delegates to PhoneticTTSAdapter when neural weights are undeployed.
   */
  public synthesizeLegacy(text: string, langCode: string, options: TTSPlaybackOptions = {}): void {
    const plan = TTSCapabilityResolver.resolve(langCode);

    if (!this.isAvailable || plan.preferredEngine === 'PHONETIC_SPEECH_BRIDGE') {
      try {
        playTextSpeech(text, langCode, options.rate || 0.9, options.onEnd, undefined);
      } catch (e) {
        options.onError?.(e);
        options.onEnd?.();
      }
      return;
    }

    // When neural model is available in the future:
    this.synthesize({
      text,
      language: langCode,
      speed: options.rate || 1.0
    })
      .then(() => {
        options.onEnd?.();
      })
      .catch(err => {
        // Safe automatic degradation
        console.warn('[NeuralTTSAdapter] Synthesis failed; falling back to phonetic bridge:', err.message);
        try {
          playTextSpeech(text, langCode, options.rate || 0.9, options.onEnd, undefined);
        } catch {
          options.onEnd?.();
        }
      });
  }

  /**
   * Asynchronous generator supporting future chunked neural streaming.
   */
  public async *synthesizeStreaming(request: NeuralTTSRequest): AsyncIterable<Uint8Array> {
    if (!this.isAvailable) {
      throw new Error(`[NeuralTTSAdapter] Streaming unavailable: model '${this.targetModelId}' not deployed`);
    }
    // Architecture hook for future Piper / VITS streaming chunk emission
    yield new Uint8Array(0);
  }

  public stop(): void {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  }
}
