/**
 * Bhasha Setu — S2S Audio Capture & Preprocessing Pipeline
 * 
 * Responsibilities:
 * - Microphone permission validation
 * - Web Audio API lifecycle (16 kHz, single-channel Mono, echo cancellation)
 * - Energy-based Voice Activity Detection (VAD) & Silence Detection
 * - Noise estimation & clipping warning
 * - Deterministic teardown on turn cancellation
 */

export interface AudioPipelineOptions {
  onAudioChunk?: (pcm16: Int16Array) => void;
  onVadActivity?: (isSpeaking: boolean, rms: number) => void;
  onError?: (err: Error) => void;
}

export class S2SAudioPipeline {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isCapturing = false;
  private silenceFrames = 0;
  private activeFrames = 0;
  private lastRms = 0;
  private baselineNoiseRms = 0.005; // Running ambient noise floor

  private static readonly VAD_RMS_FLOOR = 0.012;         // Baseline minimum threshold for speech
  private static readonly VAD_NOISE_FLOOR_FACTOR = 2.0;   // Minimum dynamic headroom above noise floor
  private static readonly SILENCE_FRAMES_LIMIT = 40;     // ~3.5s of consecutive silence

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
        // Preferred standard: 16 kHz mono with native WebRTC DSP
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (constraintErr) {
        // Graceful fallback for older mobile browsers / webviews that reject complex constraints
        console.warn('[S2SAudioPipeline] Complex audio constraints unsupported, falling back to default audio capture:', constraintErr);
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;

      // 4096 buffer size at 16kHz = ~256ms chunk interval
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isCapturing) return;

        const input = e.inputBuffer.getChannelData(0);
        let sumSq = 0;
        const pcm16 = new Int16Array(input.length);

        for (let i = 0; i < input.length; i++) {
          const sample = Math.max(-1, Math.min(1, input[i]));
          sumSq += sample * sample;
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        // Energy-based VAD metric
        const rms = Math.sqrt(sumSq / input.length);
        this.lastRms = rms;

        // Adapt running noise floor during quiet periods
        if (rms < this.baselineNoiseRms * 1.5 || rms < 0.02) {
          this.baselineNoiseRms = this.baselineNoiseRms * 0.95 + rms * 0.05;
        }

        // Dynamic effective threshold: at least 0.012 or 2.0x current ambient noise floor
        const effectiveThreshold = this.getEffectiveThreshold();
        const isSpeaking = rms >= effectiveThreshold;
        if (isSpeaking) {
          this.activeFrames++;
          this.silenceFrames = 0;
        } else {
          this.silenceFrames++;
        }

        options.onVadActivity?.(isSpeaking, rms);
        options.onAudioChunk?.(pcm16);
      };

      source.connect(this.analyser);
      this.analyser.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isCapturing = true;
      this.silenceFrames = 0;
      this.activeFrames = 0;
      this.baselineNoiseRms = 0.005;
    } catch (err: any) {
      this.stop();
      options.onError?.(err);
      throw err;
    }
  }

  /**
   * Cleanly closes all audio tracks, nodes, and contexts.
   */
  public stop(): void {
    this.isCapturing = false;
    this.baselineNoiseRms = 0.005;

    if (this.processor) {
      try {
        this.processor.onaudioprocess = null; // Clean up handler to prevent memory leak
        this.processor.disconnect();
      } catch {}
      this.processor = null;
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

  public getEffectiveThreshold(): number {
    return Math.max(S2SAudioPipeline.VAD_RMS_FLOOR, this.baselineNoiseRms * S2SAudioPipeline.VAD_NOISE_FLOOR_FACTOR);
  }

  public hasSpoken(): boolean {
    return this.activeFrames >= 2;
  }

  public getVadStats(): { activeFrames: number; silenceFrames: number; lastRms: number; isSpeaking: boolean; noiseFloorRms: number; effectiveThreshold: number } {
    const effectiveThreshold = this.getEffectiveThreshold();
    return {
      activeFrames: this.activeFrames,
      silenceFrames: this.silenceFrames,
      lastRms: this.lastRms,
      isSpeaking: this.lastRms >= effectiveThreshold,
      noiseFloorRms: this.baselineNoiseRms,
      effectiveThreshold
    };
  }
}
