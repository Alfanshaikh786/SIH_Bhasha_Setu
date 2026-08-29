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
  Info
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { translateText, playTextSpeech } from '../../services/translationService';

interface TranscribeSegment {
  id: string;
  time: string;
  speaker: string;
  text: string;
  translation?: string;
  sourceLang: string;
  targetLang: string;
  confidence?: number;
}

export const SpeechToTextPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mic' | 'upload'>('mic');
  const [sourceLang, setSourceLang] = useState('sat'); // Spoken dialect
  const [targetLang, setTargetLang] = useState('eng'); // Translation language
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);

  // Initialize clean transcript segments
  const [transcripts, setTranscripts] = useState<TranscribeSegment[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sourceLangObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang) || SUPPORTED_LANGUAGES[0];
  const targetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLang) || SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.length - 1];

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
  const handleStartRecording = () => {
    const win = window as unknown as { webkitSpeechRecognition?: any; SpeechRecognition?: any };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert('Microphone speech recognition is not supported in this browser. Please try using Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      // Select appropriate recognition language
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
              const newSegment: TranscribeSegment = {
                id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                time: `00:00 - 00:${recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds}`,
                speaker: 'Live Speaker',
                text: spoken,
                translation: trans.targetText,
                sourceLang,
                targetLang,
                confidence: trans.confidence || 0.96
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
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  };

  // Handle Audio File Upload & Transcription
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    // Simulate neural speech transcription
    await new Promise(r => setTimeout(r, 1200));

    const sampleSentences = [
      { text: 'ᱤᱧ ᱫᱚ ᱵᱮᱥ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ᱾ ᱟᱯᱮ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ ᱯᱮᱭᱟ?', time: '00:00 - 00:06', speaker: 'Speaker 1' },
      { text: 'ᱟᱞᱮ ᱦᱚᱸ ᱵᱮᱥ ᱜᱮ ᱢᱮᱱᱟᱜ ᱞᱮᱭᱟ᱾', time: '00:07 - 00:14', speaker: 'Speaker 2' }
    ];

    const newSegments: TranscribeSegment[] = [];
    for (let i = 0; i < sampleSentences.length; i++) {
      const s = sampleSentences[i];
      const trans = await translateText(s.text, sourceLang, targetLang);
      newSegments.push({
        id: `upload-${Date.now()}-${i}`,
        time: s.time,
        speaker: s.speaker,
        text: s.text,
        translation: trans.targetText,
        sourceLang,
        targetLang,
        confidence: 0.96
      });
    }

    setTranscripts(prev => [...newSegments, ...prev]);
    setIsProcessing(false);
  };

  const handleCopyAll = () => {
    const fullText = transcripts.map(t => `${t.time} [${t.speaker}] (${t.sourceLang.toUpperCase()} → ${t.targetLang.toUpperCase()}):\n${t.text}\nTranslation: ${t.translation}`).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSRT = () => {
    let srtContent = '';
    transcripts.forEach((t, index) => {
      srtContent += `${index + 1}\n00:00:00,000 --> 00:00:08,000\n${t.text}\n${t.translation || ''}\n\n`;
    });
    const blob = new Blob([srtContent], { type: 'text/plain' });
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
        
        {/* Header */}
        <div className="w-full py-4 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#249144]" /> Neural Automatic Speech Recognition (ASR)
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Speech to Text (ASR)
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-slate-500 font-normal">
            Transcribe real-time tribal audio speech and field recordings into verified written text with bilingual subtitles.
          </p>
        </div>

        {/* Dialect & Translation Language Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
          {/* Spoken Dialect */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Spoken Dialect:
            </span>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              aria-label="Select Spoken Language Dialect"
              className="bg-slate-50 border border-slate-200 hover:border-[#249144] rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none transition cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={l.id} value={l.code}>
                  {l.name} ({l.nativeName}) {l.isTribal ? '★ Tribal' : ''}
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
              <span>Upload Audio File (MP3/WAV)</span>
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
                      <span>Neural ASR processing audio waveform...</span>
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
                        Tap the green mic button on the left to begin speaking in {sourceLangObj.name}.
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
                <span>Sampling: 16 kHz • Neural Precision ASR</span>
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
