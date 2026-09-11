import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Download, 
  BookOpen, 
  Languages, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  RotateCcw,
  Sparkles,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { translateText, playTextSpeech } from '../../services/translationService';
import { MicrophoneStreamer, ASRSegment, generateSRTContent } from '../../services/asrService';
import { SANTALI_DATASET } from '../../data/santaliDataset';

interface LessonSegment {
  id: string;
  timestamp: string;
  startSec: number;
  endSec: number;
  speaker: string;
  text: string;
  translation: string;
  isVerified: boolean;
  needsReview: boolean;
}

interface ExtractedWord {
  sat: string;
  roman: string;
  hi: string;
  en: string;
}

export const TeacherModePage: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('hin'); // Teacher speaking Hindi or Santali
  const [targetLang, setTargetLang] = useState('sat'); // Classroom translation
  const [isRecording, setIsRecording] = useState(false);
  const [isLessonActive, setIsLessonActive] = useState(false);
  const [lessonSeconds, setLessonSeconds] = useState(0);
  const [liveCaption, setLiveCaption] = useState('');
  const [liveTranslation, setLiveTranslation] = useState('');
  const [segments, setSegments] = useState<LessonSegment[]>([]);
  const [extractedVocab, setExtractedVocab] = useState<ExtractedWord[]>([]);
  const [activeTab, setActiveTab] = useState<'captions' | 'summary' | 'vocab'>('captions');
  const [guardrailNotice, setGuardrailNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const streamerRef = useRef<MicrophoneStreamer | null>(null);

  const sourceLangObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang) || SUPPORTED_LANGUAGES[1];
  const targetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  // Lesson clock
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLessonActive && isRecording) {
      interval = setInterval(() => setLessonSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isLessonActive, isRecording]);

  // Extract vocabulary from segments dynamically
  useEffect(() => {
    const wordSet = new Set<string>();
    const vocabList: ExtractedWord[] = [];

    segments.forEach(seg => {
      const tokens = (seg.text + ' ' + seg.translation).toLowerCase().split(/[\s,।.]+/);
      tokens.forEach(tok => {
        if (tok.length > 2 && !wordSet.has(tok)) {
          wordSet.add(tok);
          // Find matching word in verified dataset
          const match = SANTALI_DATASET.find(d => 
            d.en.toLowerCase().includes(tok) || 
            d.hi.includes(tok) || 
            d.sat.includes(tok)
          );
          if (match && vocabList.length < 15) {
            vocabList.push({
              sat: match.sat,
              roman: match.roman,
              hi: match.hi,
              en: match.en
            });
          }
        }
      });
    });

    setExtractedVocab(vocabList);
  }, [segments]);

  const handleStartRecording = async () => {
    setGuardrailNotice(null);

    // Strict guardrails
    if (sourceLang === 'unr' || sourceLang === 'mundari') {
      setGuardrailNotice('Mundari ASR is currently under development. This language will be enabled after validated training and testing.');
      return;
    }
    if (sourceLang === 'hoc' || sourceLang === 'ho') {
      setGuardrailNotice('Ho ASR is currently under development. This language will be enabled after validated training and testing.');
      return;
    }

    setIsLessonActive(true);
    setIsRecording(true);
    setLiveCaption('');
    setLiveTranslation('');

    // Santali: Neural IndicConformer
    if (sourceLang === 'sat') {
      try {
        const streamer = new MicrophoneStreamer({
          onInterim: text => setLiveCaption(text),
          onFinal: async (seg: ASRSegment) => {
            if (seg.text) {
              const tr = await translateText(seg.text, 'sat', targetLang);
              setLiveTranslation(tr.targetText);
              const newSeg: LessonSegment = {
                id: `seg-${Date.now()}`,
                timestamp: `${Math.floor(lessonSeconds / 60)}:${(lessonSeconds % 60).toString().padStart(2, '0')}`,
                startSec: seg.start_sec,
                endSec: seg.end_sec,
                speaker: 'Teacher',
                text: seg.text,
                translation: tr.targetText,
                isVerified: tr.reliability === 'verified',
                needsReview: seg.needs_review || tr.reliability === 'unavailable' || tr.reliability === 'experimental'
              };
              setSegments(prev => [newSeg, ...prev]);
            }
          },
          onError: err => {
            console.warn('Teacher mode stream notice:', err);
            setIsRecording(false);
          }
        });

        await streamer.start();
        streamerRef.current = streamer;
      } catch (err) {
        setIsRecording(false);
      }
      return;
    }

    // Hindi / English: Native Web Speech
    const win = window as unknown as { webkitSpeechRecognition?: any; SpeechRecognition?: any };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsRecording(false);
      return;
    }

    try {
      const rec = new SpeechRecognitionClass();
      rec.lang = sourceLang === 'eng' ? 'en-IN' : 'hi-IN';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = async (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const spoken = chunk.trim();
            if (spoken) {
              setLiveCaption(spoken);
              const tr = await translateText(spoken, sourceLang, targetLang);
              setLiveTranslation(tr.targetText);

              const curSec = lessonSeconds;
              const newSeg: LessonSegment = {
                id: `seg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                timestamp: `${Math.floor(curSec / 60)}:${(curSec % 60).toString().padStart(2, '0')}`,
                startSec: Math.max(0, curSec - 4),
                endSec: curSec,
                speaker: 'Teacher',
                text: spoken,
                translation: tr.targetText,
                isVerified: tr.reliability === 'verified',
                needsReview: tr.reliability === 'unavailable' || tr.reliability === 'experimental'
              };
              setSegments(prev => [newSeg, ...prev]);
            }
          } else {
            interim += chunk;
            setLiveCaption(interim);
          }
        }
      };

      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (streamerRef.current) {
      streamerRef.current.stop();
      streamerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  const handleDownloadTXT = () => {
    let txt = `====================================================\n`;
    txt += `BHASHA SETU — CLASSROOM LESSON TRANSCRIPT\n`;
    txt += `Teacher Speech: ${sourceLangObj.name} | Target: ${targetLangObj.name}\n`;
    txt += `Duration: ${Math.floor(lessonSeconds / 60)}m ${lessonSeconds % 60}s | Date: ${new Date().toLocaleDateString()}\n`;
    txt += `====================================================\n\n`;

    segments.forEach((s, idx) => {
      txt += `[${s.timestamp}] ${s.speaker}: ${s.text}\n`;
      txt += `    Translation (${targetLangObj.name}): ${s.translation}\n\n`;
    });

    if (extractedVocab.length > 0) {
      txt += `\nKEY LESSON VOCABULARY:\n`;
      extractedVocab.forEach(v => {
        txt += `• ${v.sat} (${v.roman}) = ${v.hi} / ${v.en}\n`;
      });
    }

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BhashaSetu_Lesson_${sourceLang}_to_${targetLang}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSRT = () => {
    const srtSegments: ASRSegment[] = segments.map((s) => ({
      id: s.id,
      start_sec: s.startSec,
      end_sec: s.endSec,
      text: s.text,
      speaker: s.speaker,
      translation: s.translation,
      needs_review: s.needsReview
    }));

    const srtContent = generateSRTContent(srtSegments);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BhashaSetu_Lesson_Subtitles.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const verifiedCount = segments.filter(s => s.isVerified).length;
  const reviewCount = segments.filter(s => s.needsReview).length;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Top Classroom Bar */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">TEACHER MODE</h1>
              <p className="text-xs text-slate-500">Live classroom captions, lesson recording & automatic vocabulary extractor.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-500">Teacher:</span>
              <select
                value={sourceLang}
                onChange={e => { setSourceLang(e.target.value); setGuardrailNotice(null); }}
                className="font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200 outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={`t-${l.id}`} value={l.code}>
                    {l.name} {l.isTribal ? (l.code === 'sat' ? '★' : '(Phase 2/3)') : ''}
                  </option>
                ))}
              </select>

              <span className="text-slate-300">→</span>

              <span className="font-bold text-slate-500">Captions:</span>
              <select
                value={targetLang}
                onChange={e => setTargetLang(e.target.value)}
                className="font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200 outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={`c-${l.id}`} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Timer Pill */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-50 text-indigo-900 font-mono font-bold text-xs border border-indigo-100">
              <Clock className="w-3.5 h-3.5" />
              <span>{Math.floor(lessonSeconds / 60).toString().padStart(2, '0')}:{(lessonSeconds % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Responsible AI Guardrail Banner */}
        {guardrailNotice && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Responsible AI Guardrail</p>
              <p className="mt-0.5">{guardrailNotice}</p>
            </div>
            <button onClick={() => setGuardrailNotice(null)} className="text-amber-500 font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* GIANT LIVE CLASSROOM CAPTIONS SCREEN (Optimized for Projector / Smartboard) */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
            <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-emerald-400">
              <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`}></span>
              {isRecording ? 'LIVE CLASSROOM CAPTIONS (ACTIVE)' : 'STANDBY (PRESS START LESSON)'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-[#249144] hover:bg-[#1a7536] text-white'
                }`}
              >
                {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                <span>{isRecording ? 'Pause Captions' : 'Start Lesson Captions'}</span>
              </button>
            </div>
          </div>

          {/* Spoken Text (Teacher) */}
          <div className="min-h-[70px] flex items-center">
            <p className="text-2xl sm:text-3xl font-medium text-slate-200 leading-snug">
              {liveCaption || <span className="text-slate-500 italic text-xl">Teacher's spoken words will appear here in real-time...</span>}
            </p>
          </div>

          {/* Parallel Multilingual Translation Caption */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              Classroom Translation ({targetLangObj.name}):
            </span>
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300 font-sans tracking-wide leading-relaxed">
              {liveTranslation || <span className="text-slate-500 italic text-xl">Parallel tribal language subtitle display...</span>}
            </p>
          </div>
        </div>

        {/* 3-Tab Section: Lesson History, Summary & Extracted Vocabulary */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50/60 p-2 gap-2">
            <button
              onClick={() => setActiveTab('captions')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'captions' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Lesson Segments ({segments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'summary' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Lesson Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('vocab')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'vocab' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Vocabulary Extracted ({extractedVocab.length})</span>
            </button>
          </div>

          <div className="p-5">
            {/* Tab 1: Segments */}
            {activeTab === 'captions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Recorded utterances from this classroom session:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadTXT}
                      disabled={segments.length === 0}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:border-indigo-400 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> TXT
                    </button>
                    <button
                      onClick={handleDownloadSRT}
                      disabled={segments.length === 0}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:border-indigo-400 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> SRT Subtitles
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {segments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No lesson segments captured yet. Press "Start Lesson Captions" to begin.
                    </div>
                  ) : (
                    segments.map(seg => (
                      <div key={seg.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span className="font-bold text-slate-700">{seg.speaker}</span>
                            <span>• {seg.timestamp}</span>
                            {seg.isVerified && (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">✓ Verified</span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{seg.text}</p>
                          <p className="text-xs font-bold text-emerald-800">{seg.translation}</p>
                        </div>
                        <button
                          onClick={() => playTextSpeech(seg.translation, targetLang)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-600"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Lesson Summary */}
            {activeTab === 'summary' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Duration</span>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {Math.floor(lessonSeconds / 60)}m {lessonSeconds % 60}s
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                    <span className="text-[10px] uppercase font-bold text-indigo-700">Total Utterances</span>
                    <p className="text-lg font-bold text-indigo-900 mt-1">{segments.length}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Verified Phrases</span>
                    <p className="text-lg font-bold text-emerald-900 mt-1">{verifiedCount}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-amber-700">Low-Confidence</span>
                    <p className="text-lg font-bold text-amber-900 mt-1">{reviewCount}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <h4 className="font-bold text-slate-800 text-sm">Classroom Pedagogical Note</h4>
                  <p>
                    This lesson record facilitates bilingual bridge learning. Tribal students can view their mother tongue 
                    (Santali in Ol Chiki) aligned with instructional Hindi/English, accelerating classroom comprehension without language disorientation.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Vocabulary Extracted */}
            {activeTab === 'vocab' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Automatically extracted key vocabulary encountered during this lesson:
                </p>

                {extractedVocab.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    No vocabulary extracted yet. Speak lesson content to populate terminology.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {extractedVocab.map((v, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-900">{v.sat}</p>
                          <p className="text-[11px] text-slate-500 italic">({v.roman})</p>
                          <p className="text-xs font-semibold text-emerald-800">HI: {v.hi} • EN: {v.en}</p>
                        </div>
                        <button
                          onClick={() => playTextSpeech(v.sat, 'sat')}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50"
                          title="Listen pronunciation"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
