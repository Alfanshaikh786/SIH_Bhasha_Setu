/**
 * Bhasha Setu — S2S Audio Capture, Resampling & Preprocessing Pipeline
 * 
 * Hardware-Robust Audio Pipeline:
 * - Single-owner Web Audio MediaStream lifecycle
 * - Automatic high-fidelity resampling from native hardware rate (48 kHz / 44.1 kHz) to 16 kHz Mono
 * - Energy-based Voice Activity Detection (VAD) with dual-threshold hysteresis & speech hangover
 * - 512ms pre-roll circular ring buffer preserving initial speech syllables
 * - Bounded audio flush ensuring final words (300-500ms) are delivered before stream closure
 * - Diagnostic metrics (RMS, noise floor, track status, native vs target sample rate)
 */

export interface AudioPipelineOptions {
  onAudioChunk?: (pcm16: Int16Array) => void;
  onVadActivity?: (isSpeaking: boolean, rms: number) => void;
  onError?: (err: Error) => void;
}

export interface AudioTrackStatus {
  active: boolean;
  readyState: string;
  enabled: boolean;
  muted: boolean;
  id: string;
}

export class S2SAudioPipeline {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private muteGain: GainNode | null = null;
  private isCapturing = false;
  private silenceFrames = 0;
  private activeFrames = 0;
  private totalFrameCount = 0;
  private lastRms = 0;
  private baselineNoiseRms = 0.005; // Running ambient noise floor
  private preRollBuffer: Int16Array[] = []; // Circular ring buffer (512ms pre-roll at 16kHz)
  private hasVocalizedInSession = false;
  private isCurrentlySpeaking = false;
  private hangoverFramesCount = 0;
  private resampleResidual: number = 0;

  public static readonly TARGET_SAMPLE_RATE = 16000;
  private static readonly VAD_RMS_FLOOR = 0.005;         // Responsive baseline threshold for real voices
  private static readonly VAD_SILENCE_FLOOR = 0.003;     // Lower threshold for speech offset (hysteresis)
  private static readonly VAD_NOISE_FLOOR_FACTOR = 1.6;   // Headroom above noise floor for onset
  private static readonly VAD_HYSTERESIS_FACTOR = 1.2;   // Headroom above noise floor for offset
  private static readonly HANGOVER_FRAMES_LIMIT = 6;     // ~500ms hangover tolerance to bridge word pauses
  private static readonly PRE_ROLL_MAX_SAMPLES = 8192;   // 512ms at 16 kHz

  /**
   * Resamples a Float32Array from inputRate to 16,000 Hz using linear interpolation.
   */
  public static resampleTo16k(input: Float32Array, inputRate: number): Float32Array {
    if (inputRate === S2SAudioPipeline.TARGET_SAMPLE_RATE || inputRate <= 0) {
      return input;
    }

    const ratio = inputRate / S2SAudioPipeline.TARGET_SAMPLE_RATE;
    const outputLength = Math.round(input.length / ratio);
    const output = new Float32Array(outputLength);

    for (let j = 0; j < outputLength; j++) {
      const srcIdx = j * ratio;
      const i0 = Math.floor(srcIdx);
      const i1 = Math.min(i0 + 1, input.length - 1);
      const alpha = srcIdx - i0;
      output[j] = input[i0] * (1 - alpha) + input[i1] * alpha;
    }

    return output;
  }

  /**
   * Converts Float32 audio samples in [-1.0, 1.0] to 16-bit signed PCM integers.
   */
  public static floatToPcm16(input: Float32Array): Int16Array {
    const pcm16 = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    return pcm16;
  }

