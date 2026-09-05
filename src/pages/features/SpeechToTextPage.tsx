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
  AlertCircle
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
}

export const SpeechToTextPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mic' | 'upload'>('mic');
  const [sourceLang, setSourceLang] = useState('sat'); // Default: Santali
  const [targetLang, setTargetLang] = useState('eng'); // Translation language
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [asrStatus, setAsrStatus] = useState<ASRStatusResponse | null>(null);
  const [realTimeFactor, setRealTimeFactor] = useState<number | null>(null);

  // Transcript segments
  const [transcripts, setTranscripts] = useState<TranscribeSegment[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamerRef = useRef<MicrophoneStreamer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sourceLangObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang) || SUPPORTED_LANGUAGES[0];
  const targetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLang) || SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.length - 1];

  // Poll ASR status on mount
  useEffect(() => {
    checkASRStatus().then(status => setAsrStatus(status)).catch(() => {});
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

  // Start Real-time Microphone Speech Recognition
  const handleStartRecording = async () => {
    setErrorMessage(null);

    // Phase 1 Scope Check
    if (sourceLang === 'unr' || sourceLang === 'mundari') {
      setErrorMessage('Mundari ASR is scheduled for Phase 2. This phase supports Santali (sat), Hindi (hin), and English (eng).');
      return;
    }
    if (sourceLang === 'hoc' || sourceLang === 'ho') {
      setErrorMessage('Ho ASR is scheduled for Phase 3. This phase supports Santali (sat), Hindi (hin), and English (eng).');
      return;
    }

    // --- Santali: Use Neural IndicConformer via WebSocket Streamer ---
    if (sourceLang === 'sat') {
      try {
        const streamer = new MicrophoneStreamer({
          onInterim: (text: string) => {
            setInterimText(text);
          },
          onFinal: async (seg: ASRSegment) => {
            setIsProcessing(true);
            let translation = '';
            let transConf = 0.85;
            let isLexicon = false;

            if (targetLang !== 'sat') {
              try {
                const tr = await translateText(seg.text, 'sat', targetLang);
                translation = tr.targetText;
                transConf = tr.reliability === 'verified' ? 0.98 : tr.reliability === 'dataset' ? 0.92 : 0.85;
                isLexicon = tr.reliability === 'verified';
              } catch (e) {
                console.warn('Translation error:', e);
              }
            }

            const newSeg: TranscribeSegment = {
              id: seg.id || `mic-${Date.now()}`,
              time: `${Math.floor(seg.start_sec / 60).toString().padStart(2, '0')}:${Math.floor(seg.start_sec % 60).toString().padStart(2, '0')} - ${Math.floor(seg.end_sec / 60).toString().padStart(2, '0')}:${Math.floor(seg.end_sec % 60).toString().padStart(2, '0')}`,
              startSec: seg.start_sec,
              endSec: seg.end_sec,
              speaker: 'Live Speaker',
              text: seg.text,
              translation: translation || undefined,
              sourceLang: 'sat',
              targetLang,
              asrConfidence: seg.asr_confidence,
              translationConfidence: transConf,
              lexiconMatch: isLexicon,
              needsReview: seg.needs_review
            };

            setTranscripts(prev => [newSeg, ...prev]);
            setInterimText('');
            setIsProcessing(false);
          },
          onError: (err: string) => {
            console.warn('ASR Stream error:', err);
            setErrorMessage(`Santali Neural ASR backend notice: ${err}. Ensure backend is running at http://127.0.0.1:5000.`);
            setIsRecording(false);
          }
        });

        await streamer.start();
        streamerRef.current = streamer;
        setIsRecording(true);
      } catch (err: any) {
        setErrorMessage(`Failed to start Santali microphone capture: ${err?.message || err}`);
        setIsRecording(false);
      }
      return;
    }

    // --- Hindi / English: Use Browser Native Acoustic Models ---
    const win = window as unknown as { webkitSpeechRecognition?: any; SpeechRecognition?: any };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setErrorMessage('Microphone speech recognition is not supported in this browser. Please try using Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = sourceLang === 'eng' ? 'en-IN' : 'hi-IN';
      recognition.continuous = true;
      recognition.interimResults = true;

      setIsRecording(true);
      setInterimText('');

      recognition.onresult = async (event: any) => {
        let interimAccum = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const spoken = transcriptSegment.trim();
            if (spoken) {
              setIsProcessing(true);
              const trans = await translateText(spoken, sourceLang, targetLang);
              const curSec = recordingSeconds;
              const newSegment: TranscribeSegment = {
                id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                time: `00:${Math.max(0, curSec - 4).toString().padStart(2, '0')} - 00:${curSec.toString().padStart(2, '0')}`,
                startSec: Math.max(0, curSec - 4),
                endSec: curSec,
                speaker: 'Live Speaker',
                text: spoken,
                translation: trans.targetText,
                sourceLang,
                targetLang,
                asrConfidence: null, // Honest: browser Web Speech doesn't give verified acoustic logprob
                translationConfidence: trans.reliability === 'verified' ? 0.98 : trans.reliability === 'dataset' ? 0.92 : 0.85,
                lexiconMatch: trans.reliability === 'verified',
                needsReview: false
              };
              setTranscripts(prev => [newSegment, ...prev]);
              setInterimText('');
              setIsProcessing(false);
            }
          } else {
            interimAccum += transcriptSegment;
          }
        }
        if (interimAccum) {
          setInterimText(interimAccum);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition init error:', e);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setInterimText('');
    if (streamerRef.current) {
      streamerRef.current.stop();
      streamerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  // Handle Audio File Upload & Transcription (Real Audio Processing Pipeline)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);

    // Phase 1 Scope Check
    if (sourceLang === 'unr' || sourceLang === 'mundari') {
      setErrorMessage('Mundari ASR is scheduled for Phase 2. This phase supports Santali (sat).');
      setIsProcessing(false);
      return;
    }
    if (sourceLang === 'hoc' || sourceLang === 'ho') {
      setErrorMessage('Ho ASR is scheduled for Phase 3. This phase supports Santali (sat).');
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

      const newSegments: TranscribeSegment[] = result.segments.map((s, idx) => ({
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
        needsReview: s.needs_review
      }));

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
    a.click();
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

                  {/* Interim Live Recognition Text Preview */}
                  {interimText && (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-[#14532d] animate-pulse">
                      <span className="font-bold">Recognizing:</span> {interimText}
                    </div>
                  )}

                  {/* Record Button Controls */}
                  <div className="flex flex-col items-center justify-center gap-3 pt-2">
                    {isRecording ? (
                      <button
                        onClick={handleStopRecording}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-transform active:scale-95 animate-pulse cursor-pointer"
                        title="Stop Recording"
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
                      {isRecording ? 'Tap to finish recording' : 'Tap to start speaking'}
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
                  Note: Santali uses AI4Bharat IndicConformer. Mundari & Ho ASR will arrive in Phases 2 & 3.
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

                  <div className="flex items-center gap-2">
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
                    transcripts.map((t) => (
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
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {t.time}
                            </span>
                            <button
                              onClick={() => handleDeleteSegment(t.id)}
                              className="text-slate-300 hover:text-red-500 transition cursor-pointer"
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
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-[#249144] border border-slate-200 transition cursor-pointer flex-shrink-0"
                            title={`Play Spoken Audio (${t.sourceLang.toUpperCase()})`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Honest Confidence & Quality Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                          {t.asrConfidence !== null && t.asrConfidence !== undefined ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#14532d] border border-emerald-200 font-semibold">
                              ASR Quality: {(t.asrConfidence * 100).toFixed(0)}% (Acoustic Verified)
                            </span>
                          ) : t.sourceLang === 'sat' ? (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                              ASR: IndicConformer (Neural CTC)
                            </span>
                          ) : null}

                          {t.needsReview && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                              Needs Verification
                            </span>
                          )}

                          {t.translation && t.lexiconMatch && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                              Translation: Lexicon Verified
                            </span>
                          )}
                        </div>

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
                              className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 text-slate-600 hover:text-[#249144] border border-slate-200 transition cursor-pointer flex-shrink-0"
                              title={`Play Translated Audio (${t.targetLang.toUpperCase()})`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
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
    </section>
  );
};
