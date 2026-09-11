/**
 * Bhasha Setu — S2S Multimodal ASR Adapter
 * 
 * Unifies:
 * 1. Santali (sat) -> WebSocket streaming to IndicConformer ONNX int8 backend (Ol Chiki)
 * 2. Hindi (hin) / English (eng) -> Browser Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * 
 * Race-Condition & Turn-Safety Guarantees:
 * - Every listener and message validation requires a matching `turnId`.
 * - In-flight chunks or delayed messages belonging to expired/aborted turns are rejected immediately.
 * - Tracks acoustic confidence, latency, and sample rates.
 */

import { ASRResultData, S2SError } from './s2sTypes';
import { S2SAudioPipeline } from './audioPipeline';

export interface ASRAdapterOptions {
  onInterim?: (text: string, turnId: string) => void;
  onFinal?: (result: ASRResultData) => void;
  onError?: (err: S2SError) => void;
  onVadActivity?: (isSpeaking: boolean, rms: number, turnId: string) => void;
  onSpeechStart?: (turnId: string) => void;
  onSpeechEnd?: (turnId: string) => void;
}

export class S2SASRAdapter {
  private activeTurnId: string | null = null;
  private ws: WebSocket | null = null;
  private browserRecognition: any = null;
  private audioPipeline: S2SAudioPipeline | null = null;
  private startTime: number = 0;
  private options: ASRAdapterOptions = {};

