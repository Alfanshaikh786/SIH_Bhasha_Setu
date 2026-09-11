import React, { useState, useRef, useEffect } from 'react';
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
  Radio,
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
  HelpCircle,
  FileCheck,
  ExternalLink,
  X,
  Trash2,
  Zap,
  BarChart3,
  Activity,
  UserCheck
} from 'lucide-react';
import { 
  translateText, 
  playTextSpeech, 
  TranslationResult, 
  transliterateSantaliToScript,
  SpeechPlaybackInfo
} from '../../services/translationService';

// Lazy load secondary modals & heavy explorer to keep Text-to-Text critical path lean
const ClassroomDatabaseExplorer = React.lazy(() => import('../../components/common/ClassroomDatabaseExplorer').then(m => ({ default: m.ClassroomDatabaseExplorer })));
const OfflineChallengeModal = React.lazy(() => import('../../components/common/OfflineChallengeModal').then(m => ({ default: m.OfflineChallengeModal })));
const DemoModeModal = React.lazy(() => import('../../components/common/DemoModeModal').then(m => ({ default: m.DemoModeModal })));
const DatasetQualityModal = React.lazy(() => import('../../components/common/DatasetQualityModal').then(m => ({ default: m.DatasetQualityModal })));
const SystemHealthModal = React.lazy(() => import('../../components/common/SystemHealthModal').then(m => ({ default: m.SystemHealthModal })));
const HumanEvaluationModal = React.lazy(() => import('../../components/common/HumanEvaluationModal').then(m => ({ default: m.HumanEvaluationModal })));
import { DemoScenario } from '../../data/demoScenarios';
import {
  SupportedLanguage,
  CENTRAL_LANGUAGES,
  SUPPORTED_LANGUAGE_LIST
} from '../../services/languageService';
import { getCapability, getStatusBadge, getOfflineModeLabel } from '../../services/translationCapabilities';
import { TranslationEvidence, getEvidenceBadge } from '../../services/translationEvidence';
import { detectLanguageAndScript, DetectionResult } from '../../services/languageDetector';
import { saveCorrection, exportCorrectionsJson, getStoredCorrections } from '../../services/feedbackService';
import { checkOfflineReadiness, OfflineStatus } from '../../services/offlineReadyService';
import { getLanguagePacks, LanguagePack } from '../../services/languagePackService';

