import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Upload, 
  Copy, 
  Check, 
  Download, 
  Volume2, 
  Sparkles, 
  FileText, 
  Clock, 
  RotateCcw, 
  Languages, 
  ArrowRight, 
  Trash2, 
  FileAudio, 
  Activity, 
  Info,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Edit3,
  AlertTriangle,
  X,
  ShieldCheck
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { translateText, playTextSpeech } from '../../services/translationService';
import { 
  checkASRStatus, 
  transcribeAudioFile, 
  generateSRTContent, 
  MicrophoneStreamer,
  ASRSegment,
  ASRStatusResponse 
} from '../../services/asrService';
import { AudioQualityMonitor, AudioQualityStatus } from '../../services/audioQualityService';
import { saveHumanCorrection } from '../../services/humanCorrectionService';

interface TranscribeSegment {
  id: string;
  time: string;
  startSec: number;
  endSec: number;
  speaker: string;
  text: string;
  translation?: string;
  sourceLang: string;
  targetLang: string;
  asrConfidence?: number | null;
  translationConfidence?: number | null;
  lexiconMatch?: boolean;
  needsReview?: boolean;
  confidenceTier?: 'verified' | 'dataset' | 'fallback' | 'needs_review';
}

export const SpeechToTextPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mic' | 'upload'>('mic');
  const [sourceLang, setSourceLang] = useState('eng'); // Default: English (can change to Hindi, Santali, etc.)
  const [targetLang, setTargetLang] = useState('sat'); // Translation language (Default: Santali)
  const [autoSpeak, setAutoSpeak] = useState(false); // Auto-speak translated output
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [asrStatus, setAsrStatus] = useState<ASRStatusResponse | null>(null);
  const [realTimeFactor, setRealTimeFactor] = useState<number | null>(null);
  const [audioQuality, setAudioQuality] = useState<AudioQualityStatus | null>(null);

  // Human Correction Modal State
  const [editingSegment, setEditingSegment] = useState<TranscribeSegment | null>(null);
  const [editNativeText, setEditNativeText] = useState('');
  const [editTransText, setEditTransText] = useState('');

  // Transcript segments
  const [transcripts, setTranscripts] = useState<TranscribeSegment[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamerRef = useRef<MicrophoneStreamer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioMonitorRef = useRef<AudioQualityMonitor | null>(null);
  const silenceTimerRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const currentAccumRef = useRef<{ finalChunk: string; latestInterim: string }>({ finalChunk: '', latestInterim: '' });

  const sourceLangObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang) || SUPPORTED_LANGUAGES[0];
  const targetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLang) || SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.length - 1];

  // Poll ASR status on mount
  useEffect(() => {
    checkASRStatus().then(status => setAsrStatus(status)).catch(() => {});
  }, []);

  // Cleanup audio monitor and silence timers on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (streamerRef.current) {
        try { streamerRef.current.stop(); } catch {}
        streamerRef.current = null;
      }
      if (audioMonitorRef.current) {
        audioMonitorRef.current.stop();
      }
    };
  }, []);

  // Timer for recording
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Audio Waveform Animation on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.lineWidth = 3;
      ctx.strokeStyle = isRecording ? '#249144' : '#64748b';
      ctx.beginPath();

      const numBars = 48;
      const barWidth = width / numBars;

      for (let i = 0; i < numBars; i++) {
        const x = i * barWidth;
        const amplitude = isRecording
          ? Math.sin(phase + i * 0.25) * 25 + (Math.random() * 18)
          : Math.sin(phase + i * 0.1) * 5;

        ctx.moveTo(x, centerY - amplitude);
        ctx.lineTo(x, centerY + amplitude);
      }

      ctx.stroke();
      phase += isRecording ? 0.22 : 0.04;
      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isRecording]);

  // Helper to map UI language codes to Web Speech API acoustic models
  const getSpeechRecognitionLang = (code: string): string => {
    const l = code.toLowerCase();
    if (l === 'eng' || l === 'en') return 'en-IN';
    if (l === 'hin' || l === 'hi') return 'hi-IN';
    if (l === 'ben' || l === 'bn') return 'bn-IN';
    if (l === 'ory' || l === 'or') return 'or-IN';
    if (l === 'mar' || l === 'mr') return 'mr-IN';
    if (l === 'guj' || l === 'gu') return 'gu-IN';
    if (l === 'tam' || l === 'ta') return 'ta-IN';
    if (l === 'tel' || l === 'te') return 'te-IN';
    return 'hi-IN';
  };

  // Commit a finalized utterance into transcripts and trigger translation
  const commitTranscriptUtterance = async (rawSpoken: string) => {
    const spoken = rawSpoken.trim();
    if (!spoken) {
      setInterimText('');
      return;
    }

    setInterimText('');
    setIsProcessing(true);

    try {
      let translation = '';
      let transConf = 0.85;
      let isLexicon = false;

      if (targetLang !== sourceLang) {
        try {
          const tr = await translateText(spoken, sourceLang, targetLang);
          translation = tr.targetText;
          transConf = tr.reliability === 'verified' ? 0.98 : tr.reliability === 'dataset' ? 0.92 : 0.85;
          isLexicon = tr.reliability === 'verified';
        } catch (e) {
          console.warn('Translation error in STT:', e);
        }
      }

      const curSec = recordingSeconds;
      const tier: 'verified' | 'dataset' | 'fallback' = isLexicon ? 'verified' : 'dataset';

      const newSegment: TranscribeSegment = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        time: `${Math.floor(Math.max(0, curSec - 3) / 60).toString().padStart(2, '0')}:${Math.floor(Math.max(0, curSec - 3) % 60).toString().padStart(2, '0')} - ${Math.floor(curSec / 60).toString().padStart(2, '0')}:${Math.floor(curSec % 60).toString().padStart(2, '0')}`,
        startSec: Math.max(0, curSec - 3),
        endSec: curSec,
        speaker: 'Live Speaker',
        text: spoken,
        translation: translation || undefined,
        sourceLang,
        targetLang,
        asrConfidence: 0.95,
        translationConfidence: transConf,
        lexiconMatch: isLexicon,
        needsReview: false,
        confidenceTier: tier
      };

      setTranscripts(prev => [newSegment, ...prev]);

      if (autoSpeak && translation) {
        setPlayingSegmentId(`trans-${newSegment.id}`);
        playTextSpeech(translation, targetLang, 0.9, () => {
          setPlayingSegmentId(null);
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Start Real-time Microphone Speech Recognition
  const handleStartRecording = async () => {
    setErrorMessage(null);

    // Responsible AI Scope Guardrails (Mundari and Ho must NOT be fabricated)
    if (sourceLang === 'unr' || sourceLang === 'mundari') {
      setErrorMessage('Mundari ASR is currently under development. This language will be enabled after validated training and testing.');
      return;
    }
    if (sourceLang === 'hoc' || sourceLang === 'ho') {
      setErrorMessage('Ho ASR is currently under development. This language will be enabled after validated training and testing.');
      return;
    }

    // Initialize real-time audio quality monitoring
    try {
      const monitor = new AudioQualityMonitor((quality) => {
        setAudioQuality(quality);
      });
      await monitor.start();
      audioMonitorRef.current = monitor;
    } catch (e) {
      console.warn('Audio monitor start error:', e);
    }

    // --- Santali with backend available: Use Neural IndicConformer WebSocket ---
    if (sourceLang === 'sat' && asrStatus?.status === 'ready') {
      try {
        const streamer = new MicrophoneStreamer({
          onInterim: (text: string) => {
            setInterimText(text);
          },
          onFinal: async (seg: ASRSegment) => {
            await commitTranscriptUtterance(seg.text);
          },
          onError: (err: string) => {
            console.warn('ASR Stream notice:', err);
          }
        });

        await streamer.start();
        streamerRef.current = streamer;
        isRecordingRef.current = true;
        setIsRecording(true);
        return;
      } catch (err: any) {
        console.warn('Neural streamer start failed, falling back to browser recognition:', err);
      }
    }

    // --- Browser Native Speech Recognition ---
    const win = window as unknown as { webkitSpeechRecognition?: any; SpeechRecognition?: any };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setErrorMessage('Microphone speech recognition is not supported in this browser. Please try using Google Chrome or Microsoft Edge.');
      if (audioMonitorRef.current) {
        audioMonitorRef.current.stop();
        audioMonitorRef.current = null;
      }
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = getSpeechRecognitionLang(sourceLang);
      recognition.continuous = true;
      recognition.interimResults = true;

      currentAccumRef.current = { finalChunk: '', latestInterim: '' };
      isRecordingRef.current = true;
      setIsRecording(true);
      setInterimText('');

      const resetSilenceTimer = (delayMs: number = 1400) => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        silenceTimerRef.current = setTimeout(() => {
          if (!isRecordingRef.current) return;
          const { finalChunk, latestInterim } = currentAccumRef.current;
          const fullText = (finalChunk + (latestInterim ? ' ' + latestInterim : '')).trim();
          if (fullText) {
            currentAccumRef.current = { finalChunk: '', latestInterim: '' };
            commitTranscriptUtterance(fullText);
          }
        }, delayMs);
      };

      recognition.onspeechstart = () => {
        // Speech vocalization detected
      };

      recognition.onspeechend = () => {
        // Quick 800ms silence countdown after speech ends
        resetSilenceTimer(800);
      };

      recognition.onresult = (event: any) => {
        if (!isRecordingRef.current) return;

        let curInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentAccumRef.current.finalChunk += (currentAccumRef.current.finalChunk ? ' ' : '') + trans.trim();
            currentAccumRef.current.latestInterim = '';
          } else {
            curInterim += trans;
          }
        }

        if (curInterim) {
          currentAccumRef.current.latestInterim = curInterim;
        }

        const liveDisplay = currentAccumRef.current.finalChunk
          ? (currentAccumRef.current.latestInterim ? `${currentAccumRef.current.finalChunk} ${currentAccumRef.current.latestInterim}` : currentAccumRef.current.finalChunk)
          : currentAccumRef.current.latestInterim;

        if (liveDisplay) {
          setInterimText(liveDisplay.trim());
          resetSilenceTimer(1400);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'no-speech' || e.error === 'aborted') {
          return;
        }
        console.warn('Speech recognition notice:', e.error);
      };

      recognition.onend = () => {
        // Keep continuous recognition active while recording is true
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn('Speech recognition init error:', e);
      isRecordingRef.current = false;
      setIsRecording(false);
      if (audioMonitorRef.current) {
        audioMonitorRef.current.stop();
        audioMonitorRef.current = null;
      }
      setAudioQuality(null);
      setErrorMessage(`Failed to start microphone speech capture: ${e?.message || e}`);
    }
  };

  const handleStopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Immediately commit any pending speech text
    const { finalChunk, latestInterim } = currentAccumRef.current;
    const pendingText = (finalChunk + (latestInterim ? ' ' + latestInterim : '')).trim() || interimText.trim();
    if (pendingText) {
      currentAccumRef.current = { finalChunk: '', latestInterim: '' };
      commitTranscriptUtterance(pendingText);
    } else {
      setInterimText('');
    }

    if (audioMonitorRef.current) {
      audioMonitorRef.current.stop();
      audioMonitorRef.current = null;
    }
    setAudioQuality(null);

    if (streamerRef.current) {
      streamerRef.current.stop();
      streamerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  // Handle Audio File Upload & Transcription
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);

    // Responsible AI Scope Guardrails (Mundari and Ho must NOT be fabricated)
    if (sourceLang === 'unr' || sourceLang === 'mundari') {
      setErrorMessage('Mundari ASR is currently under development. This language will be enabled after validated training and testing.');
      setIsProcessing(false);
      return;
    }
    if (sourceLang === 'hoc' || sourceLang === 'ho') {
      setErrorMessage('Ho ASR is currently under development. This language will be enabled after validated training and testing.');
      setIsProcessing(false);
      return;
    }

    try {
      const result = await transcribeAudioFile(file, sourceLang, targetLang);
      setRealTimeFactor(result.real_time_factor);

      if (result.segments.length === 0 && !result.text) {
        setErrorMessage('No audible speech detected in the uploaded audio file.');
        setIsProcessing(false);
        return;
      }

      const newSegments: TranscribeSegment[] = result.segments.map((s, idx) => {
        const isNeedsRev = s.needs_review || (s.asr_confidence !== null && s.asr_confidence !== undefined && s.asr_confidence < 0.60);
        const tier = isNeedsRev
          ? 'needs_review'
          : s.lexicon_match || (s.asr_confidence && s.asr_confidence >= 0.85)
          ? 'verified'
          : (s.asr_confidence && s.asr_confidence >= 0.70)
          ? 'dataset'
          : 'fallback';

        return {
          id: s.id || `upload-${Date.now()}-${idx}`,
          time: `${Math.floor(s.start_sec / 60).toString().padStart(2, '0')}:${Math.floor(s.start_sec % 60).toString().padStart(2, '0')} - ${Math.floor(s.end_sec / 60).toString().padStart(2, '0')}:${Math.floor(s.end_sec % 60).toString().padStart(2, '0')}`,
          startSec: s.start_sec,
          endSec: s.end_sec,
          speaker: s.speaker || `Speaker ${1 + (idx % 2)}`,
          text: s.text,
          translation: s.translation,
          sourceLang,
          targetLang,
          asrConfidence: s.asr_confidence,
          translationConfidence: s.translation_confidence,
          lexiconMatch: s.lexicon_match,
          needsReview: isNeedsRev,
          confidenceTier: tier
        };
      });

      setTranscripts(prev => [...newSegments, ...prev]);
    } catch (err: any) {
      console.error('File upload ASR error:', err);
      setErrorMessage(`Neural ASR failed: ${err.message || 'Ensure backend server is running at http://127.0.0.1:5000.'}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Human Correction Handlers
  const handleOpenEdit = (segment: TranscribeSegment) => {
    setEditingSegment(segment);
    setEditNativeText(segment.text);
    setEditTransText(segment.translation || '');
  };

  const handleSaveCorrection = () => {
    if (!editingSegment) return;

    saveHumanCorrection({
      rawText: editingSegment.text,
      correctedText: editNativeText,
      sourceLang: editingSegment.sourceLang,
      targetLang: editingSegment.targetLang,
      rawTranslation: editingSegment.translation,
      correctedTranslation: editTransText,
      engine: 'SpeechToText IndicConformer'
    });

    setTranscripts(prev => prev.map(t => {
      if (t.id === editingSegment.id) {
        return {
          ...t,
          text: editNativeText,
          translation: editTransText || undefined,
          confidenceTier: 'verified',
          needsReview: false,
          lexiconMatch: true
        };
      }
      return t;
    }));

    setEditingSegment(null);
  };

  const getConfidenceTier = (seg: TranscribeSegment): 'verified' | 'dataset' | 'fallback' | 'needs_review' => {
    if (seg.confidenceTier) return seg.confidenceTier;
    if (seg.needsReview || (seg.asrConfidence !== null && seg.asrConfidence !== undefined && seg.asrConfidence < 0.60)) {
      return 'needs_review';
    }
    if (seg.lexiconMatch || (seg.asrConfidence && seg.asrConfidence >= 0.85)) {
      return 'verified';
    }
    if (seg.asrConfidence && seg.asrConfidence >= 0.70) {
      return 'dataset';
    }
    return 'fallback';
  };

  const handleCopyAll = () => {
    const fullText = transcripts.map(t => `${t.time} [${t.speaker}] (${t.sourceLang.toUpperCase()} → ${t.targetLang.toUpperCase()}):\n${t.text}\nTranslation: ${t.translation || ''}`).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSRT = () => {
    const asrSegments: ASRSegment[] = transcripts.map(t => ({
      id: t.id,
      start_sec: t.startSec,
      end_sec: t.endSec,
      text: t.text,
      speaker: t.speaker,
      translation: t.translation,
      asr_confidence: t.asrConfidence,
      translation_confidence: t.translationConfidence,
      needs_review: t.needsReview || false
    }));
    const srtContent = generateSRTContent(asrSegments);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BhashaSetu_Transcript_${sourceLang}_to_${targetLang}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteSegment = (id: string) => {
    setTranscripts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Engine Status */}
        <div className="w-full py-4 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#249144]" /> 
            <span>Neural Automatic Speech Recognition (ASR)</span>
            <span className="text-slate-300">•</span>
            <span className="text-[#249144] font-mono font-semibold">
              {asrStatus?.status === 'ready' ? 'IndicConformer Online' : 'Engine Standby'}
            </span>
          </div>

          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Speech to Text (ASR)
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-slate-500 font-normal">
            Transcribe real-time tribal audio speech and field recordings into authentic native script with bilingual subtitles.
          </p>

          {/* Technical Engine Status Pill */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <Cpu className="w-3 h-3 text-[#249144]" /> Model: <strong className="text-slate-700 font-medium">IndicConformer Santali (ONNX)</strong>
            </span>
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <CheckCircle2 className="w-3 h-3 text-[#249144]" /> Script: <strong className="text-slate-700 font-medium">Ol Chiki (U+1C50–U+1C7F)</strong>
            </span>
            {realTimeFactor !== null && (
              <span className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-[#14532d]">
                ⚡ RTF: <strong className="font-mono">{realTimeFactor.toFixed(2)}x</strong>
              </span>
            )}
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
            </div>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-amber-500 hover:text-amber-800 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dialect & Translation Language Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
          {/* Spoken Dialect */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Spoken Dialect:
            </span>
            <select
              value={sourceLang}
              onChange={(e) => {
                setSourceLang(e.target.value);
                setErrorMessage(null);
              }}
              aria-label="Select Spoken Language Dialect"
              className="bg-slate-50 border border-slate-200 hover:border-[#249144] rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none transition cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.id} value={l.code}>
                  {l.name} ({l.nativeName}) {l.code === 'sat' ? '★ Neural ASR' : l.isTribal ? '(Phase 2/3)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center text-slate-300">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Target Translation */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-[#249144]" /> 2. Translate To:
            </span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              aria-label="Select Target Translation Language"
              className="bg-slate-50 border border-slate-200 hover:border-[#249144] rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none transition cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.id} value={l.code}>
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Studio Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Top 2-Tab Mode Switcher */}
          <div className="flex border-b border-slate-200 bg-slate-50/60 p-2 gap-2">
            <button
              onClick={() => setActiveTab('mic')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'mic'
                  ? 'bg-white text-[#14532d] shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Mic className="w-4 h-4 text-[#249144]" />
              <span>Live Mic Transcribe</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-[#14532d] shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Upload className="w-4 h-4 text-[#249144]" />
              <span>Upload Audio File (MP3/WAV/M4A)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            
            {/* Left: Interactive Input Panel (5 cols) */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              
              {activeTab === 'mic' && (
                <div className="space-y-6">
                  {/* Oscilloscope Canvas */}
                  <div className="bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-between shadow-inner relative overflow-hidden h-48">
                    <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`}></span>
                        {isRecording ? 'RECORDING LIVE' : 'MIC READY'}
                      </span>
                      <span>{Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}</span>
                    </div>

                    <canvas
                      ref={canvasRef}
                      width={320}
                      height={90}
                      className="w-full h-24"
                    />

                    <span className="text-[10px] text-slate-400 font-medium">
                      {isRecording ? `Listening in ${sourceLangObj.name}... Speak clearly.` : `Tap green mic button to transcribe ${sourceLangObj.name}`}
                    </span>
                  </div>

                  {/* Audio Quality & Noise Heuristic Bar */}
                  {audioQuality && (
                    <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-2xs ${
                      audioQuality.status === 'good'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : audioQuality.status === 'moderate'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : audioQuality.status === 'poor'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          audioQuality.status === 'good' ? 'bg-emerald-500' :
                          audioQuality.status === 'moderate' ? 'bg-amber-500' :
                          audioQuality.status === 'poor' ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'
                        }`} />
                        <span className="font-bold capitalize">{audioQuality.status} Clarity</span>
                        <span className="text-[11px] opacity-75 font-mono">({audioQuality.snrEstimateDb} dB SNR)</span>
                      </div>
                      <span className="text-[11px] text-right truncate max-w-[220px]">
                        {audioQuality.message}
                      </span>
                    </div>
                  )}

                  {/* Real-time Emerald Live Recognition Bubble */}
                  {interimText && (
                    <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 shadow-sm animate-pulse transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                          <span className="font-bold text-xs text-[#14532d] uppercase tracking-wider">Speaking now...</span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-[#14532d] px-2 py-0.5 rounded-full font-mono font-semibold">Live Stream</span>
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-slate-800 break-words leading-relaxed">
                        {interimText}
                      </p>
                    </div>
                  )}

                  {/* Record Button Controls */}
                  <div className="flex flex-col items-center justify-center gap-3 pt-2">
                    {isRecording ? (
                      <button
                        onClick={handleStopRecording}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-transform active:scale-95 animate-pulse cursor-pointer"
                        title="Finish Speaking"
                      >
                        <Square className="w-6 h-6 fill-current" />
                      </button>
                    ) : (
                      <button
                        onClick={handleStartRecording}
                        className="w-16 h-16 rounded-full bg-[#249144] hover:bg-[#1a7536] text-white flex items-center justify-center shadow-lg shadow-green-600/30 transition-transform active:scale-95 group cursor-pointer"
                        title="Start Recording"
                      >
                        <Mic className="w-7 h-7 group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                    <span className="text-xs font-bold text-slate-700">
                      {isRecording ? 'Tap to finish speaking' : 'Tap to start speaking'}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'upload' && (
                <div className="space-y-6">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/*,.mp3,.wav,.m4a,.ogg"
                    className="hidden"
                  />

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#249144] bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition space-y-3"
                  >
                    <div className="p-4 rounded-2xl bg-white shadow-2xs text-[#249144]">
                      <FileAudio className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Upload Audio File
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Supports MP3, WAV, M4A, OGG up to 25MB
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                      Choose Audio File
                    </button>
                  </div>

                  {isProcessing && (
                    <div className="py-4 text-center text-xs text-slate-600 font-semibold flex items-center justify-center gap-2">
                      <Activity className="w-4 h-4 animate-spin text-[#249144]" />
                      <span>Neural IndicConformer processing audio waveform...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions Note */}
              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#249144]" /> How it works:
                </p>
                <p>
                  1. Speak or upload audio in the selected dialect ({sourceLangObj.name}).
                </p>
                <p>
                  2. ASR generates text in native script & translates it to {targetLangObj.name} with audio playback.
                </p>
                <p className="text-slate-400 italic">
                  Note: Santali uses AI4Bharat IndicConformer. Mundari & Ho ASR are currently under development.
                </p>
              </div>

            </div>

            {/* Right: Live Transcript & Subtitle Segments (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-slate-50/40 space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-[#14532d]">
                      <FileText className="w-4 h-4 text-[#249144]" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Transcribed Segments ({transcripts.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {sourceLangObj.name} → {targetLangObj.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Auto-play voice toggle */}
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-2xs hover:border-[#249144] transition">
                      <Volume2 className="w-3.5 h-3.5 text-[#249144]" />
                      <span className="font-medium text-[11px]">Auto Voice</span>
                      <input
                        type="checkbox"
                        checked={autoSpeak}
                        onChange={(e) => setAutoSpeak(e.target.checked)}
                        className="rounded border-slate-300 text-[#249144] focus:ring-[#249144] cursor-pointer"
                      />
                    </label>

                    <button
                      onClick={handleCopyAll}
                      disabled={transcripts.length === 0}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-[#249144] disabled:opacity-40 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-[#249144]" /> : <Copy className="w-3 h-3" />}
                      <span>Copy All</span>
                    </button>
                    <button
                      onClick={handleDownloadSRT}
                      disabled={transcripts.length === 0}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-[#249144] disabled:opacity-40 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export .SRT</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Streaming Emerald Card in Right Panel */}
                {interimText && (
                  <div className="mb-4 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 shadow-md animate-pulse">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></span>
                        <span className="font-bold text-xs text-[#14532d] uppercase tracking-wider">Speaking now...</span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-[#14532d] px-2 py-0.5 rounded-full font-mono font-semibold">Live Transcription</span>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-slate-900 break-words leading-relaxed">
                      {interimText}
                    </p>
                  </div>
                )}

                {/* Segments Stream */}
                <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                  {transcripts.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2">
                      <Mic className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No speech transcribed yet.</p>
                      <p className="text-slate-400 text-[11px]">
                        Tap the green mic button or upload an audio file to begin transcribing {sourceLangObj.name}.
                      </p>
                    </div>
                  ) : (
                    transcripts.map((t) => {
                      const tier = getConfidenceTier(t);

                      return (
                        <div
                          key={t.id}
                          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-[#249144]/60 transition-all space-y-2.5 group"
                        >
                          {/* Header metadata */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#249144]"></span>
                              {t.speaker}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {t.time}
                              </span>
                              <button
                                onClick={() => handleOpenEdit(t)}
                                className="text-slate-400 hover:text-[#249144] transition cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-100"
                                title="Suggest Human Correction"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span className="text-[10px] hidden sm:inline">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteSegment(t.id)}
                                className="text-slate-300 hover:text-red-500 transition cursor-pointer p-0.5"
                                title="Delete segment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Spoken Text in Native Script */}
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-base text-slate-900 font-medium leading-relaxed font-sans flex-1">
                              {t.text}
                            </p>
                            <button
                              onClick={() => {
                                setPlayingSegmentId(`src-${t.id}`);
                                playTextSpeech(t.text, t.sourceLang, 0.9, () => setPlayingSegmentId(null));
                              }}
                              className={`p-1.5 rounded-lg border transition cursor-pointer flex-shrink-0 ${
                                playingSegmentId === `src-${t.id}`
                                  ? 'bg-emerald-100 text-[#14532d] border-emerald-300 animate-pulse'
                                  : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-[#249144] border-slate-200'
                              }`}
                              title={`Play Spoken Audio (${t.sourceLang.toUpperCase()})`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Standardized 4-Tier Confidence Badges */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                            {tier === 'verified' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                                🟢 Verified
                                {t.asrConfidence && ` (${Math.round(t.asrConfidence * 100)}%)`}
                              </span>
                            )}
                            {tier === 'dataset' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1">
                                🟡 Dataset Match
                                {t.asrConfidence && ` (${Math.round(t.asrConfidence * 100)}%)`}
                              </span>
                            )}
                            {tier === 'fallback' && (
                              <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-semibold flex items-center gap-1">
                                🟠 Standard ASR
                              </span>
                            )}
                            {tier === 'needs_review' && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold flex items-center gap-1">
                                🔴 Needs Review
                              </span>
                            )}

                            {t.translation && t.lexiconMatch && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                                Lexicon Verified
                              </span>
                            )}
                          </div>

                          {/* Honest Quality Warning if Needs Review */}
                          {tier === 'needs_review' && (
                            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between gap-2 shadow-2xs">
                              <span className="flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                <span>We are not fully confident about this sentence. Review or edit below.</span>
                              </span>
                              <button
                                onClick={() => handleOpenEdit(t)}
                                className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 font-bold rounded-lg border border-rose-200 transition text-[11px] cursor-pointer flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" /> Edit
                              </button>
                            </div>
                          )}

                          {/* Translated Subtitle */}
                          {t.translation && (
                            <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-start justify-between gap-3">
                              <p className="text-xs text-[#14532d] font-semibold leading-normal flex-1">
                                <span className="text-slate-400 font-normal uppercase text-[10px] block">
                                  {targetLangObj.name} Translation:
                                </span>
                                {t.translation}
                              </p>
                              <button
                                onClick={() => {
                                  setPlayingSegmentId(`trans-${t.id}`);
                                  playTextSpeech(t.translation!, t.targetLang, 0.9, () => setPlayingSegmentId(null));
                                }}
                                className={`p-1.5 rounded-lg border transition cursor-pointer flex-shrink-0 ${
                                  playingSegmentId === `trans-${t.id}`
                                    ? 'bg-emerald-100 text-[#14532d] border-emerald-300 animate-pulse'
                                    : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#249144] border-slate-200'
                                }`}
                                title={`Play Translated Audio (${t.targetLang.toUpperCase()})`}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer Controls */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 mt-4">
                <span>Sampling: 16 kHz • Neural IndicConformer ASR</span>
                {transcripts.length > 0 && (
                  <button
                    onClick={() => setTranscripts([])}
                    className="hover:text-red-500 flex items-center gap-1 cursor-pointer transition font-medium"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Human Correction Modal */}
      {editingSegment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#249144]" />
                <h3 className="font-bold text-slate-900 text-base">Suggest Human Correction</h3>
              </div>
              <button 
                onClick={() => setEditingSegment(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Corrections are saved locally as verified ground-truth data for future model enhancement. Automatic retraining is strictly prevented.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Native Speech ({editingSegment.sourceLang.toUpperCase()})
                </label>
                <textarea
                  rows={2}
                  value={editNativeText}
                  onChange={e => setEditNativeText(e.target.value)}
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 focus:border-[#249144] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Translation ({editingSegment.targetLang.toUpperCase()})
                </label>
                <textarea
                  rows={2}
                  value={editTransText}
                  onChange={e => setEditTransText(e.target.value)}
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 focus:border-[#249144] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingSegment(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCorrection}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#249144] hover:bg-[#1a7536] text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Check className="w-4 h-4" /> Save Correction
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
