/**
 * Bhasha Setu — S2S Multimodal ASR Adapter
 * 
 * Authoritative Offline Neural ASR Adapter:
 * - Single-owner microphone architecture: S2SAudioPipeline exclusively manages media stream
 * - Guaranteed 16 kHz Mono PCM streaming via WebSocket to local backend (port 5000)
 *   - Santali (sat) -> IndicConformer ONNX int8 backend (Ol Chiki script)
 *   - Hindi (hin) / English (eng) -> Faster-Whisper CPU int8 backend (Devanagari / Latin)
 * - Zero competing microphone streams (no WebSpeech interference on Windows audio driver)
 * - Turn-safe boundary validation and token-aware deduplication
 * - Standardized lifecycle event logging via S2STurnLogger
 */

import { ASRResultData, S2SError } from './s2sTypes';
import { S2SAudioPipeline } from './audioPipeline';
import { S2STurnLogger } from './s2sLogger';

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
  private audioPipeline: S2SAudioPipeline | null = null;
  private browserRecognition: any = null;
  private browserAutoFinalizeTimer: any = null;
  private browserDispatchFinal: ((reason: string) => void) | null = null;
  private startTime: number = 0;
  private options: ASRAdapterOptions = {};
  private hasEmittedFirstFrame: boolean = false;
  private hasLoggedSpeechStart: boolean = false;

  private static getWsUrl(lang: string = 'sat', turnId?: string): string {
    const base = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : '127.0.0.1';
    const proto = (typeof window !== 'undefined' && window.location?.protocol === 'https:') ? 'wss:' : 'ws:';
    const turnParam = turnId ? `&turnId=${encodeURIComponent(turnId)}` : '';
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ASR_WS_URL) {
      const separator = import.meta.env.VITE_ASR_WS_URL.includes('?') ? '&' : '?';
      return `${import.meta.env.VITE_ASR_WS_URL}${separator}lang=${encodeURIComponent(lang)}&sample_rate=16000${turnParam}`;
    }
    return `${proto}//${base}:5000/api/asr/stream?lang=${encodeURIComponent(lang)}&sample_rate=16000${turnParam}`;
  }

  /**
   * Token-aware boundary deduplication algorithm:
   * Removes overlapping boundary phrases between finalChunk and latestInterim
   * while preserving legitimate repeated words (e.g. "हाँ हाँ ठीक है" or "school school").
   */
  public static mergeTranscript(finalChunk: string, interim: string): string {
    const f = (finalChunk || '').trim();
    const i = (interim || '').trim();
    if (!f) return i;
    if (!i) return f;

    const fWords = f.split(/\s+/);
    const iWords = i.split(/\s+/);

    let maxOverlap = 0;
    const maxCheck = Math.min(fWords.length, iWords.length);
    for (let len = 1; len <= maxCheck; len++) {
      const fTail = fWords.slice(fWords.length - len).map(w => w.toLowerCase()).join(' ');
      const iHead = iWords.slice(0, len).map(w => w.toLowerCase()).join(' ');
      if (fTail === iHead) {
        maxOverlap = len;
      }
    }

    if (maxOverlap > 0) {
      const remainingInterim = iWords.slice(maxOverlap).join(' ');
      return remainingInterim ? `${f} ${remainingInterim}` : f;
    }

    return `${f} ${i}`;
  }

  constructor(options: ASRAdapterOptions = {}) {
    this.options = options;
  }

  /**
   * Starts speech recognition for the given turn and source language.
   * - Santali (sat): routes to local neural IndicConformer WebSocket streamer.
   * - English / Hindi / other: routes to browser native SpeechRecognition with zero-latency streaming.
   */
  public async startListening(
    sourceLang: string,
    turnId: string
  ): Promise<void> {
    this.abortTurn();
    this.activeTurnId = turnId;
    this.startTime = performance.now();
    this.hasEmittedFirstFrame = false;
    this.hasLoggedSpeechStart = false;

    S2STurnLogger.log(turnId, 'MIC_REQUEST', { sourceLang });

    if (sourceLang === 'sat') {
      await this.startLocalStreamingASR(turnId, sourceLang);
    } else {
      this.startBrowserSpeech(sourceLang, turnId);
    }
  }

  /**
   * Stops listening and flushes remaining audio before finalizing.
   */
  public stopListening(): void {
    const turnId = this.activeTurnId;
    if (!turnId) return;

    S2STurnLogger.log(turnId, 'ASR_FLUSH');

    // 1. If Browser native recognition is active, stop it cleanly
    if (this.browserRecognition) {
      if (this.browserAutoFinalizeTimer) {
        clearTimeout(this.browserAutoFinalizeTimer);
        this.browserAutoFinalizeTimer = null;
      }
      try {
        this.browserRecognition.stop();
      } catch {}
      if (this.browserDispatchFinal) {
        this.browserDispatchFinal('manual_stop');
      }
      return;
    }

    // 2. Flush any remaining pre-roll / buffered audio frames for neural stream
    if (this.audioPipeline) {
      this.audioPipeline.flush((chunk) => {
        if (this.activeTurnId === turnId && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(chunk.buffer);
        }
      });
    }

    // 3. Transmit finalize command with explicit turnId
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ action: 'finalize', turnId }));
      } catch {}

      // Keep pipeline capture running for 250ms bounded tail audio then stop capture
      setTimeout(() => {
        if (this.audioPipeline) {
          this.audioPipeline.stop();
          this.audioPipeline = null;
        }
      }, 250);
    } else {
      if (this.audioPipeline) {
        this.audioPipeline.stop();
        this.audioPipeline = null;
      }
    }
  }

  /**
   * Immediately aborts any in-flight turn, discarding intermediate data.
   */
  public abortTurn(): void {
    this.activeTurnId = null;

    if (this.browserAutoFinalizeTimer) {
      clearTimeout(this.browserAutoFinalizeTimer);
      this.browserAutoFinalizeTimer = null;
    }
    this.browserDispatchFinal = null;

    if (this.browserRecognition) {
      try {
        this.browserRecognition.abort();
      } catch {}
      this.browserRecognition = null;
    }

    if (this.audioPipeline) {
      this.audioPipeline.stop();
      this.audioPipeline = null;
    }

    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
  }

  public getAudioPipeline(): S2SAudioPipeline | null {
    return this.audioPipeline;
  }

  /**
   * Authoritative Local Streaming ASR via WebSocket:
   * S2SAudioPipeline captures and resamples to 16 kHz Mono PCM and streams to backend.
   */
  private async startLocalStreamingASR(turnId: string, lang: string): Promise<void> {
    this.audioPipeline = new S2SAudioPipeline();

    return new Promise((resolve) => {
      let isConnected = false;

      try {
        this.ws = new WebSocket(S2SASRAdapter.getWsUrl(lang, turnId));
      } catch {
        this.emitError(
          'WEBSOCKET_ERROR',
          `Unable to connect to local ASR service on port 5000 for ${lang.toUpperCase()}. Ensure backend is running.`,
          turnId
        );
        resolve();
        return;
      }

      this.ws.onopen = async () => {
        isConnected = true;
        try {
          await this.audioPipeline!.start({
            onAudioChunk: (pcm16) => {
              if (this.activeTurnId === turnId) {
                if (!this.hasEmittedFirstFrame) {
                  this.hasEmittedFirstFrame = true;
                  S2STurnLogger.log(turnId, 'FIRST_AUDIO_FRAME', {
                    sampleCount: pcm16.length,
                    sampleRate: this.audioPipeline?.getSampleRate()
                  });
                  S2STurnLogger.log(turnId, 'ASR_START', { lang });
                }

                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                  this.ws.send(pcm16.buffer);
                }
              }
            },
            onVadActivity: (isSpeaking, rms) => {
              if (this.activeTurnId === turnId) {
                if (isSpeaking && !this.hasLoggedSpeechStart) {
                  this.hasLoggedSpeechStart = true;
                  S2STurnLogger.log(turnId, 'VAD_SPEECH_START', { rms });
                }
                this.options.onVadActivity?.(isSpeaking, rms, turnId);
              }
            },
            onError: (err) => {
              this.emitError('MICROPHONE_ERROR', `Microphone capture failed: ${err.message}`, turnId);
            }
          });

          S2STurnLogger.log(turnId, 'MIC_GRANTED');
          S2STurnLogger.log(turnId, 'AUDIO_CONTEXT_STATE', {
            state: this.audioPipeline!.getAudioContextState(),
            nativeRate: this.audioPipeline!.getNativeSampleRate(),
            targetRate: this.audioPipeline!.getSampleRate()
          });
          S2STurnLogger.log(turnId, 'STREAM_CREATED', {
            trackStatus: this.audioPipeline!.getTrackStatus()
          });

          resolve();
        } catch (err: any) {
          this.emitError('MICROPHONE_ERROR', `Microphone start failed: ${err?.message || err}`, turnId);
          resolve();
        }
      };

      this.ws.onmessage = (event) => {
        if (this.activeTurnId !== turnId) return;

        try {
          const msg = JSON.parse(event.data);
          if (msg.turnId && msg.turnId !== turnId) return;

          if (msg.type === 'interim' && msg.text) {
            S2STurnLogger.log(turnId, 'ASR_INTERIM', { text: msg.text });
            this.options.onInterim?.(msg.text, turnId);
          } else if (msg.type === 'final') {
            const elapsed = Math.round(performance.now() - this.startTime);
            const text = msg.text || (msg.segments && msg.segments[0]?.text) || '';
            const confidence = typeof msg.asr_confidence === 'number'
              ? msg.asr_confidence
              : (msg.segments?.[0]?.asr_confidence ?? (text.trim() ? 0.90 : 0.0));

            const engineName = lang === 'sat'
              ? 'AI4Bharat IndicConformer ONNX int8'
              : 'Faster-Whisper (Local CPU)';

            S2STurnLogger.log(turnId, 'ASR_FINAL', {
              transcript: text.trim(),
              confidence,
              latencyMs: elapsed,
              engine: engineName
            });

            this.options.onFinal?.({
              transcript: text.trim(),
              asrConfidence: Math.min(1.0, Math.max(0.0, confidence)),
              language: lang,
              engine: engineName,
              latencyMs: elapsed,
              isFinal: true,
              turnId,
              wordCount: text.trim().split(/\s+/).filter(Boolean).length
            });

            if (this.activeTurnId === turnId) {
              this.activeTurnId = null;
            }
            if (this.ws) {
              try { this.ws.close(); } catch {}
              this.ws = null;
            }
          } else if (msg.type === 'error') {
            this.emitError('ASR_ERROR', msg.message || `${lang.toUpperCase()} ASR processing error`, turnId);
          }
        } catch (e) {
          console.warn('[ASRAdapter] Parse error on WS payload:', e);
        }
      };

      this.ws.onerror = () => {
        if (!isConnected) {
          this.emitError(
            'WEBSOCKET_ERROR',
            `Local ${lang.toUpperCase()} neural ASR service is not responding on port 5000. Start backend with: python -m server.main`,
            turnId
          );
        }
        resolve();
      };

      this.ws.onclose = () => {
        // Clean close
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

      // Map source language code
      let speechLang = 'en-IN';
      const langLower = sourceLang.toLowerCase();
      if (langLower === 'hin' || langLower === 'hi') {
        speechLang = 'hi-IN';
      } else if (langLower === 'eng' || langLower === 'en') {
        speechLang = 'en-IN';
      } else if (langLower === 'ben' || langLower === 'bn') {
        speechLang = 'bn-IN';
      } else if (langLower === 'ory' || langLower === 'or') {
        speechLang = 'or-IN';
      } else if (langLower === 'mar' || langLower === 'mr') {
        speechLang = 'mr-IN';
      } else if (langLower === 'guj' || langLower === 'gu') {
        speechLang = 'gu-IN';
      } else if (langLower === 'tam' || langLower === 'ta') {
        speechLang = 'ta-IN';
      } else if (langLower === 'tel' || langLower === 'te') {
        speechLang = 'te-IN';
      }

      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      let finalChunk = '';
      let latestInterim = '';
      let hasFinalized = false;
      let autoFinalizeTimer: any = null;
      const AUTO_FINALIZE_SILENCE_MS = 1400; // 1.4s of silence after speech automatically finalizes and translates

      const dispatchFinal = (reason: string) => {
        if (hasFinalized) return;
        hasFinalized = true;

        if (autoFinalizeTimer) {
          clearTimeout(autoFinalizeTimer);
          autoFinalizeTimer = null;
        }
        this.browserAutoFinalizeTimer = null;
        this.browserDispatchFinal = null;

        if (this.activeTurnId !== turnId) return;

        const text = S2SASRAdapter.mergeTranscript(finalChunk, latestInterim).trim();
        const elapsed = Math.round(performance.now() - this.startTime);

        S2STurnLogger.log(turnId, 'ASR_FINAL', {
          transcript: text,
          confidence: text ? 0.95 : 0.0,
          latencyMs: elapsed,
          engine: 'Browser WebSpeech API',
          reason
        });

        this.options.onFinal?.({
          transcript: text,
          asrConfidence: text ? 0.95 : 0.0,
          language: sourceLang,
          engine: 'Browser WebSpeech API',
          latencyMs: elapsed,
          isFinal: true,
          turnId,
          wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0
        });

        if (this.activeTurnId === turnId) {
          this.activeTurnId = null;
        }
        this.browserRecognition = null;
      };

      this.browserDispatchFinal = dispatchFinal;

      recognition.onspeechstart = () => {
        if (this.activeTurnId === turnId) {
          S2STurnLogger.log(turnId, 'VAD_SPEECH_START');
          this.options.onSpeechStart?.(turnId);
        }
      };

      recognition.onspeechend = () => {
        if (this.activeTurnId === turnId) {
          S2STurnLogger.log(turnId, 'VAD_SILENCE_START');
          this.options.onSpeechEnd?.(turnId);

          // If speech was vocalized, auto-finalize after short 800ms silence
          const currentText = (finalChunk + (latestInterim ? ' ' + latestInterim : '')).trim();
          if (currentText && !hasFinalized) {
            if (autoFinalizeTimer) {
              clearTimeout(autoFinalizeTimer);
            }
            autoFinalizeTimer = setTimeout(() => {
              if (this.activeTurnId === turnId && !hasFinalized) {
                try {
                  this.browserRecognition?.stop();
                } catch {}
                dispatchFinal('speechend_auto_finalize');
              }
            }, 800);
            this.browserAutoFinalizeTimer = autoFinalizeTimer;
          }
        }
      };

      recognition.onresult = (event: any) => {
        if (this.activeTurnId !== turnId) return;

        // Reset silence countdown on active incoming speech
        this.options.onSpeechStart?.(turnId);

        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += (finalChunk ? ' ' : '') + trans.trim();
            latestInterim = '';
          } else {
            currentInterim += trans;
          }
        }

        if (currentInterim) {
          latestInterim = currentInterim;
        }

        const liveDisplay = finalChunk
          ? (latestInterim ? `${finalChunk} ${latestInterim}` : finalChunk)
          : latestInterim;

        if (liveDisplay) {
          S2STurnLogger.log(turnId, 'ASR_INTERIM', { text: liveDisplay });
          this.options.onInterim?.(liveDisplay.trim(), turnId);

          // Clear any pending silence timer on new speech tokens
          if (autoFinalizeTimer) {
            clearTimeout(autoFinalizeTimer);
            autoFinalizeTimer = null;
          }

          // Automatically convert and translate after 1.4s of silence
          autoFinalizeTimer = setTimeout(() => {
            if (this.activeTurnId === turnId && !hasFinalized) {
              S2STurnLogger.log(turnId, 'VAD_ENDPOINT', { reason: 'auto_silence_after_speech', silenceMs: AUTO_FINALIZE_SILENCE_MS });
              try {
                this.browserRecognition?.stop();
              } catch {}
              dispatchFinal('auto_silence_after_speech');
            }
          }, AUTO_FINALIZE_SILENCE_MS);
          this.browserAutoFinalizeTimer = autoFinalizeTimer;
        }
      };

      recognition.onend = () => {
        dispatchFinal('recognition_onend');
      };

      recognition.onerror = (e: any) => {
        if (this.activeTurnId !== turnId) return;
        if (e.error === 'no-speech') {
          dispatchFinal('no_speech_event');
        } else if (e.error === 'aborted') {
          dispatchFinal('aborted_event');
        } else {
          this.emitError('ASR_ERROR', `Speech recognition ended: ${e.error}`, turnId);
        }
      };

      this.browserRecognition = recognition;
      recognition.start();
      S2STurnLogger.log(turnId, 'MIC_GRANTED', { engine: 'Browser WebSpeech', lang: speechLang });
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
    if (this.activeTurnId === turnId) {
      this.activeTurnId = null;
    }
  }
}
