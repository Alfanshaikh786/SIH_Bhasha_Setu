import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Volume2, 
  RotateCcw, 
  Edit3, 
  Check, 
  ArrowRightLeft, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Sparkles,
  Info,
  CheckCircle2,
  X,
  VolumeX,
  Smartphone
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { translateText, playTextSpeech } from '../../services/translationService';
import { MicrophoneStreamer, ASRSegment } from '../../services/asrService';
import { AudioQualityMonitor, AudioQualityStatus } from '../../services/audioQualityService';
import { saveHumanCorrection } from '../../services/humanCorrectionService';
import { TranslationDecisionEngine } from '../../services/s2s/translationDecisionEngine';
import { DomainSafetyEngine } from '../../services/s2s/domainSafetyEngine';
import { S2SAutoStopController } from '../../services/s2s/autoStopController';

export const FieldModePage: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('sat'); // Default: Santali
  const [targetLang, setTargetLang] = useState('hin'); // Default: Hindi
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [spokenText, setSpokenText] = useState('ᱱᱩᱭ ᱫᱚ ᱜᱟᱹᱭ ᱠᱟᱱᱟᱭ ᱾');
  const [translatedText, setTranslatedText] = useState('यह गाय है।');
  const [pronunciation, setPronunciation] = useState('Nui do gai kanay.');
  const [confidenceTier, setConfidenceTier] = useState<'verified' | 'dataset' | 'fallback' | 'needs_review'>('verified');
  const [accepted, setAccepted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [guardrailNotice, setGuardrailNotice] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Audio quality monitoring
  const [audioQuality, setAudioQuality] = useState<AudioQualityStatus>({
    status: 'good',
    level: 25,
    snrEstimateDb: 18,
    message: 'Optimal speech clarity',
    isClipping: false
  });

  // Edit modal
  const [isEditing, setIsEditing] = useState(false);
  const [editSpoken, setEditSpoken] = useState('');
  const [editTranslated, setEditTranslated] = useState('');

  const recognitionRef = useRef<any>(null);
  const streamerRef = useRef<MicrophoneStreamer | null>(null);
  const qualityMonitorRef = useRef<AudioQualityMonitor | null>(null);
  const autoStopRef = useRef<S2SAutoStopController | null>(null);

  const sourceLangObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang) || SUPPORTED_LANGUAGES[0];
  const targetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLang) || SUPPORTED_LANGUAGES[1];

  // Start audio monitor
  useEffect(() => {
    const monitor = new AudioQualityMonitor(status => {
      setAudioQuality(status);
    });
    monitor.start().catch(() => {});
    qualityMonitorRef.current = monitor;

    return () => {
      monitor.stop();
      autoStopRef.current?.cancel();
      if (streamerRef.current) streamerRef.current.stop();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  const handleSwapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setGuardrailNotice(null);
  };

  const processSpokenInput = async (text: string, asrConf?: number | null) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setIsRecording(false);
      return;
    }

    setSpokenText(trimmed);
    setStatusMessage('Translating on-device...');

    const res = await TranslationDecisionEngine.resolveTranslation(trimmed, sourceLang, targetLang);
    setTranslatedText(res.targetText);
    setPronunciation(res.transliteration || '');

    // Separate ASR vs Translation confidence via DomainSafetyEngine
    const reliability = DomainSafetyEngine.evaluateTurnReliability(
      asrConf ?? 0.88,
      res.translationConfidence,
      res.method,
      trimmed,
      res.targetText
    );

    setConfidenceTier(reliability.finalTier);

    setIsRecording(false);
    setInterimText('');
    setStatusMessage(null);
    setAccepted(false);

    // Auto audio feedback
    if (res.targetText) {
      playTextSpeech(res.targetText, targetLang);
    }
  };

  const handleStartSpeaking = async () => {
    setGuardrailNotice(null);
    setAccepted(false);

    // --- RESPONSIBLE AI GUARDRAIL: Strict block on Mundari & Ho ---
    if (sourceLang === 'unr' || sourceLang === 'mundari') {
      setGuardrailNotice('Mundari ASR is currently under development. This language will be enabled after validated training and testing.');
      return;
    }
    if (sourceLang === 'hoc' || sourceLang === 'ho') {
      setGuardrailNotice('Ho ASR is currently under development. This language will be enabled after validated training and testing.');
      return;
    }

    setIsRecording(true);
    setInterimText('');

    // Silence Auto-Stop Controller for Field Mode
    autoStopRef.current?.cancel();
    const autoStop = new S2SAutoStopController({
      onAutoStop: () => {
        handleStopSpeaking();
      }
    });
    autoStop.start(`field-${Date.now()}`);
    autoStopRef.current = autoStop;

    // Santali: Neural IndicConformer
    if (sourceLang === 'sat') {
      setStatusMessage('Listening in Santali (Ol Chiki)...');
      try {
        const streamer = new MicrophoneStreamer({
          onInterim: text => {
            setInterimText(text);
            autoStopRef.current?.onSpeechDetected();
          },
          onFinal: (seg: ASRSegment) => {
            if (seg.text) {
              processSpokenInput(seg.text, seg.asr_confidence);
            }
          },
          onError: err => {
            console.warn('ASR Stream error in field mode:', err);
            setStatusMessage('Local Santali ASR server offline. Tap edit to enter text manually.');
            setIsRecording(false);
          }
        });

        await streamer.start();
        streamerRef.current = streamer;
      } catch (err: any) {
        setStatusMessage(`Mic error: ${err?.message || err}`);
        setIsRecording(false);
      }
      return;
    }

    // Hindi / English: Browser native
    const win = window as unknown as { webkitSpeechRecognition?: any; SpeechRecognition?: any };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setStatusMessage('Speech recognition unsupported in this browser.');
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = sourceLang === 'eng' ? 'en-IN' : 'hi-IN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (e: any) => {
        autoStopRef.current?.onSpeechDetected();
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }
        setInterimText(final || interim);
        if (final) {
          processSpokenInput(final);
        }
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handleStopSpeaking = () => {
    setIsRecording(false);
    if (autoStopRef.current) {
      autoStopRef.current.manualStop();
      autoStopRef.current = null;
    }
    if (streamerRef.current) {
      streamerRef.current.stop();
      streamerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  const handleOpenEdit = () => {
    setEditSpoken(spokenText);
    setEditTranslated(translatedText);
    setIsEditing(true);
  };

  const handleSaveCorrection = () => {
    saveHumanCorrection({
      rawText: spokenText,
      correctedText: editSpoken,
      sourceLang,
      targetLang,
      rawTranslation: translatedText,
      correctedTranslation: editTranslated,
      engine: 'Field Mode'
    });

    setSpokenText(editSpoken);
    setTranslatedText(editTranslated);
    setConfidenceTier('verified');
    setAccepted(true);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pt-24 pb-16 px-4 sm:px-6 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full space-y-6">

        {/* Header Mode Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h1 className="text-base sm:text-lg font-bold tracking-wide">FIELD MODE</h1>
            <span className="text-xs text-slate-400">• Simple Offline Communication</span>
          </div>

          {/* Audio Clarity Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-[11px]">
            <span className={`w-2 h-2 rounded-full ${
              audioQuality.status === 'good' ? 'bg-emerald-400' :
              audioQuality.status === 'moderate' ? 'bg-yellow-400' : 'bg-red-400'
            }`}></span>
            <span className="text-slate-300 capitalize">{audioQuality.status} Audio</span>
          </div>
        </div>

        {/* Responsible AI Notice */}
        {guardrailNotice && (
          <div className="p-4 bg-amber-950/80 border border-amber-600 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Responsible AI Guardrail</p>
              <p className="mt-0.5">{guardrailNotice}</p>
            </div>
            <button onClick={() => setGuardrailNotice(null)} className="text-amber-400 font-bold">✕</button>
          </div>
        )}

        {/* Noise Coaching Alert if audio poor */}
        {audioQuality.status === 'poor' && (
          <div className="p-3 bg-amber-900/40 border border-amber-500/50 rounded-2xl text-xs text-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{audioQuality.message}</span>
          </div>
        )}

        {/* Language Selection Row */}
        <div className="bg-slate-800/90 rounded-3xl p-3 border border-slate-700/80 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block ml-1">Spoken Language</span>
            <select
              value={sourceLang}
              onChange={e => { setSourceLang(e.target.value); setGuardrailNotice(null); }}
              className="w-full mt-1 bg-slate-700 text-white font-bold text-sm py-2 px-3 rounded-2xl border border-slate-600 outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={`src-${l.id}`} value={l.code}>
                  {l.name} {l.isTribal ? (l.code === 'sat' ? '★' : '(Phase 2/3)') : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwapLanguages}
            className="p-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-emerald-400 transition cursor-pointer mt-4"
            title="Swap Languages"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block ml-1">Translate To</span>
            <select
              value={targetLang}
              onChange={e => setTargetLang(e.target.value)}
              className="w-full mt-1 bg-slate-700 text-white font-bold text-sm py-2 px-3 rounded-2xl border border-slate-600 outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map(l => (
                <option key={`tgt-${l.id}`} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Screen: Output Cards */}
        <div className="space-y-3">
          
          {/* 1. Spoken Native Script Card */}
          <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 space-y-2 relative shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-400">
                1. Spoken ({sourceLangObj.name})
              </span>
              <button
                onClick={() => playTextSpeech(spokenText, sourceLang)}
                className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Listen</span>
              </button>
            </div>

            <p className="text-xl sm:text-2xl font-bold font-sans tracking-wide leading-relaxed text-slate-100">
              {spokenText || <span className="text-slate-500 italic">Tap microphone below to speak...</span>}
            </p>

            {interimText && (
              <p className="text-xs text-emerald-300 animate-pulse">
                Recognizing: {interimText}
              </p>
            )}
          </div>

          {/* 2. Translated Target Card */}
          <div className="bg-emerald-950/70 rounded-3xl p-5 border border-emerald-700/80 space-y-2 shadow-md">
            <div className="flex items-center justify-between text-xs text-emerald-300">
              <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-300">
                2. Translation ({targetLangObj.name})
              </span>
              <button
                onClick={() => playTextSpeech(translatedText, targetLang)}
                className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-emerald-200" />
                <span>Listen</span>
              </button>
            </div>

            <p className="text-2xl sm:text-3xl font-extrabold text-white leading-normal">
              {translatedText || <span className="text-slate-500 italic">—</span>}
            </p>

            {pronunciation && (
              <p className="text-xs text-emerald-300/80 italic font-mono">
                Phonetic: {pronunciation}
              </p>
            )}

            {/* Provenance Badge */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {confidenceTier === 'verified' && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-800/90 text-emerald-100 text-[11px] font-bold border border-emerald-500">
                    🟢 Verified Translation (Exact Match)
                  </span>
                )}
                {confidenceTier === 'dataset' && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-900/80 text-blue-200 text-[11px] font-bold border border-blue-500">
                    🟡 Known Dataset Match
                  </span>
                )}
                {confidenceTier === 'fallback' && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-900/80 text-amber-200 text-[11px] font-bold border border-amber-500">
                    🟠 Fallback Generated
                  </span>
                )}
                {confidenceTier === 'needs_review' && (
                  <span className="px-2.5 py-1 rounded-full bg-red-900/80 text-red-200 text-[11px] font-bold border border-red-500">
                    🔴 Needs Review (Check with speaker)
                  </span>
                )}
              </div>

              {accepted && (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Accepted
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Core Field Action Buttons: Repeat | Edit | Accept */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => playTextSpeech(translatedText, targetLang)}
            className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>REPEAT</span>
          </button>

          <button
            onClick={handleOpenEdit}
            className="py-3 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-amber-400" />
            <span>EDIT</span>
          </button>

          <button
            onClick={() => setAccepted(true)}
            className="py-3 px-2 rounded-2xl bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>ACCEPT</span>
          </button>
        </div>

        {/* GIANT MICROPHONE BUTTON */}
        <div className="flex flex-col items-center justify-center pt-2">
          {isRecording ? (
            <button
              onClick={handleStopSpeaking}
              className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl shadow-red-500/50 animate-pulse transition transform active:scale-90 cursor-pointer"
              title="Stop Recording"
            >
              <Square className="w-10 h-10 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleStartSpeaking}
              className="w-24 h-24 rounded-full bg-[#249144] hover:bg-[#1a7536] text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 hover:scale-105 transition transform active:scale-90 cursor-pointer"
              title="Tap and Speak"
            >
              <Mic className="w-12 h-12" />
            </button>
          )}

          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-300">
            {isRecording ? 'Listening... Tap to finish' : `Tap to speak in ${sourceLangObj.name}`}
          </p>
        </div>

        {/* Collapsible Technical Details */}
        <div className="pt-2">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition py-2 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Technical Provenance & Health Details
            </span>
            {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showTechnicalDetails && (
            <div className="mt-2 p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-300 space-y-1.5 animate-in fade-in">
              <p>• <strong>ASR Architecture:</strong> {sourceLang === 'sat' ? 'AI4Bharat IndicConformer (ONNX int8)' : 'Browser Acoustic Model'}</p>
              <p>• <strong>Target Script:</strong> {targetLang === 'sat' ? 'Ol Chiki (U+1C50–U+1C7F)' : 'Devanagari / Latin'}</p>
              <p>• <strong>Offline Database:</strong> 6,780 Verified parallel records indexed on-device</p>
              <p>• <strong>Audio Signal:</strong> 16 kHz Mono • SNR ~{audioQuality.snrEstimateDb} dB</p>
            </div>
          )}
        </div>

      </div>

      {/* In-Place Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-sm text-white">Correct Text (Saved to Local Audit)</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Spoken ({sourceLangObj.name})</label>
                <input
                  type="text"
                  value={editSpoken}
                  onChange={e => setEditSpoken(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Translation ({targetLangObj.name})</label>
                <input
                  type="text"
                  value={editTranslated}
                  onChange={e => setEditTranslated(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white font-bold outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCorrection}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#249144] hover:bg-[#1a7536] text-white flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save & Accept
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