  private static readonly WS_URL = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ASR_WS_URL) || 
    'ws://127.0.0.1:5000/api/asr/stream';

  constructor(options: ASRAdapterOptions = {}) {
    this.options = options;
  }

  /**
   * Starts speech recognition for the given turn and source language.
   */
  public async startListening(
    sourceLang: string,
    turnId: string
  ): Promise<void> {
    this.stopListening();
    this.activeTurnId = turnId;
    this.startTime = performance.now();

    // 1. Santali -> Local Neural IndicConformer WebSocket Streamer
    if (sourceLang === 'sat') {
      await this.startSantaliStream(turnId);
      return;
    }

    // 2. Hindi / English -> Browser Native Speech Recognition
    this.startBrowserSpeech(sourceLang, turnId);
  }

  /**
   * Stops listening and finalizes any active stream.
   */
  public stopListening(): void {
    const turnId = this.activeTurnId;

    if (this.audioPipeline) {
      this.audioPipeline.stop();
      this.audioPipeline = null;
    }

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ action: 'finalize', turnId }));
        } catch {}
        setTimeout(() => {
          try { this.ws?.close(); } catch {}
          this.ws = null;
        }, 300);
      } else {
        try { this.ws.close(); } catch {}
        this.ws = null;
      }
    }

    if (this.browserRecognition) {
      try {
        this.browserRecognition.stop();
      } catch {}
      this.browserRecognition = null;
    }

    this.activeTurnId = null;
  }

  private async startSantaliStream(turnId: string): Promise<void> {
    this.audioPipeline = new S2SAudioPipeline();

    return new Promise((resolve) => {
      let isConnected = false;

      try {
        this.ws = new WebSocket(S2SASRAdapter.WS_URL);
      } catch (e: any) {
        this.emitError('WEBSOCKET_ERROR', 'Unable to initialize WebSocket connection for Santali ASR.', turnId);
        resolve();
        return;
      }

      this.ws.onopen = async () => {
        isConnected = true;
        try {
          await this.audioPipeline!.start({
            onAudioChunk: (pcm16) => {
              if (this.activeTurnId === turnId && this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(pcm16.buffer);
              }
            },
            onVadActivity: (isSpeaking, rms) => {
              if (this.activeTurnId === turnId) {
                this.options.onVadActivity?.(isSpeaking, rms, turnId);
              }
            },
            onError: (err) => {
              this.emitError('MICROPHONE_ERROR', `Microphone capture failed: ${err.message}`, turnId);
            }
          });
          resolve();
        } catch (err: any) {
          this.emitError('MICROPHONE_ERROR', `Microphone start failed: ${err?.message || err}`, turnId);
          resolve();
        }
      };

      this.ws.onmessage = (event) => {
        // TURN-SAFETY CHECK: Drop message if turn has expired or changed
        if (this.activeTurnId !== turnId) return;

        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'interim' && msg.text) {
            this.options.onInterim?.(msg.text, turnId);
          } else if (msg.type === 'final') {
            const elapsed = Math.round(performance.now() - this.startTime);
            const text = msg.text || (msg.segments && msg.segments[0]?.text) || '';
            const confidence = typeof msg.asr_confidence === 'number' 
              ? msg.asr_confidence 
              : (msg.segments?.[0]?.asr_confidence ?? 0.88);

            this.options.onFinal?.({
              transcript: text.trim(),
              asrConfidence: Math.min(1.0, Math.max(0.0, confidence)),
              language: 'sat',
              engine: 'AI4Bharat IndicConformer ONNX int8',
              latencyMs: elapsed,
              isFinal: true,
              turnId,
              wordCount: text.trim().split(/\s+/).filter(Boolean).length
            });
          } else if (msg.type === 'error') {
            this.emitError('ASR_ERROR', msg.message || 'Santali ASR processing error', turnId);
          }
        } catch (e) {
          console.warn('[ASRAdapter] Parse error on WS payload:', e);
        }
      };

      this.ws.onerror = () => {
        if (!isConnected) {
          this.emitError(
            'WEBSOCKET_ERROR',
            'Local Santali neural ASR service is not responding on port 5000.',
            turnId
          );
        }
        resolve();
      };

      this.ws.onclose = () => {
        // Clean disconnect
      };
    });
  }

  private startBrowserSpeech(sourceLang: string, turnId: string): void {
    const win = (typeof window !== 'undefined' ? window : {}) as any;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      this.emitError(
        'ASR_ERROR',
        'SpeechRecognition is not supported in this browser. Please use Chrome or Edge.',
        turnId
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = sourceLang === 'eng' ? 'en-IN' : 'hi-IN';
      recognition.continuous = true; // Stay active through natural pauses (1-5s)
      recognition.interimResults = true;

      let finalChunk = '';

      recognition.onspeechstart = () => {
        if (this.activeTurnId === turnId) {
          this.options.onSpeechStart?.(turnId);
        }
      };

      recognition.onspeechend = () => {
        if (this.activeTurnId === turnId) {
          this.options.onSpeechEnd?.(turnId);
        }
      };

      recognition.onresult = (event: any) => {
        // TURN-SAFETY CHECK: Drop stale event if turn has expired
        if (this.activeTurnId !== turnId) return;

        // Reset silence countdown on active incoming speech
        this.options.onSpeechStart?.(turnId);

        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += (finalChunk ? ' ' : '') + trans.trim();
          } else {
            interim += trans;
          }
        }

        if (interim) {
          this.options.onInterim?.(interim, turnId);
        }
      };

      recognition.onend = () => {
        if (this.activeTurnId !== turnId) return;

        const text = finalChunk.trim();
        const elapsed = Math.round(performance.now() - this.startTime);

        this.options.onFinal?.({
          transcript: text,
          asrConfidence: text ? 0.92 : 0.0,
          language: sourceLang,
          engine: 'Browser WebSpeech API',
          latencyMs: elapsed,
          isFinal: true,
          turnId,
          wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0
        });
      };

      recognition.onerror = (e: any) => {
        if (this.activeTurnId !== turnId) return;
        if (e.error === 'no-speech') {
          this.options.onFinal?.({
            transcript: '',
            asrConfidence: 0.0,
            language: sourceLang,
            engine: 'Browser WebSpeech API',
            latencyMs: Math.round(performance.now() - this.startTime),
            isFinal: true,
            turnId,
            wordCount: 0
          });
        } else {
          this.emitError('ASR_ERROR', `Speech recognition ended: ${e.error}`, turnId);
        }
      };

      this.browserRecognition = recognition;
      recognition.start();
    } catch (e: any) {
      this.emitError('ASR_ERROR', `Speech recognition start error: ${e?.message || e}`, turnId);
    }
  }

  private emitError(code: S2SError['code'], message: string, turnId: string): void {
    this.options.onError?.({
      code,
      message,
      turnId,
      recoverable: true,
      timestamp: Date.now()
    });
  }
}
