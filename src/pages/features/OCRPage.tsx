import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Copy, 
  Check, 
  Volume2, 
  Sparkles, 
  FileText, 
  Languages, 
  RefreshCw, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Sliders,
  ShieldAlert,
  Info,
  Bug,
  BarChart3,
  Gauge,
  Layers,
  Award,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { processImageOCR, translateText, playTextSpeech, OCRResult, TranslationResult } from '../../services/translationService';
import { detectScriptFromText } from '../../services/ocrService';
import { 
  SupportedLanguage, 
  CENTRAL_LANGUAGES, 
  SUPPORTED_LANGUAGE_LIST, 
  mapScriptToLanguage,
  normalizeToSupportedLanguage
} from '../../services/languageService';
import { getAuthenticSampleDocs, GeneratedSampleDoc } from '../../services/ocr/sampleDocumentGenerator';
import { runFullOCRBenchmark, runMultiScriptBenchmarkSuite } from '../../services/ocr/ocrBenchmarkService';
import { OCRBenchmarkReport, MultiScriptBenchmarkSuiteReport } from '../../services/ocr/types';
import { 
  SupportedScriptSelection, 
  SCRIPT_CAPABILITY_MATRIX, 
  getScriptCapability 
} from '../../services/ocr/scriptCapability';
import { getCapability, getStatusBadge, getOfflineModeLabel } from '../../services/translationCapabilities';