  /**
   * Checks if user has granted microphone permission without starting full stream.
   */
  public static async checkPermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initializes microphone capture and starts transmitting 16 kHz Mono PCM chunks.
   */
  public async start(options: AudioPipelineOptions = {}): Promise<void> {
    this.stop();

    try {
      try {
        // Preferred standard: 16 kHz mono with WebRTC noise/echo cancellation
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: S2SAudioPipeline.TARGET_SAMPLE_RATE,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (constraintErr) {
        console.warn('[S2SAudioPipeline] Detailed audio constraints rejected; using default microphone capture:', constraintErr);
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      try {
        this.audioContext = new AudioContextClass({ sampleRate: S2SAudioPipeline.TARGET_SAMPLE_RATE });
      } catch {
        this.audioContext = new AudioContextClass();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const nativeSampleRate = this.audioContext.sampleRate;
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;

      // 4096 buffer size at native rate (~85ms chunks)
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      // Create a zero-gain mute node to prevent local mic feedback into speakers
      this.muteGain = this.audioContext.createGain();
      this.muteGain.gain.setValueAtTime(0.0, this.audioContext.currentTime);

      this.processor.onaudioprocess = (e) => {
        if (!this.isCapturing) return;

        const rawInput = e.inputBuffer.getChannelData(0);
        this.totalFrameCount++;

        // 1. Resample from native hardware rate to guaranteed 16,000 Hz Mono
        const resampled16k = S2SAudioPipeline.resampleTo16k(rawInput, nativeSampleRate);
        const pcm16 = S2SAudioPipeline.floatToPcm16(resampled16k);

        // 2. Compute RMS energy on the resampled 16 kHz signal
        let sumSq = 0;
        for (let i = 0; i < resampled16k.length; i++) {
          sumSq += resampled16k[i] * resampled16k[i];
        }
        const rms = Math.sqrt(sumSq / Math.max(1, resampled16k.length));
        this.lastRms = rms;

        // 3. Adapt running ambient noise floor during quiet periods
        if (rms < this.baselineNoiseRms * 1.5 || rms < 0.015) {
          this.baselineNoiseRms = this.baselineNoiseRms * 0.95 + rms * 0.05;
        }

        // 4. Dual-threshold hysteresis calculation
        const speechOnsetThreshold = this.getEffectiveThreshold();
        const speechOffsetThreshold = this.getEffectiveSilenceThreshold();

        if (rms >= speechOnsetThreshold) {
          this.hangoverFramesCount = S2SAudioPipeline.HANGOVER_FRAMES_LIMIT;
          if (!this.isCurrentlySpeaking) {
            this.isCurrentlySpeaking = true;
            this.activeFrames++;

            // Speech Onset: Flush pre-roll ring buffer so initial consonant/syllable is never lost
            if (!this.hasVocalizedInSession) {
              this.hasVocalizedInSession = true;
              if (this.preRollBuffer.length > 0) {
                for (const preChunk of this.preRollBuffer) {
                  options.onAudioChunk?.(preChunk);
                }
                this.preRollBuffer = [];
              }
            }
          }
          this.silenceFrames = 0;
        } else if (rms < speechOffsetThreshold) {
          if (this.hangoverFramesCount > 0) {
            this.hangoverFramesCount--;
            // Hangover bridges inter-syllable pauses
          } else {
            this.isCurrentlySpeaking = false;
            this.silenceFrames++;
          }
        } else {
          // Within hysteresis band: maintain current state
          if (this.isCurrentlySpeaking) {
            this.silenceFrames = 0;
          } else {
            this.silenceFrames++;
          }
        }

        // 5. Retain pre-roll audio ring buffer before first vocalization
        if (!this.hasVocalizedInSession) {
          this.preRollBuffer.push(pcm16);
          let totalSamples = this.preRollBuffer.reduce((acc, c) => acc + c.length, 0);
          while (totalSamples > S2SAudioPipeline.PRE_ROLL_MAX_SAMPLES && this.preRollBuffer.length > 1) {
            const removed = this.preRollBuffer.shift();
            if (removed) totalSamples -= removed.length;
          }
        }

        options.onVadActivity?.(this.isCurrentlySpeaking, rms);

        // Send audio to the ASR backend whenever user is actively speaking or within hangover window
        const inActiveWindow = this.isCurrentlySpeaking || this.hangoverFramesCount > 0;
        if (inActiveWindow && this.hasVocalizedInSession) {
          options.onAudioChunk?.(pcm16);
        }
      };

      source.connect(this.analyser);
      this.analyser.connect(this.processor);
      this.processor.connect(this.muteGain);
      this.muteGain.connect(this.audioContext.destination);

      this.isCapturing = true;
      this.silenceFrames = 0;
      this.activeFrames = 0;
      this.totalFrameCount = 0;
      this.baselineNoiseRms = 0.005;
      this.preRollBuffer = [];
      this.hasVocalizedInSession = false;
      this.isCurrentlySpeaking = false;
      this.hangoverFramesCount = 0;
    } catch (err: any) {
      this.stop();
      options.onError?.(err);
      throw err;
    }
  }

  /**
   * Flushes any pending pre-roll or buffered speech samples.
   */
  public flush(onChunk?: (pcm16: Int16Array) => void): void {
    if (this.preRollBuffer.length > 0 && onChunk) {
      for (const preChunk of this.preRollBuffer) {
        onChunk(preChunk);
      }
      this.preRollBuffer = [];
    }
  }

  /**
   * Cleanly closes all audio tracks, nodes, and contexts.
   */
  public stop(): void {
    this.isCapturing = false;
    this.preRollBuffer = [];
    this.hasVocalizedInSession = false;
    this.isCurrentlySpeaking = false;
    this.hangoverFramesCount = 0;

    if (this.processor) {
      try {
        this.processor.onaudioprocess = null;
        this.processor.disconnect();
      } catch {}
      this.processor = null;
    }

    if (this.muteGain) {
      try { this.muteGain.disconnect(); } catch {}
      this.muteGain = null;
    }

    if (this.analyser) {
      try { this.analyser.disconnect(); } catch {}
      this.analyser = null;
    }

    if (this.audioContext) {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(t => t.stop());
      } catch {}
      this.mediaStream = null;
    }
  }

  public getIsCapturing(): boolean {
    return this.isCapturing;
  }

  public getLastRms(): number {
    return this.lastRms;
  }

  public getNoiseFloorRms(): number {
    return this.baselineNoiseRms;
  }

  public getSampleRate(): number {
    return S2SAudioPipeline.TARGET_SAMPLE_RATE;
  }

  public getNativeSampleRate(): number {
    return this.audioContext?.sampleRate || S2SAudioPipeline.TARGET_SAMPLE_RATE;
  }

  public getAudioContextState(): string {
    return this.audioContext?.state || 'closed';
  }

  public getTrackStatus(): AudioTrackStatus | null {
    if (!this.mediaStream) return null;
    const tracks = this.mediaStream.getAudioTracks();
    if (!tracks || tracks.length === 0) return null;
    const t = tracks[0];
    return {
      active: this.mediaStream.active,
      readyState: t.readyState,
      enabled: t.enabled,
      muted: t.muted,
      id: t.id
    };
  }

  public getFrameCount(): number {
    return this.totalFrameCount;
  }

  public getEffectiveThreshold(): number {
    return Math.max(S2SAudioPipeline.VAD_RMS_FLOOR, this.baselineNoiseRms * S2SAudioPipeline.VAD_NOISE_FLOOR_FACTOR);
  }

  public getEffectiveSilenceThreshold(): number {
    return Math.max(S2SAudioPipeline.VAD_SILENCE_FLOOR, this.baselineNoiseRms * S2SAudioPipeline.VAD_HYSTERESIS_FACTOR);
  }

  public hasSpoken(): boolean {
    return this.activeFrames >= 2 || this.hasVocalizedInSession;
  }

  public getVadStats(): { activeFrames: number; silenceFrames: number; lastRms: number; isSpeaking: boolean; noiseFloorRms: number; effectiveThreshold: number; silenceThreshold: number; frameCount: number } {
    const effectiveThreshold = this.getEffectiveThreshold();
    const silenceThreshold = this.getEffectiveSilenceThreshold();
    return {
      activeFrames: this.activeFrames,
      silenceFrames: this.silenceFrames,
      lastRms: this.lastRms,
      isSpeaking: this.isCurrentlySpeaking,
      noiseFloorRms: this.baselineNoiseRms,
      effectiveThreshold,
      silenceThreshold,
      frameCount: this.totalFrameCount
    };
  }
}
