import React, { useState, useRef } from 'react';
import { 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Volume2, 
  Download, 
  RotateCcw, 
  Sparkles, 
  Keyboard, 
  History, 
  Share2,
  ThumbsUp,
  ThumbsDown,
  Info,
  Mic,
  MicOff,
  Radio
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, TribalLanguage } from '../../data/languages';
import { translateText, playTextSpeech } from '../../services/translationService';
import { ClassroomDatabaseExplorer } from '../../components/common/ClassroomDatabaseExplorer';

export const TextToTextPage: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('eng');
  const [targetLang, setTargetLang] = useState('sat'); // Default Santali
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  
  // Translation history state
  const [history, setHistory] = useState<{ source: string; target: string; from: string; to: string; time: string }[]>([
    { source: 'Welcome to our village', target: 'ᱟᱞᱮᱭᱟᱜ ᱟᱹᱛᱩ ᱨᱮ ᱟᱯᱮᱭᱟᱜ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾', from: 'English', to: 'Santali', time: 'Just now' },
    { source: 'How is your health?', target: 'ᱦᱚᱲᱢᱚ ᱵᱮᱥ ᱢᱮᱱᱟᱜ-ᱟ?', from: 'English', to: 'Santali', time: '5m ago' }
  ]);

  const sourceLangObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang) || SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.length - 1];
  const targetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  const handleTranslate = async (overrideText?: string) => {
    const textToUse = (typeof overrideText === 'string' ? overrideText : inputText).trim();
    if (!textToUse) return;
    setIsTranslating(true);
    const result = await translateText(textToUse, sourceLang, targetLang);
    setOutputText(result.targetText);
    setTransliteration(result.transliteration || '');
    setIsTranslating(false);

    // Append to history
    setHistory(prev => [
      {
        source: textToUse,
        target: result.targetText,
        from: sourceLangObj.name,
        to: targetLangObj.name,
        time: 'Just now'
      },
      ...prev.slice(0, 9)
    ]);
  };

  const handleToggleMic = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      setSpeechStatus(null);
      return;
    }

    const win = window as unknown as { webkitSpeechRecognition?: any; SpeechRecognition?: any };
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert('Microphone speech recognition is not supported in this browser. Please try using Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = sourceLang === 'eng' ? 'en-IN' : (sourceLang === 'hin' || sourceLang === 'sat' || sourceLang === 'bhi' || sourceLang === 'gon' ? 'hi-IN' : 'en-IN');
      recognition.continuous = false;
      recognition.interimResults = true;

      setIsListening(true);
      setSpeechStatus(`Listening in ${sourceLangObj.name}... Speak into your mic.`);

      let spokenAccum = '';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            spokenAccum += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const current = (spokenAccum || interim).trim();
        if (current) {
          setInputText(current);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error in TextToText:', event.error);
        setIsListening(false);
        setSpeechStatus(null);
      };

      recognition.onend = async () => {
        setIsListening(false);
        setSpeechStatus(null);
        if (spokenAccum.trim()) {
          handleTranslate(spokenAccum.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start recognition:', err);
      setIsListening(false);
      setSpeechStatus(null);
    }
  };

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([`Source (${sourceLangObj.name}):\n${inputText}\n\nTranslation (${targetLangObj.name}):\n${outputText}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `BhashaSetu_Translation_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleInsertKey = (key: string) => {
    setInputText(prev => prev + key);
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Title */}
        <div className="w-full py-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#249144]" /> Neural Translation Studio
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Multilingual Translator
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-500">
            Translate text and conversations between 13+ tribal and national languages instantly with our AI model.
          </p>
        </div>

        {/* Translation Studio Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden mt-4">
          
          {/* Studio Language Header Bar */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_56px_1fr] border-b border-slate-100 bg-slate-50/50 items-center">
            
            {/* Source Lang Picker */}
            <div className="p-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">From:</span>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  aria-label="Select source language"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none hover:border-[#249144] transition shadow-sm cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.code}>
                      {lang.name} {lang.nativeName ? `(${lang.nativeName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {sourceLangObj.virtualKeys && (
                <button
                  onClick={() => setShowKeyboard(!showKeyboard)}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${showKeyboard ? 'bg-[#249144] text-white border-[#249144]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#249144]'}`}
                  title="Toggle on-screen script keyboard"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Script Keys</span>
                </button>
              )}
            </div>

            {/* Middle Swap Button */}
            <div className="flex justify-center py-2 md:py-0 border-y md:border-y-0 md:border-x border-slate-200/60 bg-white">
              <button
                onClick={handleSwap}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-green-50 hover:text-[#249144] active:scale-95 transition-all flex items-center justify-center text-slate-600 shadow-sm"
                title="Swap source and target languages"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Target Lang Picker */}
            <div className="p-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">To:</span>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  aria-label="Select target language"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none hover:border-[#249144] transition shadow-sm cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.code}>
                      {lang.name} {lang.nativeName ? `(${lang.nativeName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${showHistory ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                  title="View recent translations"
                >
                  <History className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">History</span>
                </button>
              </div>
            </div>

          </div>

          {/* Virtual Keyboard Drawer (if enabled) */}
          {showKeyboard && sourceLangObj.virtualKeys && (
            <div className="bg-slate-100/90 border-b border-slate-200 p-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">
                  {sourceLangObj.name} Script ({sourceLangObj.script})
                </span>
                <button onClick={() => setShowKeyboard(false)} className="text-xs text-slate-400 hover:text-slate-600">
                  Close
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sourceLangObj.virtualKeys.map((key, i) => (
                  <button
                    key={i}
                    onClick={() => handleInsertKey(key)}
                    className="min-w-[32px] h-9 px-2 bg-white hover:bg-green-50 border border-slate-200 hover:border-[#249144] rounded-lg text-sm font-bold text-slate-800 shadow-sm active:scale-95 transition"
                  >
                    {key}
                  </button>
                ))}
                <button
                  onClick={() => handleInsertKey(' ')}
                  className="px-4 h-9 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Space
                </button>
              </div>
            </div>
          )}

          {/* Text Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            
            {/* Input Box */}
            <div className="flex flex-col p-6 min-h-[280px] sm:min-h-[340px] justify-between relative">
              
              {speechStatus && (
                <div className="absolute top-2 left-6 right-6 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 animate-pulse z-10">
                  <Radio className="w-3.5 h-3.5 text-red-500 animate-spin" />
                  <span>{speechStatus}</span>
                </div>
              )}

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Write, paste, or click the mic to speak in ${sourceLangObj.name}...`}
                className={`w-full flex-1 resize-none bg-transparent outline-none text-base sm:text-lg leading-relaxed text-slate-800 placeholder-slate-300 font-normal ${speechStatus ? 'pt-8' : ''}`}
                maxLength={500}
              />

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 tabular-nums">
                    {inputText.length} <span className="text-slate-300">/ 500</span>
                  </span>
                  
                  {/* Microphone Voice Button */}
                  <button
                    onClick={handleToggleMic}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${isListening ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-white text-slate-700 border-slate-200 hover:border-[#249144] hover:text-[#249144]'}`}
                    title={isListening ? 'Stop Listening' : 'Speak into Microphone'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#249144]" />}
                    <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Mic'}</span>
                  </button>

                  {inputText && (
                    <button
                      onClick={() => setInputText('')}
                      className="text-xs text-slate-400 hover:text-red-500 transition px-1"
                    >
                      Clear
                    </button>
                  )}
                  {inputText && (
                    <button
                      onClick={() => playTextSpeech(inputText, sourceLang)}
                      className="p-2 rounded-xl text-slate-400 hover:text-[#249144] hover:bg-green-50 transition"
                      title="Listen to input"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleTranslate()}
                  disabled={isTranslating || !inputText.trim()}
                  className="btn-mota px-6 py-2.5 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                </button>
              </div>
            </div>

            {/* Output Box */}
            <div className="flex flex-col p-6 min-h-[280px] sm:min-h-[340px] bg-slate-50/40 justify-between">
              <div>
                {isTranslating ? (
                  <div className="flex items-center gap-2 text-sm text-[#249144] animate-pulse pt-2">
                    <Sparkles className="w-4 h-4 animate-spin" /> Neural translation in progress...
                  </div>
                ) : outputText ? (
                  <div className="space-y-3">
                    <p className="text-base sm:text-lg leading-relaxed text-slate-900 font-medium whitespace-pre-wrap select-text">
                      {outputText}
                    </p>
                    {transliteration && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-green-50/90 border border-green-200 text-xs font-mono font-semibold text-[#14532d] shadow-2xs">
                        <span className="text-[10px] uppercase font-sans text-slate-400 font-bold">Pronunciation:</span>
                        <span>/{transliteration}/</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-base text-slate-300 italic pt-2 font-light">
                    Translation in {targetLangObj.name} will appear here...
                  </p>
                )}
              </div>

              {/* Output Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 mt-6">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!outputText}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-[#249144] hover:text-[#249144] disabled:opacity-30 transition flex items-center gap-1.5 shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => playTextSpeech(outputText, targetLang)}
                    disabled={!outputText}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-[#249144] hover:text-[#249144] disabled:opacity-30 transition shadow-sm"
                    title="Play Audio Speech"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleDownload}
                    disabled={!outputText}
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-[#249144] hover:text-[#249144] disabled:opacity-30 transition shadow-sm"
                    title="Download translation text"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Rating Feedback */}
                {outputText && (
                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => setFeedbackGiven('up')}
                      className={`p-1.5 rounded-lg hover:text-green-600 ${feedbackGiven === 'up' ? 'text-green-600 bg-green-50' : ''}`}
                      title="Good translation"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setFeedbackGiven('down')}
                      className={`p-1.5 rounded-lg hover:text-red-500 ${feedbackGiven === 'down' ? 'text-red-500 bg-red-50' : ''}`}
                      title="Suggest improvement"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* History Drawer Modal */}
        {showHistory && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-[#249144]" /> Recent Translation History
              </h3>
              <button onClick={() => setHistory([])} className="text-xs text-red-500 hover:underline">
                Clear All
              </button>
            </div>
            <div className="grid gap-3">
              {history.map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{h.from} → {h.to}</span>
                    <p className="text-xs font-semibold text-slate-800">{h.source}</p>
                    <p className="text-xs text-emerald-800 font-medium">{h.target}</p>
                  </div>
                  <button
                    onClick={() => {
                      setInputText(h.source);
                      setOutputText(h.target);
                    }}
                    className="text-xs text-[#249144] font-semibold hover:underline"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local SQLite Database Explorer for Multilingual Classroom Dataset */}
        <div className="mt-8">
          <ClassroomDatabaseExplorer
            onSelectSentence={(eng, sat) => {
              setSourceLang('eng');
              setTargetLang('sat');
              setInputText(eng);
              setOutputText(sat);
              window.scrollTo({ top: 120, behavior: 'smooth' });
            }}
          />
        </div>

        {/* Pre-loaded Sample Phrases */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
            Quick Phrases ({sourceLangObj.name}):
          </h3>
          <div className="flex flex-wrap gap-2">
            {sourceLangObj.samplePhrases?.map((phrase, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputText(phrase.text);
                  handleTranslate();
                }}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 hover:border-[#249144] hover:bg-green-50/50 transition-all text-xs text-slate-700 font-medium shadow-sm text-left"
              >
                <span className="font-bold block text-slate-900">{phrase.text}</span>
                <span className="text-[10px] text-slate-400">{phrase.translation}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Beta Disclaimer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl py-2.5 px-4 inline-flex items-center gap-2 font-medium shadow-sm max-w-2xl text-left sm:text-center">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Beta Trial Notice:</strong> Powered by MoTA & Consortium AI models. Continuous linguistic evaluation is conducted with community linguists.
            </span>
          </p>
        </div>

      </div>
    </section>
  );
};
