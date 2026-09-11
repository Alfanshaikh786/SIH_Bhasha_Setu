/**
 * Audio Quality & Noise Detection Service for Bhasha Setu
 * 
 * Inspects microphone streams in real time using the browser's Web Audio API.
 * Computes RMS volume, signal-to-noise heuristic, and ambient room noise to guide
 * frontline workers and teachers toward optimal microphone placement.
 */

export interface AudioQualityStatus {
  status: 'good' | 'moderate' | 'poor' | 'silent';
  level: number; // 0 to 100
  snrEstimateDb: number;
  message: string;
  isClipping: boolean;
}

export class AudioQualityMonitor {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationId: number | null = null;
  private baselineNoiseRms: number = 0.01;
  private onQualityUpdate: (status: AudioQualityStatus) => void;

  constructor(onQualityUpdate: (status: AudioQualityStatus) => void) {
    this.onQualityUpdate = onQualityUpdate;
  }

  /**
   * Starts monitoring the provided MediaStream or requests a fresh microphone stream.
   */
  async start(existingStream?: MediaStream): Promise<void> {
    try {
      if (existingStream) {
        this.mediaStream = existingStream;
      } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } else {
        return;
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();
      const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.4;
      source.connect(this.analyser);

      const dataArray = new Float32Array(this.analyser.fftSize);

      const loop = () => {
        if (!this.analyser) return;

        this.analyser.getFloatTimeDomainData(dataArray);

        // Compute Root Mean Square (RMS)
        let sumSquares = 0;
        let peak = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const sample = dataArray[i];
          const abs = Math.abs(sample);
          if (abs > peak) peak = abs;
          sumSquares += sample * sample;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        // Track running ambient noise floor during low volume
        if (rms < 0.02) {
          this.baselineNoiseRms = this.baselineNoiseRms * 0.95 + rms * 0.05;
        }

        // Compute signal to noise ratio in dB
        const snrRatio = Math.max(0.001, rms) / Math.max(0.0005, this.baselineNoiseRms);
        const snrDb = Math.round(20 * Math.log10(snrRatio));

        // Scale level 0-100
        const level = Math.min(100, Math.round(rms * 280));
        const isClipping = peak >= 0.98;

        let status: 'good' | 'moderate' | 'poor' | 'silent' = 'silent';
        let message = 'Microphone ready. Speak clearly into the microphone.';

        if (level < 4) {
          status = 'silent';
          message = 'No speech detected. Please speak louder.';
        } else if (isClipping) {
          status = 'poor';
          message = 'Audio is too loud/distorted. Please move slightly back from the microphone.';
        } else if (snrDb >= 15 && level >= 15 && level <= 85) {
          status = 'good';
          message = 'Optimal speech clarity. Proceed with speaking.';
        } else if (snrDb >= 8) {
          status = 'moderate';
          message = 'Acceptable audio. For higher accuracy, reduce room echo.';
        } else {
          status = 'poor';
          message = 'Background noise detected. Try moving closer to the microphone.';
        }

        this.onQualityUpdate({
          status,
          level,
          snrEstimateDb: snrDb,
          message,
          isClipping
        });

        this.animationId = requestAnimationFrame(loop);
      };

      loop();
    } catch (err) {
      console.warn('[AudioQualityMonitor] Unable to initialize audio monitor:', err);
    }
  }

  /**
   * Stops audio monitoring and frees media stream resources.
   */
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
    this.mediaStream = null;
    this.analyser = null;
  }
}