export const TextToTextPage: React.FC = () => {
  const [sourceLang, setSourceLang] = useState<SupportedLanguage>('english');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('santali');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);

  // New accessibility & offline platform states
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [santaliScript, setSantaliScript] = useState<'ol_chiki' | 'latin' | 'devanagari'>('ol_chiki');
  const [detectedLanguageInfo, setDetectedLanguageInfo] = useState<DetectionResult | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [userCorrectionText, setUserCorrectionText] = useState('');
  const [isNativeSpeaker, setIsNativeSpeaker] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [correctionSavedNotice, setCorrectionSavedNotice] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
  const [showPacksModal, setShowPacksModal] = useState(false);
  const [showOfflineChallenge, setShowOfflineChallenge] = useState(false);
  const [showDemoMode, setShowDemoMode] = useState(false);
  const [showDatasetQuality, setShowDatasetQuality] = useState(false);
  const [showSystemHealth, setShowSystemHealth] = useState(false);
  const [showHumanEval, setShowHumanEval] = useState(false);
  const [speechEngineNotice, setSpeechEngineNotice] = useState<SpeechPlaybackInfo | null>(null);
  
  const recognitionRef = useRef<any>(null);

  const handleSelectDemoScenario = (scenario: DemoScenario) => {
    setShowDemoMode(false);
    setSourceLang(scenario.sourceLang);
    setTargetLang(scenario.targetLang);
    setInputText(scenario.sourceText);
    handleTranslate(scenario.sourceText);
    window.scrollTo({ top: 160, behavior: 'smooth' });
  };

  const handleSelectMundariHonestyDemo = () => {
    setShowDemoMode(false);
    setSourceLang('english');
    setTargetLang('mundari');
    setInputText('I am going to school.');
    handleTranslate('I am going to school.');
    window.scrollTo({ top: 160, behavior: 'smooth' });
  };
  
  // Translation history state with local storage persistence
  const [history, setHistory] = useState<{ source: string; target: string; from: string; to: string; time: string }[]>(() => {
    try {
      const saved = localStorage.getItem('bhasha_setu_history_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { source: 'Welcome to our village', target: 'ᱟᱞᱮᱭᱟᱜ ᱟᱹᱛᱩ ᱨᱮ ᱟᱯᱮᱭᱟᱜ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾', from: 'English', to: 'Santali', time: 'Just now' },
      { source: 'How is your health?', target: 'ᱦᱚᱲᱢᱚ ᱵᱮᱥ ᱢᱮᱱᱟᱜ-ᱟ?', from: 'English', to: 'Santali', time: '5m ago' }
    ];
  });

  // Check offline readiness on mount
  useEffect(() => {
    checkOfflineReadiness().then(status => setOfflineStatus(status));
  }, []);

  // Sync history to local storage
  useEffect(() => {
    try {
      localStorage.setItem('bhasha_setu_history_v2', JSON.stringify(history));
    } catch {}
  }, [history]);

  // Language auto-detection on input change
  useEffect(() => {
    if (!inputText.trim() || inputText.trim().length < 3) {
      setDetectedLanguageInfo(null);
      return;
    }

    const timer = setTimeout(() => {
      const result = detectLanguageAndScript(inputText);
      if (result.confidence >= 0.7 && result.detectedLanguage !== sourceLang) {
        setDetectedLanguageInfo(result);
      } else {
        setDetectedLanguageInfo(null);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [inputText, sourceLang]);

  const sourceLangInfo = CENTRAL_LANGUAGES[sourceLang];
  const targetLangInfo = CENTRAL_LANGUAGES[targetLang];

  const handleTranslate = async (overrideText?: string) => {
    const textToUse = (typeof overrideText === 'string' ? overrideText : inputText).trim();
    if (!textToUse) return;
    setIsTranslating(true);
    setTranslationResult(null);
    setFeedbackGiven(null);

    const result = await translateText(textToUse, sourceLang, targetLang, {
      domain: selectedDomain === 'All' ? undefined : selectedDomain,
      targetScript: targetLang === 'santali' ? santaliScript : undefined
    });

    setTranslationResult(result);
    setOutputText(result.success && result.targetText ? result.targetText : '');
    setIsTranslating(false);

    // Append to history (only for successful translations)
    if (result.success && result.targetText) {
      setHistory(prev => [
        {
          source: textToUse,
          target: result.targetText,
          from: sourceLangInfo.name,
          to: targetLangInfo.name,
          time: 'Just now'
        },
        ...prev.slice(0, 19) // retain last 20 entries
      ]);
    }
  };

  const handleSantaliScriptChange = (newScript: 'ol_chiki' | 'latin' | 'devanagari') => {
    setSantaliScript(newScript);
    if (translationResult?.text) {
      const transliterated = transliterateSantaliToScript(translationResult.text, newScript);
      setOutputText(transliterated);
    }
  };

  const handleToggleMic = async () => {
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
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (e) {
      console.warn('Microphone permission not granted:', e);
      setSpeechStatus('Microphone blocked. Please allow mic in browser settings.');
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = sourceLang === 'english' ? 'en-IN' : (sourceLang === 'hindi' || sourceLang === 'santali' || sourceLang === 'mundari' || sourceLang === 'ho' ? 'hi-IN' : 'en-IN');
      recognition.continuous = true;
      recognition.interimResults = true;

      setIsListening(true);
      setSpeechStatus(`Listening in ${sourceLangInfo.name}... Speak now (tap mic to stop).`);

      let spokenAccum = '';

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (finalChunk) {
          spokenAccum = (spokenAccum + ' ' + finalChunk).trim();
        }
        const current = (spokenAccum || interim).trim();
        if (current) {
          setInputText(current);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event in TextToText:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
          setSpeechStatus(null);
        }
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
    const file = new Blob([
      `Bhasha Setu (भाषा | SETU) — Translation Record\n` +
      `Date: ${new Date().toLocaleString()}\n` +
      `Domain: ${selectedDomain}\n` +
      `Source (${sourceLangInfo.name}):\n${inputText}\n\n` +
      `Translation (${targetLangInfo.name}):\n${outputText}\n\n` +
      `Provider: ${translationResult?.provider || 'Local'}\n` +
      `Verification: ${translationResult?.reliability || 'Verified'}\n`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `BhashaSetu_Translation_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveCorrection = () => {
    if (!userCorrectionText.trim()) return;
    saveCorrection({
      sourceText: inputText,
      sourceLang: sourceLangInfo.name,
      systemTranslation: outputText,
      targetLang: targetLangInfo.name,
      correctedText: userCorrectionText,
      targetScript: santaliScript,
      isNativeSpeaker,
      domain: selectedDomain,
      notes: correctionNotes
    });
    setCorrectionSavedNotice(true);
    setTimeout(() => {
      setCorrectionSavedNotice(false);
      setShowCorrectionModal(false);
      setUserCorrectionText('');
      setCorrectionNotes('');
    }, 1800);
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Title */}
        <div className="w-full py-4 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#249144]" /> Offline-First Translation Studio
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Multilingual Translator
          </h1>
          <div className="relative mt-2.5 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-2.5 max-w-2xl text-sm sm:text-base text-slate-500">
            Bidirectional tribal language translation and linguistic accessibility engine for educators and frontline cadres.
          </p>

          {/* Action HUD Bar: Offline Challenge, SIH Demo, Quality Audit, System Health, Installed Packs */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            
            {/* Consumer-Friendly Offline Readiness Badge (Part 11: 🟢 OFFLINE READY / 🟡 ONLINE / 🔴 NOT READY) */}
            <button
              onClick={() => setShowPacksModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition shadow-xs cursor-pointer border bg-white"
              title="Click to view installed offline language packs"
            >
              {offlineStatus?.isOfflineReady ? (
                !offlineStatus.isOnline ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>🟢 OFFLINE READY</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>🟡 ONLINE (Offline Pack Ready)</span>
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>🔴 OFFLINE NOT READY</span>
                </span>
              )}
            </button>

            <button
              onClick={() => setShowOfflineChallenge(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition shadow-xs cursor-pointer"
              title="Click to launch interactive Offline Challenge (Simulation Mode)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>⚡ Test Offline Mode</span>
            </button>

            <button
              onClick={() => setShowDemoMode(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-green-50 border border-[#d1ead4] text-[#14532d] font-bold hover:bg-green-100 transition shadow-xs cursor-pointer"
              title="Launch 60-second SIH Judge Walkthrough"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#249144]" />
              <span>🎯 SIH 60s Demo</span>
            </button>

            <button
              onClick={() => setShowDatasetQuality(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-semibold hover:bg-blue-100 transition shadow-2xs cursor-pointer"
              title="View Santali dataset quality and Unicode integrity metrics"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Dataset Audit (6,780)</span>
            </button>

            <button
              onClick={() => setShowHumanEval(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 font-semibold hover:bg-purple-100 transition shadow-2xs cursor-pointer"
              title="Native Speaker & Field Linguist Evaluation Workflow"
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Linguist Review</span>
            </button>

            <button
              onClick={() => setShowSystemHealth(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-semibold hover:bg-slate-200 transition shadow-2xs cursor-pointer"
              title="Developer & Judge System Health Diagnostics"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-700" />
              <span>System Health</span>
            </button>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Linguistic Honesty Guard ✓</span>
            </span>
          </div>
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
                  onChange={(e) => setSourceLang(e.target.value as SupportedLanguage)}
                  aria-label="Select source language"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none hover:border-[#249144] transition shadow-sm cursor-pointer"
                >
                  {SUPPORTED_LANGUAGE_LIST.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Context / Domain Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase hidden sm:inline">Context:</span>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none hover:border-[#249144] transition cursor-pointer shadow-2xs"
                  title="Contextual domain prioritizes vocabulary for specific fields"
                >
                  <option value="All">All Domains</option>
                  <option value="Classroom">Classroom / Education</option>
                  <option value="Healthcare">Healthcare & Medical</option>
                  <option value="Animal">Animals & Wildlife</option>
                  <option value="Agriculture">Agriculture & Nature</option>
                  <option value="Emergency">Emergency & Relief</option>
                  <option value="Administration">Village Administration</option>
                </select>
              </div>
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
                  onChange={(e) => setTargetLang(e.target.value as SupportedLanguage)}
                  aria-label="Select target language"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none hover:border-[#249144] transition shadow-sm cursor-pointer"
                >
                  {SUPPORTED_LANGUAGE_LIST.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.flag} {lang.name}
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

          {/* Auto-Detection Notification Banner */}
          {detectedLanguageInfo && (
            <div className="px-6 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-xs text-[#14532d] animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#249144]" />
                <span>
                  Detected Input Script: <strong>{detectedLanguageInfo.detectedScript}</strong> ({detectedLanguageInfo.reason})
                </span>
              </div>
              <button
                onClick={() => {
                  setSourceLang(detectedLanguageInfo.detectedLanguage);
                  setDetectedLanguageInfo(null);
                }}
                className="text-xs font-bold underline hover:text-[#249144] transition"
              >
                Set Input to {CENTRAL_LANGUAGES[detectedLanguageInfo.detectedLanguage]?.name}
              </button>
            </div>
          )}

          {/* Text Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            
            {/* Input Box */}
            <div className="flex flex-col p-6 min-h-[300px] sm:min-h-[360px] justify-between relative">
              
              {speechStatus && (
                <div className="absolute top-2 left-6 right-6 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 animate-pulse z-10">
                  <Radio className="w-3.5 h-3.5 text-red-500 animate-spin" />
                  <span>{speechStatus}</span>
                </div>
              )}

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Write, paste, or click the mic to speak in ${sourceLangInfo.name}...`}
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
            <div className="flex flex-col p-6 min-h-[300px] sm:min-h-[360px] bg-slate-50/40 justify-between">
              <div>
                {/* Capability indicator for this language pair */}
                {/* Target Script Switcher for Santali */}
                {targetLang === 'santali' && outputText && (
                  <div className="mb-3 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        Orthographic & Phonetic Script Display
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Preserves linguistic meaning
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleSantaliScriptChange('ol_chiki')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          santaliScript === 'ol_chiki' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span>ᱚᱞ ᱪᱤᱠᱤ (Ol Chiki)</span>
                        <span className="text-[10px] opacity-80 font-normal">Native</span>
                      </button>
                      <button
                        onClick={() => handleSantaliScriptChange('latin')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          santaliScript === 'latin' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span>Roman Phonetic</span>
                        <span className="text-[10px] opacity-80 font-normal">Pronunciation</span>
                      </button>
                      <button
                        onClick={() => handleSantaliScriptChange('devanagari')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          santaliScript === 'devanagari' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span>देवनागरी (Devanagari)</span>
                        <span className="text-[10px] opacity-80 font-normal">Transliteration</span>
                      </button>
                    </div>
                  </div>
                )}

                {isTranslating ? (
                  <div className="flex items-center gap-2 text-sm text-[#249144] animate-pulse pt-2">
                    <Sparkles className="w-4 h-4 animate-spin" /> Retrieving verified translation...
                  </div>
                ) : outputText ? (
                  <div className="space-y-3">
                    <p className={`leading-relaxed text-slate-900 whitespace-pre-wrap select-text ${
                      targetLang === 'santali' && santaliScript === 'ol_chiki' 
                        ? 'text-xl sm:text-2xl font-bold tracking-wide text-slate-950' 
                        : 'text-base sm:text-lg font-medium'
                    }`}>
                      {outputText}
                    </p>
                    {translationResult?.transliteration && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-green-50/90 border border-green-200 text-xs font-mono font-semibold text-[#14532d] shadow-2xs">
                        <span className="text-[10px] uppercase font-sans text-slate-400 font-bold">Roman Phonetic Pronunciation:</span>
                        <span>/{translationResult.transliteration}/</span>
                      </div>
                    )}

                    {/* Unambiguous Translation Source & Provenance Card */}
                    {translationResult && (() => {
                      const isOfflineSrc = translationResult.evidence?.isOffline;
                      const isOnlineSrc = translationResult.evidence?.internetRequired;
                      const isDataset = translationResult.evidence?.sourceType === 'local_dataset' || 
                                        translationResult.evidence?.sourceType === 'sqlite_wasm' || 
                                        translationResult.evidence?.sourceType === 'phrase_bank';
                      const isOnline = translationResult.evidence?.sourceType === 'online_bridge';
                      const isVocab = translationResult.evidence?.sourceType === 'vocabulary_bank';

                      const sourceTitle = isDataset ? 'LOCAL VERIFIED DATASET' :
                                          isOnline ? 'ONLINE WEB BRIDGE' :
                                          isVocab ? 'LOCAL VOCABULARY' : 'LOCAL ENGINE';

                      const statusLabel = isOfflineSrc ? 'OFFLINE AVAILABLE' :
                                          isOnlineSrc ? 'ONLINE ONLY' : 'OFFLINE AVAILABLE';

                      const matchLabel = (translationResult.evidence?.matchCategory === 'exact_phrase' || 
                                          translationResult.evidence?.matchCategory === 'normalized_exact')
                                          ? (translationResult.evidence?.datasetRowId ? `EXACT SENTENCE (Row #${translationResult.evidence.datasetRowId})` : 'EXACT SENTENCE') :
                                         translationResult.evidence?.matchCategory === 'neural_bridge' ? 'ONLINE NEURAL TRANSLATION' :
                                         translationResult.evidence?.matchCategory === 'vocabulary_lookup' ? 'VOCABULARY ONLY' :
                                         'PHRASE MATCH';

                      return (
                        <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-1.5 shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Translation Source:</span>
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                isDataset ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                                isOnline ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                                'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                                {sourceTitle}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Status:</span>
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                isOfflineSrc ? 'bg-green-100 text-[#14532d] border border-green-300' :
                                'bg-purple-100 text-purple-900 border border-purple-300'
                              }`}>
                                {isOfflineSrc ? '✓ ' : '🌐 '}{statusLabel}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-[10px] pt-0.5">
                            <div>
                              <span className="text-slate-400 font-semibold">Match: </span>
                              <span className="font-medium text-slate-800">{matchLabel}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold">Provider: </span>
                              <span className="font-medium text-slate-800">{translationResult.provider}</span>
                            </div>
                            {translationResult.outputScript && (
                              <div>
                                <span className="text-slate-400 font-semibold">Script: </span>
                                <span className="font-medium text-slate-800">{translationResult.outputScript}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : !isTranslating && translationResult && !translationResult.success ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>Translation Unavailable for Full Sentence</span>
                      </div>
                      <p className="text-rose-800 text-[11px] leading-relaxed font-normal">
                        {translationResult.error}
                      </p>
                    </div>

                    {/* Vocabulary Assistance Panel — word-level only */}
                    {translationResult.vocabularyAssistance && translationResult.vocabularyAssistance.length > 0 && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                          <span>Vocabulary Assistance</span>
                          <span className="text-[9px] font-normal text-amber-600 ml-1">(word-level only — not a sentence translation)</span>
                        </div>
                        <div className="grid gap-1.5">
                          {translationResult.vocabularyAssistance.map((item, i) => (
                            <div key={i} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-amber-200">
                              <span className="font-bold text-slate-700 capitalize">{item.word}</span>
                              <span className="text-amber-900 font-medium">{item.meaning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-base text-slate-300 italic pt-2 font-light">
                    Translation in {targetLangInfo.name} will appear here...
                  </p>
                )}
              </div>

              {/* Output Actions */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-200/60 mt-6">
                <div className="flex items-center justify-between">
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
                      onClick={() => {
                        playTextSpeech(
                          outputText,
                          targetLang,
                          0.9,
                          () => {},
                          (info) => {
                            setSpeechEngineNotice(info);
                            setTimeout(() => setSpeechEngineNotice(null), 5000);
                          }
                        );
                      }}
                      disabled={!outputText}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-[#249144] hover:text-[#249144] disabled:opacity-30 transition shadow-sm cursor-pointer"
                      title="Play Audio Speech"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={handleDownload}
                      disabled={!outputText}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-[#249144] hover:text-[#249144] disabled:opacity-30 transition shadow-sm cursor-pointer"
                      title="Download translation text"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Rating Feedback & Correction */}
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
                        onClick={() => {
                          setFeedbackGiven('down');
                          setShowCorrectionModal(true);
                        }}
                        className={`p-1.5 rounded-lg hover:text-red-500 ${feedbackGiven === 'down' ? 'text-red-500 bg-red-50' : ''}`}
                        title="Suggest correction"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Honest Speech Engine Status Notice */}
                {speechEngineNotice && (
                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-medium flex items-center gap-2 animate-in fade-in">
                    <Volume2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span>{speechEngineNotice.notes}</span>
                  </div>
                )}

                {/* Evidence & Provenance Toggle */}
                {translationResult?.evidence && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setShowEvidence(!showEvidence)}
                      className="text-xs font-semibold text-slate-600 hover:text-[#249144] flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#249144]" />
                      <span>{showEvidence ? 'Hide Translation Evidence' : 'View Translation Evidence & Provenance'}</span>
                      {showEvidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showEvidence && (
                      <div className="mt-2.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            Translation Evidence Package
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            translationResult.evidence.verificationStatus === 'verified'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : translationResult.evidence.verificationStatus === 'dataset_backed'
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : translationResult.evidence.verificationStatus === 'vocabulary_only'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-purple-50 border-purple-200 text-purple-800'
                          }`}>
                            {translationResult.evidence.verificationStatus === 'verified' ? '✓ Verified Corpus' :
                             translationResult.evidence.verificationStatus === 'dataset_backed' ? '📚 Database Backed' :
                             translationResult.evidence.verificationStatus === 'vocabulary_only' ? '📖 Word-Level Assistance' : '🌐 Web Bridge (Experimental)'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                          <div>
                            <span className="text-slate-400 block font-bold uppercase text-[9px]">Target Language</span>
                            <span className="font-semibold text-slate-800">{targetLangInfo.name}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold uppercase text-[9px]">Output Script</span>
                            <span className="font-semibold text-slate-800">{translationResult.outputScript || targetLangInfo.scriptName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold uppercase text-[9px]">Linguistic Source</span>
                            <span className="font-semibold text-slate-800">{translationResult.evidence.providerName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold uppercase text-[9px]">Dataset Entry ID</span>
                            <span className="font-mono font-bold text-slate-700">
                              {translationResult.evidence.datasetRowId 
                                ? `#${translationResult.evidence.datasetRowId}` 
                                : translationResult.evidence.sourceType === 'online_bridge'
                                ? 'N/A (Online Neural MT)'
                                : translationResult.evidence.sourceType === 'vocabulary_bank'
                                ? 'N/A (Vocabulary Bank)'
                                : 'Phrase Bank'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold uppercase text-[9px]">Internet Requirement</span>
                            <span className={`font-semibold ${translationResult.evidence.internetRequired ? 'text-purple-700' : 'text-emerald-700'}`}>
                              {translationResult.evidence.internetRequired ? '🌐 Internet Required' : '✓ Not Required (Offline)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold uppercase text-[9px]">Translation Type</span>
                            <span className="font-semibold text-slate-800">
                              {translationResult.evidence.matchCategory === 'vocabulary_lookup' ? 'Word-Level Assistance' : 'Sentence Translation'}
                            </span>
                          </div>
                        </div>

                        {translationResult.evidence.notes && (
                          <p className="text-[10px] text-slate-600 border-t border-slate-200/60 pt-2 italic leading-relaxed">
                            {translationResult.evidence.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>

        {/* Human-in-the-Loop Correction Modal */}
        {showCorrectionModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#249144]" />
                  <h3 className="font-bold text-slate-900 text-base">Suggest Translation Correction</h3>
                </div>
                <button
                  onClick={() => setShowCorrectionModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {correctionSavedNotice ? (
                <div className="py-8 text-center space-y-2">
                  <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-slate-900">Thank you for your contribution!</p>
                  <p className="text-xs text-slate-500">
                    Your correction has been saved locally with status <strong>Pending Linguist Review</strong>.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Source ({sourceLangInfo.name}):</span>
                    <p className="p-2.5 bg-slate-50 rounded-xl text-slate-800 font-medium">{inputText}</p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Current Translation:</span>
                    <p className="p-2.5 bg-rose-50 text-rose-900 rounded-xl font-medium">{outputText || 'None'}</p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="text-slate-700 font-bold block">
                      Correct Translation in {targetLangInfo.name} ({targetLang === 'santali' ? 'Ol Chiki or Roman' : targetLangInfo.scriptName}):
                    </label>
                    <textarea
                      value={userCorrectionText}
                      onChange={(e) => setUserCorrectionText(e.target.value)}
                      placeholder="Enter the authentic tribal wording..."
                      className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#249144] focus:bg-white resize-none"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="text-slate-700 font-medium block">Linguistic Notes / Regional Dialect (Optional):</label>
                    <input
                      type="text"
                      value={correctionNotes}
                      onChange={(e) => setCorrectionNotes(e.target.value)}
                      placeholder="e.g. Mayurbhanj Northern dialect nuance"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#249144]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="native-speaker-check"
                      checked={isNativeSpeaker}
                      onChange={(e) => setIsNativeSpeaker(e.target.checked)}
                      className="rounded border-slate-300 text-[#249144] focus:ring-[#249144]"
                    />
                    <label htmlFor="native-speaker-check" className="text-xs text-slate-700 font-medium cursor-pointer">
                      I am a native speaker or tribal educator
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setShowCorrectionModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCorrection}
                      disabled={!userCorrectionText.trim()}
                      className="btn-mota px-5 py-2 text-xs font-bold disabled:opacity-50"
                    >
                      Save Correction
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Offline Language Packs Modal */}
        {showPacksModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#249144]" />
                  <h3 className="font-bold text-slate-900 text-base">Installed Offline Language Packs</h3>
                </div>
                <button
                  onClick={() => setShowPacksModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {getLanguagePacks().map(pack => (
                  <div key={pack.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{pack.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        pack.status === 'installed' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        {pack.status === 'installed' ? 'Installed ✓' : 'Vocabulary Only'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{pack.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-1">
                      <span>Entries: <strong className="text-slate-700">{pack.entryCount}</strong></span>
                      <span>•</span>
                      <span>Size: <strong className="text-slate-700">{pack.sizeFormatted}</strong></span>
                      <span>•</span>
                      <span>Scripts: <strong className="text-slate-700">{pack.supportedScripts.join(', ')}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <button
                  onClick={() => {
                    const data = exportCorrectionsJson();
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `bhasha_setu_corrections_${Date.now()}.json`;
                    a.click();
                  }}
                  className="text-[#249144] font-bold hover:underline"
                >
                  Export Saved Corrections ({getStoredCorrections().length})
                </button>
                <button
                  onClick={() => setShowPacksModal(false)}
                  className="btn-mota px-4 py-1.5 text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Drawer Modal */}
        {showHistory && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#249144]" />
                <h3 className="font-bold text-slate-800 text-sm">Recent Translation History</h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      const exportData = {
                        application: 'Bhasha Setu (भाषा | SETU)',
                        exportDate: new Date().toISOString(),
                        totalEntries: history.length,
                        records: history.map((h, i) => ({
                          id: `hist-${i + 1}`,
                          sourceLanguage: h.from,
                          targetLanguage: h.to,
                          sourceText: h.source,
                          translatedText: h.target,
                          timestamp: h.time
                        }))
                      };
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `bhasha_setu_history_${Date.now()}.json`;
                      a.click();
                    }}
                    className="text-[#249144] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export History</span>
                  </button>
                )}
                <button onClick={() => setHistory([])} className="text-red-500 hover:underline cursor-pointer">
                  Clear All
                </button>
              </div>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center italic">No translation history stored locally.</p>
            ) : (
              <div className="grid gap-2.5">
                {history.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{h.from} → {h.to}</span>
                        <span className="text-[10px] text-slate-400">• {h.time}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 truncate">{h.source}</p>
                      <p className="text-xs text-emerald-800 font-medium truncate">{h.target}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(h.target);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                        title="Copy Translation"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => playTextSpeech(h.target, targetLang)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#249144] hover:bg-green-50 transition"
                        title="Play Pronunciation"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setInputText(h.source);
                          setOutputText(h.target);
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs text-[#249144] font-semibold hover:bg-green-50 transition cursor-pointer"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          setHistory(prev => prev.filter((_, idx) => idx !== i));
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Local SQLite Database Explorer for Multilingual Classroom Dataset */}
        <div className="mt-8">
          <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Database Explorer...</div>}>
            <ClassroomDatabaseExplorer
              onSelectSentence={(eng, sat) => {
                setSourceLang('english');
                setTargetLang('santali');
                setInputText(eng);
                setOutputText(sat);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
            />
          </React.Suspense>
        </div>

        {/* Educational & Linguistic Integrity Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl py-2.5 px-4 inline-flex items-center gap-2 font-medium shadow-sm max-w-2xl text-left sm:text-center">
            <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>Linguistic Integrity Commitment:</strong> All Santali translations are backed by our curated 6,780-entry verified lexicon and neural models. Mundari and Ho are currently supported for vocabulary assistance only while custom edge models undergo training.
            </span>
          </p>
        </div>

        {/* Modal Demonstrations & Dialogs (Loaded dynamically on demand) */}
        <React.Suspense fallback={null}>
          {showOfflineChallenge && (
            <OfflineChallengeModal
              isOpen={showOfflineChallenge}
              onClose={() => setShowOfflineChallenge(false)}
            />
          )}

          {showDemoMode && (
            <DemoModeModal
              isOpen={showDemoMode}
              onClose={() => setShowDemoMode(false)}
              onSelectScenario={handleSelectDemoScenario}
              onSelectMundariHonestyDemo={handleSelectMundariHonestyDemo}
            />
          )}

          {showDatasetQuality && (
            <DatasetQualityModal
              isOpen={showDatasetQuality}
              onClose={() => setShowDatasetQuality(false)}
            />
          )}

          {showSystemHealth && (
            <SystemHealthModal
              isOpen={showSystemHealth}
              onClose={() => setShowSystemHealth(false)}
            />
          )}

          {showHumanEval && (
            <HumanEvaluationModal
              isOpen={showHumanEval}
              onClose={() => setShowHumanEval(false)}
              initialSourceText={inputText || 'I am going to school.'}
              initialTargetText={outputText || 'ᱤᱧ ᱟᱥᱲᱟ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱹᱧ ᱾'}
              sourceLang={sourceLangInfo.name}
              targetLang={targetLangInfo.name}
              category={selectedDomain}
            />
          )}
        </React.Suspense>

      </div>
    </section>
  );
};
