/**
 * Neural ASR Service for Bhasha Setu
 * Connects the React Frontend to the Local FastAPI IndicConformer ASR Engine.
 * 
 * Features:
 * - Real audio file decoding and upload transcription
 * - Audio-driven SRT subtitle timing calculation (HH:MM:SS,mmm)
 * - Transparent acoustic confidence metrics (distinct from translation reliability)
 * - WebSocket live streaming for low-latency microphone transcription
 * - Fallback guardrails (never silently substitutes Hindi for Santali)
 */

import { translateText } from './translationService';

export interface ASRSegment {
  id: string;
  start_sec: number;
  end_sec: number;
  text: string;
  speaker: string;
  translation?: string;
  asr_confidence?: number | null;
  translation_confidence?: number | null;
  lexicon_match?: boolean;
  needs_review: boolean;
}

export interface ASRResult {
  text: string;
  language: string;
  duration_sec: number;
  processing_time_ms: number;
  real_time_factor: number;
  model_name: string;
  segments: ASRSegment[];
  asr_confidence?: number | null;
  needs_review: boolean;
  status: string;
  error_message?: string;
}

export interface ASRStatusResponse {
  status: 'ready' | 'offline' | 'error';
  active_engine: string;
  supported_languages: string[];
  model_name: string;
  script: string;
  sample_rate: number;
  offline_capable: boolean;
  device: string;
}

const ASR_BASE_URL = import.meta.env.VITE_ASR_API_URL || 'http://127.0.0.1:5000/api/asr';
const ASR_WS_URL = import.meta.env.VITE_ASR_WS_URL || 'ws://127.0.0.1:5000/api/asr/stream';

/**
 * Checks the operational status of the neural ASR engine.
 */
export async function checkASRStatus(): Promise<ASRStatusResponse> {
  try {
    const res = await fetch(`${ASR_BASE_URL}/status`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      return {
        status: data.status === 'ready' ? 'ready' : 'offline',
        active_engine: data.active_engine || 'AI4Bharat IndicConformer Santali',
        supported_languages: data.supported_languages || ['sat'],
        model_name: data.model_name || 'IndicConformer Santali (ONNX int8)',
        script: data.script || 'Ol Chiki (U+1C50–U+1C7F)',
        sample_rate: data.sample_rate || 16000,
        offline_capable: data.offline_capable ?? true,
        device: data.device || 'CPU / ONNX Runtime'
      };
    }
    return {
      status: 'offline',
      active_engine: 'IndicConformer (Offline)',
      supported_languages: ['sat'],
      model_name: 'IndicConformer Santali',
      script: 'Ol Chiki',
      sample_rate: 16000,
      offline_capable: true,
      device: 'CPU'
    };
  } catch {
    return {
      status: 'offline',
      active_engine: 'IndicConformer (Offline)',
      supported_languages: ['sat'],
      model_name: 'IndicConformer Santali',
      script: 'Ol Chiki',
      sample_rate: 16000,
      offline_capable: true,
      device: 'CPU'
    };
  }
}

/**
 * Transcribes an uploaded audio file using the neural ASR backend.
 * Real audio decoding -> VAD chunking -> IndicConformer neural recognition -> bilingual translation.
 */
export async function transcribeAudioFile(
  file: File,
  sourceLang: string = 'sat',
  targetLang: string = 'eng'
): Promise<ASRResult> {
  // Phase 1 Scope Check: explicitly block Mundari/Ho
  if (sourceLang === 'unr' || sourceLang === 'mundari') {
    throw new Error('Mundari ASR is scheduled for Phase 2. This phase supports Santali (sat).');
  }
  if (sourceLang === 'hoc' || sourceLang === 'ho') {
    throw new Error('Ho ASR is scheduled for Phase 3. This phase supports Santali (sat).');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('source_lang', sourceLang);
  formData.append('target_lang', targetLang);

  const response = await fetch(`${ASR_BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = 'ASR transcription failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {}
    throw new Error(`[ASR Error ${response.status}]: ${errorDetail}`);
  }

  const data: ASRResult = await response.json();

  // Translate each recognized segment using Bhasha Setu's verified translation layer
  for (const seg of data.segments) {
    if (seg.text && targetLang !== sourceLang) {
      try {
        const transRes = await translateText(seg.text, sourceLang, targetLang);
        seg.translation = transRes.targetText;
        seg.translation_confidence = transRes.reliability === 'verified' ? 0.98 : transRes.reliability === 'dataset' ? 0.92 : 0.85;
        seg.lexicon_match = transRes.reliability === 'verified';
      } catch (err) {
        console.warn('Segment translation warning:', err);
        seg.translation = undefined;
      }
    }
  }

  return data;
}

/**
 * Converts seconds (e.g. 74.25) to standard SRT timestamp format (00:01:14,250).
 */
export function formatSecondsToSRT(seconds: number): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Generates valid, standards-compliant SubRip Subtitle (.SRT) text
 * based on actual audio segment timestamps.
 */
export function generateSRTContent(segments: ASRSegment[]): string {
  let srt = '';
  segments.forEach((seg, idx) => {
    const startStr = formatSecondsToSRT(seg.start_sec);
    const endStr = formatSecondsToSRT(seg.end_sec > seg.start_sec ? seg.end_sec : seg.start_sec + 2.0);

    srt += `${idx + 1}\n`;
    srt += `${startStr} --> ${endStr}\n`;
    srt += `${seg.text}\n`;
    if (seg.translation) {
      srt += `${seg.translation}\n`;
    }
    srt += '\n';
  });
  return srt;
}

/**
 * Microphone streaming session controller via WebSocket.
 */
export class MicrophoneStreamer {
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private onInterim: (text: string) => void;
  private onFinal: (segment: ASRSegment) => void;
  private onError: (err: string) => void;

  constructor(options: {
    onInterim: (text: string) => void;
    onFinal: (segment: ASRSegment) => void;
    onError: (err: string) => void;
  }) {
    this.onInterim = options.onInterim;
    this.onFinal = options.onFinal;
    this.onError = options.onError;
  }

  async start(): Promise<void> {
    // 1. Establish WebSocket connection
    try {
      this.ws = new WebSocket(ASR_WS_URL);
    } catch (e: any) {
      this.onError(`Failed to connect to ASR WebSocket: ${e?.message || e}`);
      return;
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'interim' && msg.text) {
          this.onInterim(msg.text);
        } else if (msg.type === 'final' && msg.segments) {
          for (const s of msg.segments) {
            this.onFinal({
              id: s.id || `rec-${Date.now()}`,
              start_sec: s.start_sec || 0.0,
              end_sec: s.end_sec || 1.0,
              text: s.text,
              speaker: 'Live Speaker',
              asr_confidence: s.asr_confidence,
              needs_review: s.needs_review ?? false
            });
          }
        } else if (msg.type === 'error') {
          this.onError(msg.message || 'ASR streaming error');
        }
      } catch {}
    };

    this.ws.onerror = () => {
      this.onError('ASR WebSocket connection encountered an error.');
    };

    // 2. Request microphone stream
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32Array to 16-bit PCM buffer
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.ws.send(pcm16.buffer);
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (e: any) {
      this.onError(`Microphone access error: ${e?.message || e}`);
      this.stop();
    }
  }

  stop(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'finalize' }));
      setTimeout(() => {
        try { this.ws?.close(); } catch {}
        this.ws = null;
      }, 500);
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioContext) {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }
}
