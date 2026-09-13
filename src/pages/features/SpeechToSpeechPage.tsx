import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Radio, 
  Mic, 
  Square, 
  Volume2, 
  Sparkles, 
  ArrowLeftRight, 
  RotateCcw,
  Send,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  Languages,
  MessageSquare,
  HelpCircle,
  Edit3,
  Check,
  X,
  User,
  GraduationCap
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { playTextSpeech } from '../../services/translationService';
import { saveHumanCorrection } from '../../services/humanCorrectionService';
import { S2STurnController } from '../../services/s2s/turnController';
import { S2STurnRecord, ConfidenceTier, SpeakerRole } from '../../services/s2s/s2sTypes';

interface ChatMessage {
  id: string;
  sender: 'speakerA' | 'speakerB';
  senderRole: string; // e.g. "Person A (Teacher/Doctor)" or "Person B (Student/Citizen)"
  sourceLang: string;
  targetLang: string;
  langName: string;
  originalText: string;
  translatedText: string;
  pronunciation?: string;
  time: string;
  confidenceTier: ConfidenceTier;
  needsReview: boolean;
}

// Curated authentic general sentences from dataset
const GENERAL_DATASET_PHRASES = [
  {
    category: 'Classroom & Greetings',
    phrases: [
      { en: 'What is your name?', sat: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ?', roman: 'Amag nyutum ched?', hi: 'आपका नाम क्या है?' },
      { en: 'Open your book.', sat: 'ᱟᱢᱟᱜ ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱢᱮ ᱾', roman: 'Amag puthi jhij me.', hi: 'अपनी किताब खोलो।' },
      { en: 'Listen carefully.', sat: 'ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱧᱡᱚᱢ ᱢᱮ ᱾', roman: 'Dheyan te aamjom me.', hi: 'ध्यान से सुनो।' },
      { en: 'I am reading Ol Chiki.', sat: 'ᱤᱧ ᱫᱚ ᱚᱞ ᱪᱤᱠᱤ ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟᱧ ᱾', roman: 'Inj do Ol Chiki parhao kananj.', hi: 'मैं ओल चिकी पढ़ रहा हूँ।' },
      { en: 'Greetings / Welcome', sat: 'ᱡᱚᱦᱟᱨ', roman: 'Johar', hi: 'नमस्ते / जोहार' },
      { en: 'Welcome to our school.', sat: 'ᱟᱞᱮᱭᱟᱜ ᱟᱥᱲᱟ ᱨᱮ ᱟᱯᱮᱭᱟᱜ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ ᱾', roman: 'Aleyag asra re apeyag sagun daram.', hi: 'हमारे विद्यालय में आपका स्वागत है।' }
    ]
  },
  {
    category: 'Health & Hospital',
    phrases: [
      { en: 'Where does it hurt?', sat: 'ᱚᱠᱟᱨᱮ ᱦᱟᱹᱥᱩ ᱮᱫ ᱢᱮᱭᱟ?', roman: 'Okare hasu ed meya?', hi: 'कहाँ दर्द हो रहा है?' },
      { en: 'Do you have a fever?', sat: 'ᱟᱢ ᱫᱚ ᱨᱩᱣᱟᱹ ᱦᱮᱡ ᱟᱠᱟᱱ ᱢᱮᱭᱟ?', roman: 'Am do ruwa hej akan meya?', hi: 'क्या आपको बुखार है?' },
      { en: 'Where is the hospital?', sat: 'ᱦᱟᱥᱯᱟᱛᱟᱞ ᱫᱚ ᱚᱠᱟᱨᱮ ᱢᱮᱱᱟᱜ-ᱟ?', roman: 'Haspatal do okare menag-a?', hi: 'अस्पताल कहाँ है?' },
      { en: 'It is time to take medicine.', sat: 'ᱨᱟᱱ ᱡᱚᱢ ᱨᱮᱭᱟᱜ ᱚᱠᱛᱚ ᱦᱩᱭ ᱮᱱᱟ ᱾', roman: 'Ran jom reyag okto hoyena.', hi: 'दवा लेने का समय हो गया है।' },
      { en: 'Sickle cell screening test was completed.', sat: 'ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱦᱩᱭ ᱮᱱᱟ ᱾', roman: 'Sikil sel bidaw hoyena.', hi: 'सिकल सेल जांच पूरी हो गई।' }
    ]
  },
  {
    category: 'Daily Life & Agriculture',
    phrases: [
      { en: 'This is a cow.', sat: 'ᱱᱩᱭ ᱫᱚ ᱜᱟᱹᱭ ᱠᱟᱱᱟᱭ ᱾', roman: 'Nui do gai kanay.', hi: 'यह गाय है।' },
      { en: 'Sowing of seeds was done.', sat: 'ᱤᱛᱟᱹ ᱮᱨ ᱦᱩᱭ ᱮᱱᱟ ᱾', roman: 'Ita er hoeyena.', hi: 'बीज बोने का काम हो गया।' },
      { en: 'Our country is India.', sat: 'ᱟᱵᱚᱣᱟᱜ ᱫᱤᱥᱚᱢ ᱫᱚ ᱵᱷᱟᱨᱚᱛ ᱠᱟᱱᱟ ᱾', roman: 'Abowag disom do bharat kana.', hi: 'हमारा देश भारत है।' },
      { en: 'Please give me drinking water.', sat: 'ᱫᱟᱭᱟ ᱠᱟᱛᱮ ᱤᱧ ᱧᱩ ᱫᱟᱜ ᱮᱢᱟᱹᱧ ᱢᱮ ᱾', roman: 'Daya kate inj nyu daag emanj me.', hi: 'कृपया मुझे पीने का पानी दीजिए।' }
    ]
  }
];

export const SpeechToSpeechPage: React.FC = () => {
  const [langA, setLangA] = useState('hin'); // Person A: Hindi default (Teacher/Officer)
  const [langB, setLangB] = useState('sat'); // Person B: Santali default (Student/Citizen)
  const [activeSpeaker, setActiveSpeaker] = useState<'speakerA' | 'speakerB' | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [guardrailNotice, setGuardrailNotice] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(0.9);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);

  // Editing state for human correction
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editOriginalText, setEditOriginalText] = useState('');
  const [editTranslatedText, setEditTranslatedText] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'speakerA',
      senderRole: 'Person A (Teacher)',
      sourceLang: 'hin',
      targetLang: 'sat',
      langName: 'Hindi',
      originalText: 'नमस्ते! आपका नाम क्या है?',
      translatedText: 'ᱡᱚᱦᱟᱨ! ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ?',
      pronunciation: 'Johar! Amag nyutum ched?',
      time: '10:02 AM',
      confidenceTier: 'verified',
      needsReview: false
    },
    {
      id: 'init-2',
      sender: 'speakerB',
      senderRole: 'Person B (Student)',
      sourceLang: 'sat',
      targetLang: 'hin',
      langName: 'Santali',
      originalText: 'ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱵᱟᱵᱩᱞᱟᱞ ᱠᱟᱱᱟ ᱾',
      translatedText: 'मेरा नाम बाबूलाल है।',
      pronunciation: 'Inyag nyutum Babulal kana.',
      time: '10:03 AM',
      confidenceTier: 'dataset',
      needsReview: false
    }
  ]);

  const controllerRef = useRef<S2STurnController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const langAObj = useMemo(() => 
    SUPPORTED_LANGUAGES.find(l => l.code === langA) || SUPPORTED_LANGUAGES[1], 
    [langA]
  );
  const langBObj = useMemo(() => 
    SUPPORTED_LANGUAGES.find(l => l.code === langB) || SUPPORTED_LANGUAGES[0], 
    [langB]
  );

  // Initialize S2S Turn Controller
  useEffect(() => {
    const controller = new S2STurnController({
      onInterimText: (interim, speaker) => {
        setActiveSpeaker(speaker);
        setLiveTranscript(interim);
      },
      onTurnComplete: (record: S2STurnRecord) => {
        const newMsg: ChatMessage = {
          id: record.metadata.turnId,
          sender: record.metadata.speakerId,
          senderRole: record.metadata.speakerRole,
          sourceLang: record.metadata.sourceLang,
          targetLang: record.metadata.targetLang,
          langName: record.metadata.sourceLangName,
          originalText: record.asr.transcript,
          translatedText: record.translation.targetText,
          pronunciation: record.translation.transliteration,
          time: record.metadata.timeFormatted,
          confidenceTier: record.reliability.finalTier,
          needsReview: record.reliability.needsReview
        };

        setMessages(prev => [...prev, newMsg]);
        // ✅ FIX: Reset activeSpeaker immediately when speech + translation are done
        // so the button turns blue right away — independent of TTS playback duration.
        setActiveSpeaker(null);
        setLiveTranscript('');
        setStatusMessage(null);
      },
      onStatusMessage: (msg) => {
        setStatusMessage(msg);
      },
      onGuardrailNotice: (notice) => {
        setGuardrailNotice(notice);
      },
      onSpeakingTurnIdChange: (msgId) => {
        setSpeakingMessageId(msgId);
      },
      onError: (err) => {
        console.warn('[S2S Controller notice]:', err.message);
        setStatusMessage(`Speech/Microphone notice: ${err.message}`);
        setActiveSpeaker(null);
        setLiveTranscript('');
      }
    });

    controller.setAutoSpeak(autoSpeak);
    controller.setVoiceSpeed(voiceSpeed);
    controllerRef.current = controller;

    return () => {
      controller.stopTurn();
      controllerRef.current = null;
    };
  }, []);

  // Update controller settings when autoSpeak / voiceSpeed changes
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setAutoSpeak(autoSpeak);
      controllerRef.current.setVoiceSpeed(voiceSpeed);
    }
  }, [autoSpeak, voiceSpeed]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript]);

  const handleSwapSpeakers = () => {
    controllerRef.current?.stopTurn();
    setActiveSpeaker(null);
    setLiveTranscript('');
    const tempA = langA;
    setLangA(langB);
    setLangB(tempA);
    setGuardrailNotice(null);
  };

  const handleStartListening = async (speaker: 'speakerA' | 'speakerB') => {
    setGuardrailNotice(null);
    setStatusMessage(null);

    const isA = speaker === 'speakerA';
    const sourceCode = isA ? langA : langB;
    const targetCode = isA ? langB : langA;
    const sourceLangName = isA ? langAObj.name : langBObj.name;
    const senderRole = isA ? 'Person A (Teacher/Officer)' : 'Person B (Student/Citizen)';

    setActiveSpeaker(speaker);
    setLiveTranscript('');

    if (controllerRef.current) {
      await controllerRef.current.startTurn(
        speaker,
        sourceCode,
        targetCode,
        sourceLangName,
        senderRole
      );
    }
  };

  const handleStopListening = () => {
    setActiveSpeaker(null);
    setLiveTranscript('');
    setStatusMessage(null);
    if (controllerRef.current) {
      controllerRef.current.stopListening();
    }
  };

  const handleOpenEdit = (msg: ChatMessage) => {
    setEditingMessage(msg);
    setEditOriginalText(msg.originalText);
    setEditTranslatedText(msg.translatedText);
  };

  const handleSaveCorrection = async () => {
    if (!editingMessage) return;

    // Save to human correction store & offline sync queue
    saveHumanCorrection({
      rawText: editingMessage.originalText,
      correctedText: editOriginalText,
      sourceLang: editingMessage.sourceLang,
      targetLang: editingMessage.targetLang,
      rawTranslation: editingMessage.translatedText,
      correctedTranslation: editTranslatedText,
      engine: 'Two-Way S2S Conversation',
      verificationLevel: 'USER_CORRECTED'
    });

    if (controllerRef.current) {
      controllerRef.current.saveCorrection(
        editingMessage.id,
        editOriginalText,
        editTranslatedText
      ).catch(() => {});
    }

    // Update message in state
    setMessages(prev => prev.map(m => {
      if (m.id === editingMessage.id) {
        return {
          ...m,
          originalText: editOriginalText,
          translatedText: editTranslatedText,
          confidenceTier: 'verified',
          needsReview: false
        };
      }
      return m;
    }));

    setEditingMessage(null);
  };

  const handleProcessPhrase = (phraseText: string) => {
    if (controllerRef.current) {
      controllerRef.current.processPhraseDirect(
        'speakerA',
        phraseText,
        langA,
        langB,
        langAObj.name,
        'Person A (Teacher/Officer)'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#14532d] text-xs font-bold mb-1">
              <Radio className="w-3.5 h-3.5 text-[#249144] animate-pulse" />
              <span>Two-Way Conversation Mode</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Classroom & Field Dialogue
            </h1>
            <p className="text-xs text-slate-500">
              Seamless turn-taking conversation between Person A and Person B with dual audio.
            </p>
          </div>

          {/* Speaker Controls Bar */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            {/* Person A Lang */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Person A</span>
              <select
                value={langA}
                onChange={e => { setLangA(e.target.value); setGuardrailNotice(null); }}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={`a-${l.id}`} value={l.code}>
                    {l.name} {l.isTribal ? (l.code === 'sat' ? '★' : '(Phase 2/3)') : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSwapSpeakers}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition cursor-pointer"
              title="Swap Speakers"
            >
              <ArrowLeftRight className="w-4 h-4 text-[#249144]" />
            </button>

            {/* Person B Lang */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Person B</span>
              <select
                value={langB}
                onChange={e => { setLangB(e.target.value); setGuardrailNotice(null); }}
                className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={`b-${l.id}`} value={l.code}>
                    {l.name} {l.isTribal ? (l.code === 'sat' ? '★' : '(Phase 2/3)') : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Responsible AI Guardrail Warning Banner */}
        {guardrailNotice && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 shadow-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Responsible AI Guardrail</p>
              <p className="mt-0.5">{guardrailNotice}</p>
            </div>
            <button
              onClick={() => setGuardrailNotice(null)}
              className="text-amber-500 hover:text-amber-800 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Status bar */}
        {statusMessage && (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-[#14532d] flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-[#249144]" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Main Conversation Thread Viewport */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-6 min-h-[380px] max-h-[500px] overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isSpeakerA = m.sender === 'speakerA';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isSpeakerA ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 border transition-all space-y-2.5 ${
                    isSpeakerA
                      ? 'bg-slate-50/90 border-slate-200 text-slate-900 rounded-tl-sm'
                      : 'bg-emerald-50/70 border-emerald-200/90 text-slate-900 rounded-tr-sm'
                  }`}
                >
                  {/* Sender header */}
                  <div className="flex items-center justify-between gap-3 text-[11px] border-b border-slate-200/60 pb-2">
                    <span className="font-bold flex items-center gap-1.5 text-slate-700">
                      {isSpeakerA ? <GraduationCap className="w-3.5 h-3.5 text-blue-600" /> : <User className="w-3.5 h-3.5 text-emerald-600" />}
                      {m.senderRole} • {m.langName}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{m.time}</span>
                  </div>

                  {/* Original Speech Text */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base sm:text-lg font-medium leading-relaxed font-sans text-slate-900">
                      {m.originalText}
                    </p>
                    <button
                      onClick={() => playTextSpeech(m.originalText, m.sourceLang)}
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-600 hover:text-[#249144] border border-slate-200 transition cursor-pointer flex-shrink-0"
                      title="Play original audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Translated Text Subtitle Card */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Translation
                      </span>
                      <button
                        onClick={() => playTextSpeech(m.translatedText, m.targetLang)}
                        className="p-1 rounded-md text-[#249144] hover:bg-emerald-50 transition cursor-pointer"
                        title="Play translated audio"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-[#14532d]">
                      {m.translatedText}
                    </p>
                    {m.pronunciation && (
                      <p className="text-xs text-slate-500 italic">
                        Pronunciation: {m.pronunciation}
                      </p>
                    )}
                  </div>

                  {/* Footer actions: Badges + Edit button */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {m.confidenceTier === 'verified' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#14532d] text-[10px] font-bold border border-emerald-300">
                          🟢 Verified
                        </span>
                      )}
                      {m.confidenceTier === 'dataset' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                          🟡 Dataset Match
                        </span>
                      )}
                      {m.confidenceTier === 'fallback' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                          🟠 Fallback
                        </span>
                      )}
                      {m.confidenceTier === 'needs_review' && (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-800 text-[10px] font-bold border border-red-200">
                          🔴 Needs Review
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                        title="Correct this transcription/translation"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}

          {/* Live transcript indicator */}
          {liveTranscript && (
            <div className={`flex flex-col ${activeSpeaker === 'speakerA' ? 'items-start' : 'items-end'}`}>
              <div className="max-w-[75%] p-4 rounded-3xl bg-emerald-50/60 border border-emerald-300 text-xs text-[#14532d] animate-pulse">
                <span className="font-bold block mb-1">Speaking now...</span>
                <p className="text-sm font-medium">{liveTranscript}</p>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Giant Speaker Microphone Triggers (Person A vs Person B) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Person A Mic */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Speaker 1</span>
              <p className="text-sm font-bold text-slate-900">{langAObj.name}</p>
              <p className="text-xs text-slate-500">Teacher / Officer</p>
            </div>

            {activeSpeaker === 'speakerA' ? (
              <button
                onClick={handleStopListening}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse transition cursor-pointer"
                title="Finish Speaking"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                onClick={() => handleStartListening('speakerA')}
                disabled={activeSpeaker !== null}
                className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 hover:scale-105 transition disabled:opacity-40 cursor-pointer"
                title={`Speak in ${langAObj.name}`}
              >
                <Mic className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Person B Mic */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Speaker 2</span>
              <p className="text-sm font-bold text-slate-900">{langBObj.name}</p>
              <p className="text-xs text-slate-500">Student / Citizen</p>
            </div>

            {activeSpeaker === 'speakerB' ? (
              <button
                onClick={handleStopListening}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse transition cursor-pointer"
                title="Finish Speaking"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                onClick={() => handleStartListening('speakerB')}
                disabled={activeSpeaker !== null}
                className="w-14 h-14 rounded-full bg-[#249144] hover:bg-[#1a7536] text-white flex items-center justify-center shadow-lg shadow-green-600/30 hover:scale-105 transition disabled:opacity-40 cursor-pointer"
                title={`Speak in ${langBObj.name}`}
              >
                <Mic className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Curated Classroom & Field Phrase Cards */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#249144]" /> One-Tap Verified Phrases
            </span>
            <div className="flex gap-1">
              {GENERAL_DATASET_PHRASES.map((c, idx) => (
                <button
                  key={c.category}
                  onClick={() => setActiveCategory(idx)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                    activeCategory === idx
                      ? 'bg-emerald-100 text-[#14532d] font-bold'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {c.category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {GENERAL_DATASET_PHRASES[activeCategory].phrases.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleProcessPhrase(p.hi || p.en)}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-300 text-left transition text-xs flex items-center justify-between group cursor-pointer"
              >
                <div className="truncate pr-2">
                  <p className="font-bold text-slate-800 group-hover:text-[#14532d]">{p.hi || p.en}</p>
                  <p className="text-[11px] text-slate-500 truncate">{p.sat} ({p.roman})</p>
                </div>
                <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#249144] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Human-in-the-Loop Correction Modal */}
      {editingMessage && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#249144]" />
                <h3 className="font-bold text-slate-900 text-sm">Human Correction (Safe Feedback Loop)</h3>
              </div>
              <button onClick={() => setEditingMessage(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Your edits are stored locally as verified ground-truth data for future model enhancement.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Original Speech ({editingMessage.langName})
                </label>
                <input
                  type="text"
                  value={editOriginalText}
                  onChange={e => setEditOriginalText(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:border-[#249144] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Corrected Translation
                </label>
                <input
                  type="text"
                  value={editTranslatedText}
                  onChange={e => setEditTranslatedText(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:border-[#249144] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingMessage(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCorrection}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#249144] hover:bg-[#1a7536] text-white flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" /> Save Correction
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
