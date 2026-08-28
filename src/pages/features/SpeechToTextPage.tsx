import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Upload, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  Download, 
  Volume2, 
  Sparkles, 
  FileText,
  Clock,
  RotateCcw
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { translateText, playTextSpeech } from '../../services/translationService';

interface TranscribeSegment {
  time: string;
  speaker: string;
  text: string;
  translation?: string;
}

const SAMPLE_SPEECHES = [
  {
    id: 'sample-snt-speech',
    title: 'Santali Community Address (Mayurbhanj)',
    language: 'Santali',
    languageCode: 'sat',
    duration: '0:42',
    transcript: [
      { time: '00:00 - 00:08', speaker: 'Speaker 1', text: 'ᱥᱟᱱᱟᱢ ᱠᱚ ᱡᱚᱦᱟᱨ! ᱛᱮᱦᱮᱧ ᱟᱵᱚ ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱤᱫᱤ ᱠᱟᱛᱮ ᱵᱚᱱ ᱜᱟᱞᱢᱟᱨᱟᱣᱟ᱾', translation: 'Greetings to everyone! Today we will discuss sickle cell disease screening.' },
      { time: '00:09 - 00:22', speaker: 'Speaker 1', text: 'ᱦᱟᱥᱯᱟᱛᱟᱞ ᱨᱮ ᱵᱤᱱ ᱠᱩᱲᱟᱹᱭ ᱛᱮ ᱢᱟᱭᱟᱢ ᱵᱤᱰᱟᱹᱣ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ᱾ ᱟᱯᱱᱟᱨ ᱦᱚᱲᱢᱚ ᱨᱮᱱᱟᱜ ᱡᱚᱛᱚᱱ ᱦᱟᱛᱟᱣ ᱢᱮ᱾', translation: 'Free blood screening is being provided at the hospital. Please take care of your health.' }
    ]
  },
  {
    id: 'sample-bhi-speech',
    title: 'Bhili Health Camp Dialogue (Jhabua)',
    language: 'Bhili',
    languageCode: 'bhi',
    duration: '0:35',
    transcript: [
      { time: '00:00 - 00:10', speaker: 'Speaker 1', text: 'हमारो गांव मां स्वास्थ्य शिविर लाग्यो छे।', translation: 'Health camp is organized in our village.' },
      { time: '00:11 - 00:25', speaker: 'Speaker 2', text: 'बधा भाइया-बेहना ने रगत नी जांच करवानी छे।', translation: 'All brothers and sisters must get their blood tested.' }
    ]
  },
  {
    id: 'sample-gon-speech',
    title: 'Gondi Forest Council Speech (Bastar)',
    language: 'Gondi',
    languageCode: 'gon',
    duration: '0:38',
    transcript: [
      { time: '00:00 - 00:12', speaker: 'Speaker 1', text: 'सेवा जोहार! सगा समाज तुन बड़ादेव पेन ना कृपा मंतू।', translation: 'Seva Johar! May the blessings of Badadev protect our community.' },
      { time: '00:13 - 00:28', speaker: 'Speaker 1', text: 'मावा नाटो ते स्कूल अऊर अस्पताल बने मंता।', translation: 'Our village school and clinic are running well.' }
    ]
  }
];