export const OCRPage: React.FC = () => {
  const [sourceLang, setSourceLang] = useState<SupportedLanguage>('english');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('hindi');
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translationProvider, setTranslationProvider] = useState<string>('');
  const [selectedScript, setSelectedScript] = useState<SupportedScriptSelection>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<{ status: string; progress: number }>({ status: '', progress: 0 });
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editableExtractedText, setEditableExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState('sample_document.png');
  const [copied, setCopied] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);
  /** Full TranslationResult from the last translation call (replaces scattered error/provider state) */
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);

  // Diagnostic / Benchmark State
  const [showDebug, setShowDebug] = useState(false);
  const [benchmarkReport, setBenchmarkReport] = useState<OCRBenchmarkReport | null>(null);
  const [multiScriptReport, setMultiScriptReport] = useState<MultiScriptBenchmarkSuiteReport | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkStatus, setBenchmarkStatus] = useState('');
  const [sampleDocs, setSampleDocs] = useState<GeneratedSampleDoc[]>([]);
  const [activeGroundTruth, setActiveGroundTruth] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const activeCapability = getScriptCapability(selectedScript);

  // Generate authentic sample documents on mount
  useEffect(() => {
    const docs = getAuthenticSampleDocs();
    setSampleDocs(docs);
    if (docs.length > 0 && !selectedImage) {
      setSelectedImage(docs[0].previewUrl);
      setImageName(docs[0].title);
      setActiveGroundTruth(docs[0].groundTruthText);
    }
  }, []);

  const handleProcessOCR = async (
    imgUrl: string,
    scriptKeyOverride?: SupportedScriptSelection,
    groundTruth?: string
  ) => {
    const scriptKey = scriptKeyOverride || selectedScript;
    const capability = getScriptCapability(scriptKey);
    const langCode = capability.tesseractLang || scriptKey;

    setIsProcessing(true);
    setOcrResult(null);
    setEditableExtractedText('');
    setTranslatedText('');
    setBenchmarkReport(null);
    setOcrProgress({ status: 'Analyzing document and starting OCR engine...', progress: 0.05 });

    try {
      const result = await processImageOCR(
        imgUrl,
        langCode,
        (p) => setOcrProgress(p),
        true,
        groundTruth || activeGroundTruth
      );

      setOcrResult(result);
      setEditableExtractedText(result.text);
      setIsProcessing(false);

      // Map detected OCR language to primary SupportedLanguage
      const detectedSource = mapScriptToLanguage(result.detectedLanguage || 'latin');
      setSourceLang(detectedSource);

      // Auto-translate if text exists and script is supported
      if (result.text && result.text.trim() && !result.isCustomModelRequired) {
        triggerTranslation(result.text, detectedSource, targetLang);
      }
    } catch (err) {
      console.error('OCR processing error:', err);
      setIsProcessing(false);
    }
  };

  const triggerTranslation = async (
    text: string,
    src: SupportedLanguage,
    tgt: SupportedLanguage
  ) => {
    const trimmed = text.trim();
    if (!trimmed || ocrResult?.isCustomModelRequired) return;

    if (src === tgt) {
      setTranslatedText('No translation required.');
      setTranslationError(null);
      setTranslationProvider('Identity (Same Language)');
      setTranslationResult(null);
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);
    setTranslationResult(null);

    try {
      const res = await translateText(trimmed, src, tgt);
      setTranslationResult(res);
      if (res.success && res.text) {
        setTranslatedText(res.text);
        setTranslationError(null);
        setTranslationProvider(res.provider || '');
      } else {
        setTranslatedText('');
        // Show vocabulary assistance in the error slot if any was returned
        setTranslationError(res.error || `${CENTRAL_LANGUAGES[tgt].name} translation is currently unavailable for this text.`);
        setTranslationProvider('');
      }
    } catch (err: any) {
      setTranslatedText('');
      setTranslationError(err?.message || 'Translation error encountered');
      setTranslationProvider('');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRunStrategyBenchmark = async () => {
    if (!selectedImage) return;
    setIsBenchmarking(true);
    setBenchmarkReport(null);
    setBenchmarkStatus('Initializing OCR Strategy & PSM Benchmark...');

    try {
      const langCode = activeCapability.tesseractLang || 'eng+hin';
      const report = await runFullOCRBenchmark(selectedImage, langCode, (status) => {
        setBenchmarkStatus(status);
      });
      setBenchmarkReport(report);
      setIsBenchmarking(false);
      setShowDebug(true);
    } catch (err) {
      console.error('Benchmark error:', err);
      setIsBenchmarking(false);
      setBenchmarkStatus('Benchmark encountered an error');
    }
  };

  const handleRunMultiScriptSuite = async () => {
    setIsBenchmarking(true);
    setMultiScriptReport(null);
    setBenchmarkStatus('Starting Multi-Script Benchmark Suite across 6 test categories...');

    try {
      const report = await runMultiScriptBenchmarkSuite((status, step, total) => {
        setBenchmarkStatus(`[Step ${step}/${total}] ${status}`);
      });
      setMultiScriptReport(report);
      setIsBenchmarking(false);
      setShowDebug(true);
    } catch (err) {
      console.error('Multi-script benchmark error:', err);
      setIsBenchmarking(false);
      setBenchmarkStatus('Multi-script benchmark encountered an error');
    }
  };

  const handleManualTranslate = async () => {
    if (!editableExtractedText.trim() || ocrResult?.isCustomModelRequired) return;
    triggerTranslation(editableExtractedText, sourceLang, targetLang);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setImageName(file.name);
      setActiveGroundTruth(undefined);
      handleProcessOCR(url, selectedScript);
    }
  };

  const handleCopy = (text: string, isTrans: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isTrans) {
      setCopiedTranslation(true);
      setTimeout(() => setCopiedTranslation(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="w-full py-4 flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d]">
            <Sparkles className="w-3.5 h-3.5 text-[#249144]" /> Multi-Script OCR & Document Scanner
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-bold leading-snug text-slate-900">
            Text Extraction (OCR)
          </h1>
          <div className="relative w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#249144] rounded-full"></div>
          </div>
          <p className="max-w-2xl text-sm sm:text-base text-slate-600 font-light leading-relaxed">
            Extract text from tribal manuscripts, health pamphlets, field photos, and documents using adaptive in-browser OCR with transparent multi-script capability tracking.
          </p>
        </div>

        {/* OCR Studio Grid */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            
            {/* Left Column: Image Upload & Scan Preview */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#249144]" /> Document Image Source
                  </h3>
                  
                  {/* Manual Script Selector */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-xs">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <select
                        value={selectedScript}
                        onChange={(e) => {
                          const newScript = e.target.value as SupportedScriptSelection;
                          setSelectedScript(newScript);
                          if (selectedImage) {
                            handleProcessOCR(selectedImage, newScript);
                          }
                        }}
                        className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
                        title="Manual Script Selector"
                      >
                        <option value="auto">Auto (Latin + Devanagari)</option>
                        <option value="latin">English / Latin Script</option>
                        <option value="devanagari">Hindi / Devanagari</option>
                        <option value="mixed">Mixed (English + Hindi)</option>
                        <option value="ol_chiki">Santali / Ol Chiki</option>
                        <option value="warang_chiti">Ho / Warang Chiti</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setShowDebug(!showDebug)}
                      className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        showDebug ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Toggle OCR Diagnostics & Multi-Script Benchmarking Console"
                    >
                      <Bug className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Debug</span>
                    </button>
                  </div>
                </div>

                {/* SCRIPT CAPABILITY & MODEL STATUS BAR */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Script:</span>
                    <span className="font-bold text-slate-800">{activeCapability.scriptName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[10px]">Engine:</span>
                    <span className="font-bold text-slate-700">{activeCapability.engine}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 text-[10px]">Model:</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded-md text-[10px] ${
                      activeCapability.isSupported ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {activeCapability.modelName}
                    </span>
                  </div>
                </div>

                {/* Dropzone / Preview Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#249144] bg-slate-50/70 p-6 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[260px] overflow-hidden group"
                >
                  {isProcessing && <div className="laser-line"></div>}

                  {selectedImage ? (
                    <div className="relative w-full h-full flex flex-col items-center">
                      <img
                        src={selectedImage}
                        alt="Uploaded document"
                        className="max-h-56 w-auto object-contain rounded-xl shadow-sm group-hover:opacity-95 transition"
                      />
                      <span className="mt-3 text-xs font-bold text-slate-700 bg-white px-3.5 py-1 rounded-full border border-slate-200 shadow-sm max-w-xs truncate">
                        {imageName}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="w-14 h-14 rounded-2xl bg-green-100 text-[#249144] flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">Click or drag image here</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Supports manuscripts, camera snapshots, Ol Chiki, Devanagari, and English documents (PNG, JPG, WEBP)
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* File & Camera Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-500" /> Browse Image
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl border border-[#bbf7d0] bg-[#dcfce7] hover:bg-[#bbf7d0] text-xs font-bold text-[#14532d] flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#249144]" /> Open Camera
                  </button>
                </div>

                {/* Authentic Manuscripts Preset Chips */}
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Multi-Script Test Documents (With Ground Truth):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sampleDocs.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedImage(doc.previewUrl);
                          setImageName(doc.title);
                          setActiveGroundTruth(doc.groundTruthText);
                          // Auto route script selector based on sample doc type
                          const scriptMap: Record<string, SupportedScriptSelection> = {
                            latin: 'latin',
                            devanagari: 'devanagari',
                            mixed: 'mixed',
                            ol_chiki: 'ol_chiki'
                          };
                          const mappedScript = scriptMap[doc.scriptType] || 'auto';
                          setSelectedScript(mappedScript);
                          handleProcessOCR(doc.previewUrl, mappedScript, doc.groundTruthText);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          imageName === doc.title
                            ? 'bg-emerald-100 border-[#249144] text-[#14532d] font-bold shadow-xs'
                            : 'bg-slate-100 hover:bg-emerald-50 hover:border-[#249144] border-slate-200 text-slate-700'
                        }`}
                      >
                        {doc.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Quality Report Card */}
                {ocrResult?.qualityReport && (
                  <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-500" /> Image Quality Report
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        ocrResult.qualityReport.overallQuality === 'excellent' ? 'bg-emerald-100 text-emerald-800' :
                        ocrResult.qualityReport.overallQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                        ocrResult.qualityReport.overallQuality === 'fair' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {ocrResult.qualityReport.overallQuality} Quality
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1">
                      <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                        <span className="block text-slate-400 text-[9px] uppercase font-bold">Clarity</span>
                        <span className="font-semibold text-slate-800">
                          {ocrResult.qualityReport.isBlurry ? '⚠️ Low Focus' : '✓ Sharp'}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                        <span className="block text-slate-400 text-[9px] uppercase font-bold">Lighting</span>
                        <span className="font-semibold text-slate-800 capitalize">
                          {ocrResult.qualityReport.lighting}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                        <span className="block text-slate-400 text-[9px] uppercase font-bold">Contrast</span>
                        <span className="font-semibold text-slate-800">
                          {ocrResult.qualityReport.contrastScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress & Scan Trigger Button */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                {isProcessing && (
                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-2 text-[#249144]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {ocrProgress.status || 'Recognizing text...'}
                      </span>
                      <span>{Math.round((ocrProgress.progress || 0) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-[#249144] h-1.5 rounded-full transition-all duration-200"
                        style={{ width: `${Math.max(5, (ocrProgress.progress || 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedImage) {
                        handleProcessOCR(selectedImage, selectedScript);
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    disabled={isProcessing || isBenchmarking}
                    className="flex-1 py-3.5 rounded-2xl bg-[#249144] hover:bg-[#1a7536] disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isProcessing ? 'Analyzing & Recognizing Text...' : 'Extract & Translate Text →'}</span>
                  </button>

                  {showDebug && (
                    <button
                      onClick={handleRunMultiScriptSuite}
                      disabled={isProcessing || isBenchmarking}
                      className="px-4 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      title="Run Full Multi-Script Benchmark Suite across English, Hindi, Mixed, Shadows, and Ol Chiki"
                    >
                      <Award className="w-4 h-4" />
                      <span>{isBenchmarking ? 'Testing...' : 'Multi-Script Suite'}</span>
                    </button>
                  )}
                </div>

                {isBenchmarking && (
                  <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{benchmarkStatus || 'Running multi-script validation suite...'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Extracted Text & Live Translation */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-slate-50/50">
              <div className="space-y-6">
                
                {/* 1. Extracted Text Display & Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#249144]" />
                        Extracted Text
                      </span>

                      {/* Source Language Selector (Step 9) */}
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-xs">
                        <span className="text-slate-500 font-medium">Source:</span>
                        <select
                          value={sourceLang}
                          onChange={(e) => {
                            const newSrc = e.target.value as SupportedLanguage;
                            setSourceLang(newSrc);
                            triggerTranslation(editableExtractedText, newSrc, targetLang);
                          }}
                          className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                          title="Select Source Language"
                        >
                          {SUPPORTED_LANGUAGE_LIST.map(lang => (
                            <option key={lang.id} value={lang.id}>
                              {lang.flag} {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {ocrResult && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                            Detected: {ocrResult.detectedLanguage}
                          </span>

                          {ocrResult.isCustomModelRequired ? (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-700" /> Custom Model Required
                            </span>
                          ) : (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              ocrResult.confidence >= 80 ? 'bg-emerald-100 text-emerald-800' :
                              ocrResult.confidence >= 60 ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {ocrResult.confidence}% Engine Confidence
                            </span>
                          )}

                          {ocrResult.debugInfo?.accuracyPercent !== undefined && !ocrResult.isCustomModelRequired && (
                            <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                              {ocrResult.debugInfo.accuracyPercent}% Ground-Truth Accuracy (CER: {ocrResult.debugInfo.cer})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {editableExtractedText && !ocrResult?.isCustomModelRequired && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(editableExtractedText, false)}
                          className="text-xs text-[#249144] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {ocrResult?.isCustomModelRequired ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Ol Chiki Recognition Model Not Installed</span>
                      </div>
                      <p className="text-amber-800 leading-relaxed">
                        Image enhancement and adaptive preprocessing completed successfully. However, standard open-source Tesseract.js does not contain weights for Santali Ol Chiki (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">sat.traineddata</code>).
                      </p>
                      <p className="text-amber-700 text-[11px]">
                        💡 <strong>Next Step:</strong> Text recognition for Ol Chiki requires integrating a custom trained deep-learning model (e.g. ONNX Runtime Web or LiteRT).
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <textarea
                        value={editableExtractedText}
                        onChange={(e) => setEditableExtractedText(e.target.value)}
                        placeholder={isProcessing ? "Analyzing uploaded image and recognizing text..." : "Uploaded manuscript text will be extracted here. You can also edit or paste text directly."}
                        rows={5}
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-sm leading-relaxed text-slate-800 font-medium outline-none focus:border-[#249144] focus:ring-2 focus:ring-[#249144]/20 transition resize-none"
                      />
                      {editableExtractedText && (
                        <div className="flex justify-between items-center px-2 pt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Edit3 className="w-3 h-3 text-slate-400" /> Editable text
                          </span>
                          <span>{editableExtractedText.split(/\s+/).filter(Boolean).length} words</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Target Translation Box */}
                <div>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-[#249144]" />
                      Target Translation
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">Translate to:</span>
                      <select
                        value={targetLang}
                        onChange={(e) => {
                          const newLang = e.target.value as SupportedLanguage;
                          setTargetLang(newLang);
                          triggerTranslation(editableExtractedText, sourceLang, newLang);
                        }}
                        aria-label="Translate OCR result to language"
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-800 outline-none hover:border-[#249144] transition cursor-pointer"
                      >
                        {SUPPORTED_LANGUAGE_LIST.map(lang => (
                          <option key={lang.id} value={lang.id}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Capability indicator for selected pair */}
                  {sourceLang !== targetLang && (() => {
                    const cap = getCapability(sourceLang, targetLang);
                    const offlineLabel = cap ? getOfflineModeLabel(cap.offlineMode) : 'Unknown';
                    return (
                      <div className="mb-2 flex flex-wrap gap-1.5 items-center text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${
                          cap?.status === 'verified' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                          cap?.status === 'dataset' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                          cap?.status === 'experimental' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                          'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                          {cap?.fullSentence ? '✓ Full Sentence' : '✗ No Full Sentence'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                          {offlineLabel}
                        </span>
                        {cap?.provider && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                            {cap.provider}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 min-h-[120px] shadow-sm text-sm leading-relaxed text-slate-900 font-medium">
                    {isTranslating ? (
                      <div className="flex items-center gap-2 text-emerald-700 animate-pulse py-4">
                        <Sparkles className="w-4 h-4 animate-spin" /> Translating extracted text to {CENTRAL_LANGUAGES[targetLang]?.name}...
                      </div>
                    ) : translationError ? (
                      <div className="space-y-3">
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center gap-2 font-bold text-rose-900">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            <span>✗ Translation Unavailable</span>
                          </div>
                          <p className="text-rose-800 text-[11px] leading-relaxed">{translationError}</p>
                        </div>
                        {/* Vocabulary Assistance panel — separate from sentence translation */}
                        {translationResult?.vocabularyAssistance && translationResult.vocabularyAssistance.length > 0 && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900">
                              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                              Vocabulary Assistance
                              <span className="text-[9px] font-normal text-amber-600 ml-1">(word-level only, not a sentence translation)</span>
                            </div>
                            <div className="grid gap-1">
                              {translationResult.vocabularyAssistance.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                                  <span className="font-bold text-slate-700 capitalize">{item.word}:</span>
                                  <span className="text-amber-900">{item.meaning}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : translatedText ? (
                      sourceLang === targetLang ? (
                        <div className="text-slate-500 italic py-2">
                          ℹ️ No translation required (Source and Target are both {CENTRAL_LANGUAGES[sourceLang]?.name}).
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{translatedText}</p>
                      )
                    ) : (
                      <p className="text-slate-400 italic font-light">
                        {ocrResult?.isCustomModelRequired 
                          ? "Translation will be enabled when text is recognized."
                          : `Automatic translation in ${CENTRAL_LANGUAGES[targetLang]?.name} will appear here.`}
                      </p>
                    )}
                  </div>

                  {/* Translation metadata: reliability, script, method */}
                  {translationResult?.success && translatedText && (() => {
                    const badge = getStatusBadge(translationResult.reliability);
                    return (
                      <div className="mt-2 flex flex-wrap gap-1.5 items-center text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${
                          translationResult.reliability === 'verified' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                          translationResult.reliability === 'dataset' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                          'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          {badge.icon} {badge.label}
                        </span>
                        {translationResult.outputScript && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 font-semibold">
                            Script: {translationResult.outputScript}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold capitalize">
                          Method: {translationResult.method}
                        </span>
                      </div>
                    );
                  })()}

                  {editableExtractedText && !ocrResult?.isCustomModelRequired && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleManualTranslate}
                        disabled={isTranslating}
                        className="px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#14532d] border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Update Translation</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Actions Footer */}
              {translatedText && translatedText !== 'No translation required.' && !translationError && (
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(translatedText, true)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-[#249144] hover:text-[#249144] flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      {copiedTranslation ? <Check className="w-3.5 h-3.5 text-[#249144]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTranslation ? 'Copied!' : 'Copy Translation'}</span>
                    </button>
                    <button
                      onClick={() => playTextSpeech(translatedText, targetLang)}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#249144] hover:border-emerald-300 shadow-xs transition cursor-pointer"
                      title="Listen to translation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {translationProvider && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {translationProvider}
                    </span>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>

        {/* OCR DIAGNOSTICS & MULTI-SCRIPT BENCHMARKING MODAL */}
        {showDebug && (
          <div className="bg-white rounded-3xl border border-slate-300 shadow-lg p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Bug className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">OCR Diagnostic & Multi-Script Benchmarking Console</h3>
                  <p className="text-xs text-slate-500">Live pipeline telemetry, ground-truth accuracy (CER/WER), and script capability matrix</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunStrategyBenchmark}
                  disabled={isBenchmarking}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Run strategy benchmark on the active image"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Strategy Benchmark</span>
                </button>

                <button
                  onClick={handleRunMultiScriptSuite}
                  disabled={isBenchmarking}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Run full multi-script benchmark across English, Hindi, Mixed, Shadows, and Ol Chiki"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Multi-Script Suite</span>
                </button>

                <button
                  onClick={() => setShowDebug(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* 1. Active Scan Pipeline Telemetry */}
            {ocrResult?.debugInfo && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-emerald-600" /> Active Scan Telemetry
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase">Dimensions</span>
                    <span className="font-bold text-slate-800">
                      {ocrResult.debugInfo.originalDimensions.width} × {ocrResult.debugInfo.originalDimensions.height} px
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase">Selected Script</span>
                    <span className="font-bold text-slate-800">
                      {activeCapability.label}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase">Model Status</span>
                    <span className={`font-bold ${activeCapability.isSupported ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {activeCapability.modelStatus} ({activeCapability.engine})
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase">Processing Time</span>
                    <span className="font-bold text-slate-800">
                      {(ocrResult.debugInfo.processingTimeMs / 1000).toFixed(2)}s
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase">Strategy Selected</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {ocrResult.debugInfo.selectedStrategy}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase">Tesseract Confidence</span>
                    <span className={`font-bold ${ocrResult.confidence >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {ocrResult.confidence}% (Engine Estimate)
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase">True Ground-Truth CER</span>
                    <span className="font-bold text-slate-800">
                      {ocrResult.debugInfo.cer !== undefined ? `${ocrResult.debugInfo.cer} (${ocrResult.debugInfo.accuracyPercent}% Acc)` : 'No Ground Truth'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="block text-slate-400 text-[10px] font-bold uppercase">True Ground-Truth WER</span>
                    <span className="font-bold text-slate-800">
                      {ocrResult.debugInfo.wer !== undefined ? `${ocrResult.debugInfo.wer}` : 'No Ground Truth'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SCRIPT CAPABILITY MATRIX */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" /> Bhasha Setu Script Capability Matrix
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Script / Language</th>
                      <th className="p-2.5">OCR Engine</th>
                      <th className="p-2.5">Model Installed</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Limitations & Technical Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {Object.values(SCRIPT_CAPABILITY_MATRIX).map((cap, i) => (
                      <tr key={i} className={cap.isSupported ? 'bg-white' : 'bg-amber-50/50'}>
                        <td className="p-2.5 font-bold text-slate-900">{cap.label}</td>
                        <td className="p-2.5 text-slate-700">{cap.engine}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">{cap.modelName}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            cap.isSupported ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {cap.isSupported ? '✓ Supported' : '⚠ Custom Model Req'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 text-[11px] max-w-sm">{cap.limitations}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. MULTI-SCRIPT BENCHMARK SUITE REPORT */}
            {multiScriptReport && (
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600" /> Multi-Script Benchmark Suite Results
                  </h4>
                  <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {multiScriptReport.totalTests} Category Tests Executed
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-blue-50/60 p-2.5 rounded-xl border border-blue-200">
                  {multiScriptReport.summary}
                </p>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Test Case</th>
                        <th className="p-2.5">Model</th>
                        <th className="p-2.5">Engine Conf</th>
                        <th className="p-2.5">Ground-Truth CER</th>
                        <th className="p-2.5">Ground-Truth Accuracy</th>
                        <th className="p-2.5">Time</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {multiScriptReport.items.map((it, i) => (
                        <tr key={i} className={it.status === 'Supported' ? 'bg-white' : 'bg-amber-50/70'}>
                          <td className="p-2.5 font-bold text-slate-900">{it.testName}</td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-600">{it.modelUsed}</td>
                          <td className="p-2.5 font-bold text-slate-800">{it.engineConfidence ? `${it.engineConfidence}%` : 'N/A'}</td>
                          <td className="p-2.5 font-mono text-slate-700">{it.cer !== undefined && it.engineConfidence > 0 ? it.cer : 'N/A'}</td>
                          <td className="p-2.5">
                            {it.engineConfidence > 0 ? (
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                it.accuracyPercent >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {it.accuracyPercent}%
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Model Required</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-500">{it.processingTimeMs ? `${it.processingTimeMs}ms` : '0ms'}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              it.status === 'Supported' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {it.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600 text-[11px] max-w-xs">{it.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Single Image Strategy Benchmark Table */}
            {benchmarkReport && (
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-amber-600" /> Active Image Preprocessing Benchmark
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Best: {benchmarkReport.bestStrategy} ({benchmarkReport.bestConfidence}%)
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Strategy</th>
                        <th className="p-2.5">Confidence</th>
                        <th className="p-2.5">Characters</th>
                        <th className="p-2.5">Time</th>
                        <th className="p-2.5">Extracted Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {benchmarkReport.strategyResults.map((r, i) => (
                        <tr key={i} className={r.strategy === benchmarkReport.bestStrategy ? 'bg-emerald-50/70 font-semibold' : ''}>
                          <td className="p-2.5 font-bold text-slate-900">{r.strategy}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              r.confidence >= 80 ? 'bg-emerald-100 text-emerald-800' :
                              r.confidence >= 60 ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {r.confidence}%
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-700">{r.charCount}</td>
                          <td className="p-2.5 text-slate-500">{r.timeMs}ms</td>
                          <td className="p-2.5 text-slate-600 font-mono text-[10px] truncate max-w-xs" title={r.textPreview}>
                            {r.textPreview || '<None>'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Supported Formats Banner */}
        <div className="mt-8 flex items-center gap-2 flex-wrap justify-center text-center">
          <span className="text-xs text-slate-400 font-medium mr-1">Supported Scripts & Formats:</span>
          {['English (Latin)', 'Hindi (Devanagari)', 'Bilingual (Eng+Hin)', 'Blackboard Chalk', 'Camera Snapshots', 'Ol Chiki (Model Req)', 'Warang Chiti (Model Req)'].map((fmt, i) => (
            <span key={i} className="text-xs px-3 py-1 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs font-medium">
              {fmt}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
};
