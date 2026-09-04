import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Mic, 
  Volume2, 
  Sparkles, 
  ArrowLeftRight, 
  RotateCcw,
  Send,
  Download,
  Trash2,
  CheckCircle2,
  VolumeX,
  Play,
  Languages,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { translateText, playTextSpeech } from '../../services/translationService';
import { SANTALI_DATASET } from '../../data/santaliDataset';

interface ChatMessage {
  id: string;
  sender: 'speakerA' | 'speakerB';
  langName: string;
  originalText: string;
  translatedText: string;
  pronunciation?: string;
  time: string;
}

interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

// Curated authentic general sentences from dataset/google sheets
const GENERAL_DATASET_PHRASES = [
  {
    category: 'Greetings & Introductions',
    phrases: [
      { en: 'What is your name?', sat: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ?', roman: 'Amag nyutum ched?', hi: 'आपका नाम क्या है?' },
      { en: 'How are you?', sat: 'ᱟᱢ ᱫᱚ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱜ-ᱟ?', roman: 'Am do ched leka menag-a?', hi: 'आप कैसे हैं?' },
      { en: 'I am doing well.', sat: 'ᱤᱧ ᱫᱚ ᱵᱮᱥ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ᱾', roman: 'Inj do bes ge menanya.', hi: 'मैं ठीक हूँ।' },
      { en: 'Greetings / Welcome', sat: 'ᱡᱚᱦᱟᱨ', roman: 'Johar', hi: 'नमस्ते / जोहार' },
      { en: 'Welcome to our village.', sat: 'ᱟᱞᱮᱭᱟᱜ ᱟᱹᱛᱩ ᱨᱮ ᱟᱯᱮᱭᱟᱜ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾', roman: 'Aleyag aatu re apeyag sagun daram.', hi: 'हमारे गांव में आपका स्वागत है।' },
      { en: 'Where have you come from?', sat: 'ᱟᱢ ᱫᱚ ᱚᱠᱟ ᱠᱷᱚᱱ ᱦᱮᱡ ᱠᱟᱱᱟ?', roman: 'Am do oka khon hej kana?', hi: 'आप कहाँ से आए हैं?' }
    ]
  },
  {
    category: 'Health & Hospital',
    phrases: [
      { en: 'Where is the hospital?', sat: 'ᱦᱟᱥᱯᱟᱛᱟᱞ ᱫᱚ ᱚᱠᱟᱨᱮ ᱢᱮᱱᱟᱜ-ᱟ?', roman: 'Haspatal do okare menag-a?', hi: 'अस्पताल कहाँ है?' },
      { en: 'Is your health good?', sat: 'ᱦᱚᱲᱢᱚ ᱵᱮᱥ ᱢᱮᱱᱟᱜ-ᱟ?', roman: 'Hormo bes menag-a?', hi: 'क्या आपका स्वास्थ्य ठीक है?' },
      { en: 'Sickle cell screening test was completed.', sat: 'ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱦᱩᱭ ᱮᱱᱟ᱾', roman: 'Sikil sel bidaw hoyena.', hi: 'सिकल सेल जांच पूरी हो गई।' },
      { en: 'It is time to take medicine.', sat: 'ᱨᱟᱱ ᱡᱚᱢ ᱨᱮᱭᱟᱜ ᱚᱠᱛᱚ ᱦᱩᱭ ᱮᱱᱟ᱾', roman: 'Ran jom reyag okto hoyena.', hi: 'दवा लेने का समय हो गया है।' },
      { en: 'Drink clean water and stay healthy.', sat: 'ᱥᱟᱯᱷᱟ ᱫᱟᱜ ᱧᱩ ᱢᱮ ᱟᱨ ᱦᱚᱲᱢᱚ ᱵᱮᱥ ᱫᱚᱦᱚᱭ ᱢᱮ᱾', roman: 'Sapha daag nyu me ar hormo bes dohoy me.', hi: 'साफ पानी पियो और स्वस्थ रहो।' }
    ]
  },
  {
    category: 'Daily Life & Agriculture',
    phrases: [
      { en: 'This is a cow.', sat: 'ᱱᱩᱭ ᱫᱚ ᱜᱟᱹᱭ ᱠᱟᱱᱟᱭ ᱾', roman: 'Nui do gai kanay.', hi: 'यह गाय है।' },
      { en: 'This is a bull.', sat: 'ᱱᱩᱭ ᱫᱚ ᱰᱟᱝᱜᱽᱨᱟ ᱠᱟᱱᱟᱭ ᱾', roman: 'Nui do dangra kanay.', hi: 'यह बैल है।' },
      { en: 'Sowing of seeds was done.', sat: 'ᱤᱛᱟᱹ ᱮᱨ ᱦᱩᱭ ᱮᱱᱟ ᱾', roman: 'Ita er hoeyena.', hi: 'बीज बोने का काम हो गया।' },
      { en: 'What is your village name?', sat: 'ᱟᱢᱟᱜ ᱟᱹᱛᱩ ᱨᱮᱱᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ?', roman: 'Amag aatu renag nyutum ched?', hi: 'आपके गांव का नाम क्या है?' },
      { en: 'Our country is India.', sat: 'ᱟᱵᱚᱣᱟᱜ ᱫᱤᱥᱚᱢ ᱫᱚ ᱵᱷᱟᱨᱚᱛ ᱠᱟᱱᱟ ᱾', roman: 'Abowag disom do bharat kana.', hi: 'हमारा देश भारत है।' },
      { en: 'I am reading Ol Chiki.', sat: 'ᱤᱧ ᱫᱚ ᱚᱞ ᱪᱤᱠᱤ ᱯᱟᱲᱦᱟᱣ ᱠᱟᱱᱟᱧ ᱾', roman: 'Inj do Ol Chiki parhao kananj.', hi: 'मैं ओल चिकी पढ़ रहा हूँ।' }
    ]
  }
];

export const SpeechToSpeechPage: React.FC = () => {
  const [langA, setLangA] = useState('eng'); // Speaker A (English default)
  const [langB, setLangB] = useState('sat'); // Speaker B (Santali default)
  const [activeSpeaker, setActiveSpeaker] = useState<'speakerA' | 'speakerB' | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(0.9);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'speakerA',
      langName: 'English',
      originalText: 'Hello! What is your name?',
      translatedText: 'ᱡᱚᱦᱟᱨ! ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱪᱮᱫ? (Johar! Amag nyutum ched?)',
      pronunciation: 'Johar! Amag nyutum ched?',
      time: '10:02 AM'
    },
    {
      id: '2',
      sender: 'speakerB',
      langName: 'Santali',
      originalText: 'ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱵᱟᱵᱩᱞᱟᱞ ᱠᱟᱱᱟ᱾',
      translatedText: 'My name is Babulal.',
      pronunciation: 'Inj do Babulal kana.',
      time: '10:03 AM'
    }
  ]);

  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const isListeningRef = useRef<boolean>(false);
  const spokenTextRef = useRef<string>('');
  const timeoutRef = useRef<any>(null);

  const langAObj = SUPPORTED_LANGUAGES.find(l => l.code === langA) || SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.length - 1];
  const langBObj = SUPPORTED_LANGUAGES.find(l => l.code === langB) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript]);

  // Clean up timers and speech recognition on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  const getRecognitionLang = (code: string) => {
    switch (code) {
      case 'eng': return 'en-IN';
      case 'hin': return 'hi-IN';
      case 'sat': return 'hi-IN';
      case 'unr': return 'hi-IN';
      case 'hoc': return 'hi-IN';
      default: return 'en-IN';
    }
  };

  const handleSwapSpeakers = () => {
    const tempA = langA;
    setLangA(langB);
    setLangB(tempA);
  };

  const processAndAddMessage = async (
    speaker: 'speakerA' | 'speakerB',
    spokenText: string
  ) => {
    if (!spokenText.trim()) {
      setActiveSpeaker(null);
      setLiveTranscript('');
      return;
    }

    const isA = speaker === 'speakerA';
    const sourceCode = isA ? langA : langB;
    const targetCode = isA ? langB : langA;
    const sourceLangName = isA ? langAObj.name : langBObj.name;

    setStatusMessage('Translating and generating voice...');
    const trans = await translateText(spokenText, sourceCode, targetCode);

    const msgId = Date.now().toString();
    const newMsg: ChatMessage = {
      id: msgId,
      sender: speaker,
      langName: sourceLangName,
      originalText: spokenText,
      translatedText: trans.targetText,
      pronunciation: trans.transliteration,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setActiveSpeaker(null);
    setLiveTranscript('');
    setStatusMessage(null);

    // Automatically speak the translated text
    if (autoSpeak) {
      setSpeakingMessageId(msgId);
      playTextSpeech(trans.targetText, targetCode, voiceSpeed, () => setSpeakingMessageId(null));
    }
  };

  const handleStartListening = async (speaker: 'speakerA' | 'speakerB') => {
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    const isA = speaker === 'speakerA';
    const sourceCode = isA ? langA : langB;
    const sourceLangName = isA ? langAObj.name : langBObj.name;

    setActiveSpeaker(speaker);
    setLiveTranscript('');
    setStatusMessage(`Listening to ${sourceLangName}... Speak now (Tap mic again to Finish).`);
    isListeningRef.current = true;
    spokenTextRef.current = '';

    if (!SpeechRecognitionClass) {
      const fallbackPrompt = isA 
        ? prompt(`Type your message in ${sourceLangName}:`, 'What is your name?')
        : prompt(`Type your message in ${sourceLangName}:`, 'ᱡᱚᱦᱟᱨ (Johar)');

      if (fallbackPrompt) {
        processAndAddMessage(speaker, fallbackPrompt);
      } else {
        setActiveSpeaker(null);
        setStatusMessage(null);
        isListeningRef.current = false;
      }
      return;
    }

    // Explicitly request mic permission so browser does not block speech recognition
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr) {
      console.warn('Microphone permission not granted:', permErr);
      setStatusMessage('Microphone blocked. Please click the mic icon in your address bar to allow.');
      setActiveSpeaker(null);
      isListeningRef.current = false;
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = getRecognitionLang(sourceCode);
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += trans;
          } else {
            interim += trans;
          }
        }
        const accumulated = (spokenTextRef.current + ' ' + finalChunk).trim();
        if (finalChunk) {
          spokenTextRef.current = accumulated;
        }
        setLiveTranscript(accumulated || interim || spokenTextRef.current);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event note:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setStatusMessage('Microphone permission blocked. Please allow mic in browser settings.');
          setActiveSpeaker(null);
          isListeningRef.current = false;
        } else if (event.error === 'network') {
          setStatusMessage('Browser speech network timeout. Use quick phrases or type below.');
          setActiveSpeaker(null);
          isListeningRef.current = false;
        } else if (event.error === 'no-speech') {
          // Do not cancel on no-speech when continuous is enabled; user is still thinking
          setStatusMessage(`Listening to ${sourceLangName}... Speak now.`);
        }
      };

      recognition.onend = () => {
        // If still in listening state (e.g. Chrome silent pause), automatically restart
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch {
            const textToProcess = spokenTextRef.current.trim();
            if (textToProcess) {
              processAndAddMessage(speaker, textToProcess);
            } else {
              setActiveSpeaker(null);
              setStatusMessage(null);
            }
            isListeningRef.current = false;
          }
        } else {
          // User finished speaking / tapped to stop
          const textToProcess = spokenTextRef.current.trim();
          if (textToProcess) {
            processAndAddMessage(speaker, textToProcess);
          } else {
            setActiveSpeaker(null);
            setStatusMessage(null);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      // Auto-stop safety timeout after 25 seconds of continuous listening
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (isListeningRef.current) {
          handleStopListening();
        }
      }, 25000);

    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setActiveSpeaker(null);
      isListeningRef.current = false;
      setStatusMessage('Microphone access issue. You can click any quick sentence below.');
    }
  };

  const handleStopListening = () => {
    isListeningRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
  };

  const handleSendManual = (speaker: 'speakerA' | 'speakerB') => {
    if (!manualInput.trim()) return;
    const textToSend = manualInput.trim();
    setManualInput('');
    processAndAddMessage(speaker, textToSend);
  };

  const handleSpeakItem = (msgId: string, text: string, langCode: string) => {
    setSpeakingMessageId(msgId);
    playTextSpeech(text, langCode, voiceSpeed, () => setSpeakingMessageId(null));
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleExportChat = () => {
    const transcript = messages
      .map(m => `[${m.time}] ${m.langName}: ${m.originalText}\n -> Translated: ${m.translatedText}\n`)
      .join('\n');

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-dialogue-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="w-full py-4 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/70 border border-emerald-200 text-xs font-bold text-[#14532d] mb-3 shadow-2xs">
            <Radio className="w-3.5 h-3.5 text-[#249144] animate-pulse" />
            <span>Real-Time Neural Speech-to-Speech & Dialogue</span>
          </div>

          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-900">
            Voice to Voice Translation
          </h1>

          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#249144] rounded-full"></div>
          </div>

          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-500">
            Two-way spoken conversation engine powered by verified Santali (Ol Chiki), Mundari, Ho, Hindi & English dataset.
          </p>
        </div>

        {/* Main Conversation Studio Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col">
          
          {/* Top Bar: Language Selectors & Audio Controls */}
          <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            
            {/* Left: Speaker A */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Speaker A:</span>
              <select
                value={langA}
                onChange={(e) => setLangA(e.target.value)}
                aria-label="Select Speaker A language"
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none hover:border-[#249144] shadow-xs cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.id} value={l.code}>{l.name} ({l.nativeName})</option>
                ))}
              </select>
            </div>

            {/* Middle: Swap Button */}
            <button
              onClick={handleSwapSpeakers}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-[#249144] transition shadow-xs cursor-pointer active:scale-95"
              title="Swap Speaker Languages"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            {/* Right: Speaker B */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Speaker B:</span>
              <select
                value={langB}
                onChange={(e) => setLangB(e.target.value)}
                aria-label="Select Speaker B language"
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none hover:border-[#249144] shadow-xs cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.id} value={l.code}>{l.name} ({l.nativeName})</option>
                ))}
              </select>
            </div>

            {/* Toolbar: Auto-Speak, Speed & Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  autoSpeak 
                    ? 'bg-emerald-50 border-emerald-300 text-[#14532d]' 
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
                title="Toggle Automatic Speech Synthesis"
              >
                {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-[#249144]" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Auto-Speak: {autoSpeak ? 'ON' : 'OFF'}</span>
              </button>

              <select
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none shadow-xs cursor-pointer"
                title="Voice Speed"
              >
                <option value={0.8}>0.8x Slow</option>
                <option value={0.9}>0.9x Natural</option>
                <option value={1.0}>1.0x Normal</option>
                <option value={1.15}>1.2x Fast</option>
              </select>

              <button
                onClick={handleExportChat}
                disabled={messages.length === 0}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition disabled:opacity-40"
                title="Export Transcript"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handleClearChat}
                disabled={messages.length === 0}
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                title="Clear Dialogue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Live Mic Wave Status Notification */}
          {activeSpeaker && (
            <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    {statusMessage || 'Listening to your microphone...'}
                  </p>
                  {liveTranscript && (
                    <p className="text-xs text-slate-700 font-medium italic mt-0.5">
                      "{liveTranscript}"
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleStopListening}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Stop & Translate
              </button>
            </div>
          )}

          {/* Conversation Chat Stream */}
          <div className="p-6 sm:p-8 min-h-[360px] max-h-[480px] overflow-y-auto space-y-4 bg-slate-50/40">
            {messages.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-300 stroke-1" />
                <p className="text-sm font-medium">No conversation messages yet.</p>
                <p className="text-xs max-w-sm text-slate-500">
                  Click a microphone button below, type a phrase, or tap any Google Sheet quick sentence!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isA = msg.sender === 'speakerA';
                const isSpeaking = speakingMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isA ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}
                  >
                    <div
                      className={`max-w-md sm:max-w-lg rounded-2xl p-4 shadow-xs space-y-2.5 transition-all ${
                        isA 
                          ? 'bg-white border border-slate-200 text-slate-800' 
                          : 'bg-gradient-to-br from-[#249144] to-[#14532d] text-white shadow-md'
                      } ${isSpeaking ? 'ring-2 ring-emerald-400 scale-[1.01]' : ''}`}
                    >
                      {/* Sender Tag */}
                      <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 font-mono">
                        <span className="font-bold">
                          {isA ? `Speaker A (${msg.langName})` : `Speaker B (${msg.langName})`}
                        </span>
                        <span>{msg.time}</span>
                      </div>

                      {/* Original Input Text */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-relaxed">
                          {msg.originalText}
                        </p>
                        <button
                          onClick={() => handleSpeakItem(`orig-${msg.id}`, msg.originalText, isA ? langA : langB)}
                          className={`p-1 rounded-md transition flex-shrink-0 cursor-pointer ${
                            isA ? 'text-slate-400 hover:text-[#249144] hover:bg-slate-100' : 'text-emerald-200 hover:text-white hover:bg-white/20'
                          }`}
                          title="Speak Original Text"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Translated Text & Pronunciation */}
                      <div className={`border-t pt-2.5 space-y-1.5 ${isA ? 'border-slate-100 bg-emerald-50/50 -mx-4 -mb-4 p-3.5 rounded-b-2xl' : 'border-white/20 bg-black/10 -mx-4 -mb-4 p-3.5 rounded-b-2xl'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isA ? 'text-[#14532d]' : 'text-emerald-200'}`}>
                            Spoken Translation:
                          </span>

                          {/* Interactive Audio Play Button */}
                          <button
                            onClick={() => handleSpeakItem(msg.id, msg.translatedText, isA ? langB : langA)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 ${
                              isA 
                                ? 'bg-[#249144] hover:bg-[#1b7536] text-white' 
                                : 'bg-white hover:bg-emerald-50 text-[#14532d]'
                            }`}
                            title="Listen to Spoken Voice"
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce' : ''}`} />
                            <span>{isSpeaking ? 'Speaking...' : 'Play Voice'}</span>
                          </button>
                        </div>

                        <p className={`text-sm sm:text-base font-bold leading-snug ${isA ? 'text-slate-900' : 'text-white'}`}>
                          {msg.translatedText}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Dataset General Sentences from Google Sheet (Interactive Pills) */}
          <div className="px-6 py-3 bg-slate-100/80 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#249144]" />
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  1-Click Dataset Spoken Sentences (From Official Google Sheet):
                </span>
              </div>
              
              {/* Category Tabs */}
              <div className="flex items-center gap-1">
                {GENERAL_DATASET_PHRASES.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveCategory(idx)}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      activeCategory === idx 
                        ? 'bg-[#249144] text-white shadow-xs' 
                        : 'bg-white text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sentence Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {GENERAL_DATASET_PHRASES[activeCategory].phrases.map((phrase, pIdx) => (
                <div key={pIdx} className="inline-flex items-center bg-white border border-slate-200 hover:border-emerald-300 rounded-xl overflow-hidden shadow-2xs group transition">
                  <button
                    onClick={() => processAndAddMessage('speakerA', phrase.en)}
                    className="px-3 py-1.5 text-xs text-slate-800 font-semibold hover:bg-emerald-50 transition text-left cursor-pointer flex items-center gap-1.5"
                    title={`Send: "${phrase.en}" as Speaker A`}
                  >
                    <span>{phrase.en}</span>
                    <span className="text-[10px] text-emerald-700 font-bold font-mono">({phrase.roman})</span>
                  </button>

                  <button
                    onClick={() => {
                      playTextSpeech(phrase.sat, 'sat', voiceSpeed);
                    }}
                    className="px-2 py-1.5 bg-slate-50 hover:bg-[#249144] hover:text-white text-slate-500 transition border-l border-slate-200 cursor-pointer"
                    title="Directly Listen to Voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Type to Speak & Translate Bar */}
          <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendManual('speakerA');
              }}
              placeholder={`Type any phrase to translate between ${langAObj.name} and ${langBObj.name}...`}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#249144]/30 focus:border-[#249144] transition"
            />
            <button
              onClick={() => handleSendManual('speakerA')}
              disabled={!manualInput.trim()}
              className="px-4 py-2.5 bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold rounded-xl disabled:opacity-40 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Send and translate from Speaker A"
            >
              <span>Send ({langAObj.badge})</span>
              <Send className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSendManual('speakerB')}
              disabled={!manualInput.trim()}
              className="px-4 py-2.5 bg-[#14532d] hover:bg-emerald-950 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Send and translate from Speaker B"
            >
              <span>Send ({langBObj.badge})</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dual Push-to-Talk Mic Controls Footer */}
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Speaker A Push to Talk */}
            <button
              onClick={() => {
                if (activeSpeaker === 'speakerA') {
                  handleStopListening();
                } else {
                  handleStartListening('speakerA');
                }
              }}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                activeSpeaker === 'speakerA' 
                  ? 'bg-red-50 border-red-500 shadow-md ring-2 ring-red-400' 
                  : 'bg-white border-slate-200 hover:border-[#249144] hover:bg-green-50/50 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition shadow-xs ${
                  activeSpeaker === 'speakerA' 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-emerald-50 text-[#249144] group-hover:bg-[#249144] group-hover:text-white'
                }`}>
                  <Mic className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Speaker A ({langAObj.name})
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {activeSpeaker === 'speakerA' ? 'Listening... (Tap to Finish)' : `Hold / Tap to Speak in ${langAObj.name}`}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                Mic A
              </span>
            </button>

            {/* Speaker B Push to Talk */}
            <button
              onClick={() => {
                if (activeSpeaker === 'speakerB') {
                  handleStopListening();
                } else {
                  handleStartListening('speakerB');
                }
              }}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                activeSpeaker === 'speakerB' 
                  ? 'bg-red-50 border-red-500 shadow-md ring-2 ring-red-400' 
                  : 'bg-white border-slate-200 hover:border-[#249144] hover:bg-green-50/50 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition shadow-xs ${
                  activeSpeaker === 'speakerB' 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-emerald-50 text-[#249144] group-hover:bg-[#249144] group-hover:text-white'
                }`}>
                  <Mic className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Speaker B ({langBObj.name})
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {activeSpeaker === 'speakerB' ? 'Listening... (Tap to Finish)' : `Hold / Tap to Speak in ${langBObj.name}`}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                Mic B
              </span>
            </button>

          </div>

        </div>

      </div>
    </section>
  );
};