export const SpeechToTextPage: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState('sat');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscribeSegment[]>(SAMPLE_SPEECHES[0].transcript);
  const [activeSample, setActiveSample] = useState(SAMPLE_SPEECHES[0]);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

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

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isRecording ? '#249144' : '#cbd5e1';
      ctx.beginPath();

      const numBars = 40;
      const barWidth = width / numBars;

      for (let i = 0; i < numBars; i++) {
        const x = i * barWidth;
        const amplitude = isRecording
          ? Math.sin(phase + i * 0.3) * 20 + Math.random() * 15
          : Math.sin(phase + i * 0.1) * 4;

        ctx.moveTo(x, centerY - amplitude);
        ctx.lineTo(x, centerY + amplitude);
      }

      ctx.stroke();
      phase += isRecording ? 0.2 : 0.03;
      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isRecording]);

  const recognitionRef = useRef<any>(null);

  const handleStartRecording = () => {
    setIsRecording(true);

    const win = window as unknown as { webkitSpeechRecognition?: any; SpeechRecognition?: any };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.lang = selectedLang === 'eng' ? 'en-IN' : (selectedLang === 'hin' || selectedLang === 'sat' || selectedLang === 'bhi' || selectedLang === 'gon' ? 'hi-IN' : 'en-IN');
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = async (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const spoken = event.results[i][0].transcript;
              if (spoken.trim()) {
                const targetCode = selectedLang === 'sat' ? 'eng' : 'sat';
                const trans = await translateText(spoken, selectedLang, targetCode);
                const newSegment: TranscribeSegment = {
                  time: `00:00 - 00:${recordingSeconds < 10 ? '0' + recordingSeconds : recordingSeconds}`,
                  speaker: 'Live Speaker',
                  text: spoken,
                  translation: trans.targetText
                };
                setTranscripts(prev => [newSegment, ...prev]);
              }
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        console.warn('Speech recognition init error:', e);
      }
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  };

  const handleCopyAll = () => {
    const fullText = transcripts.map(t => `${t.time} [${t.speaker}]: ${t.text}\n(${t.translation})`).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSRT = () => {
    let srtContent = '';
    transcripts.forEach((t, index) => {
      srtContent += `${index + 1}\n00:00:00,000 --> 00:00:10,000\n${t.text}\n\n`;
    });
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BhashaSetu_Transcript_${Date.now()}.srt`;
    a.click();
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="w-full py-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#249144]" /> Neural Automatic Speech Recognition (ASR)
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Speech to Text (ASR)
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-500">
            Transcribe real-time tribal audio speech and field recordings into accurate written text and subtitles.
          </p>
        </div>

        {/* Studio Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            
            {/* Left: Recording Studio (5 cols) */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase">Input Dialect:</span>
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    aria-label="Select audio dialect"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none hover:border-[#249144] transition"
                  >
                    {SUPPORTED_LANGUAGES.filter(l => l.isTribal).map(lang => (
                      <option key={lang.id} value={lang.code}>
                        {lang.name} ({lang.nativeName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Oscilloscope Canvas */}
                <div className="bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-between shadow-inner relative overflow-hidden h-44 mb-6">
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
                    height={80}
                    className="w-full h-20"
                  />

                  <span className="text-[10px] text-slate-500 font-medium">
                    {isRecording ? 'Listening to speech frequencies...' : 'Press Mic to begin speaking'}
                  </span>
                </div>

                {/* Record Button Controls */}
                <div className="flex flex-col items-center justify-center gap-3">
                  {isRecording ? (
                    <button
                      onClick={handleStopRecording}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-transform active:scale-95 animate-pulse"
                      title="Stop Recording"
                    >
                      <Square className="w-6 h-6 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={handleStartRecording}
                      className="w-16 h-16 rounded-full bg-[#249144] hover:bg-[#1f6333] text-white flex items-center justify-center shadow-lg shadow-green-600/30 transition-transform active:scale-95 group"
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

              {/* Sample Audio Recordings */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Try Sample Speech Audio:
                </p>
                <div className="grid gap-2">
                  {SAMPLE_SPEECHES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveSample(s);
                        setSelectedLang(s.languageCode);
                        setTranscripts(s.transcript);
                      }}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between text-xs ${activeSample.id === s.id ? 'bg-green-50 border-[#249144] text-[#14532d] font-semibold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Play className="w-3.5 h-3.5 text-[#249144]" />
                        <span>{s.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{s.duration}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Real-time Transcript Output (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-slate-50/40">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#249144]" /> Transcribed Transcript ({transcripts.length} Segments)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyAll}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-[#249144] flex items-center gap-1.5 shadow-sm"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy All</span>
                    </button>
                    <button
                      onClick={handleDownloadSRT}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-[#249144] flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export .SRT</span>
                    </button>
                  </div>
                </div>

                {/* Segments Stream */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {transcripts.map((t, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-[#86c498] transition space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#249144]"></span> {t.speaker}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {t.time}
                        </span>
                      </div>

                      <p className="text-base text-slate-900 font-medium leading-relaxed font-olchiki">
                        {t.text}
                      </p>

                      {t.translation && (
                        <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-1.5">
                          Translation: {t.translation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400 mt-6">
                <span>Neural model sampling rate: 16 kHz • High Precision</span>
                <button
                  onClick={() => setTranscripts([])}
                  className="hover:text-red-500 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear transcript
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
