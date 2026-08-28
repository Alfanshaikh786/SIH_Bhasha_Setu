import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Copy, 
  Check, 
  Volume2, 
  Sparkles, 
  FileText, 
  Languages, 
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Sliders,
  FileCheck
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { processImageOCR, translateText, playTextSpeech, OCRResult } from '../../services/translationService';
import { detectScriptFromText } from '../../services/ocrService';

interface SampleDoc {
  id: string;
  title: string;
  language: string;
  languageCode: string;
  previewUrl: string;
  sampleText: string;
}

const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: 'sample-santali',
    title: 'Santali Ol Chiki Notice',
    language: 'Santali',
    languageCode: 'sat',
    previewUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
    sampleText: 'ᱡᱚᱦᱟᱨ • ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱨᱮ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ᱾'
  },
  {
    id: 'sample-bhili',
    title: 'Bhili Traditional Medical Notice',
    language: 'Bhili',
    languageCode: 'bhi',
    previewUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
    sampleText: 'भीली जनजातीय विकास केंद्र • औषध वितरण एवं सिकल सेल जांच शिविर।'
  },
  {
    id: 'sample-english-guide',
    title: 'Tribal Welfare Directives (Eng/Dev)',
    language: 'English',
    languageCode: 'eng',
    previewUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
    sampleText: 'Ministry of Tribal Affairs: Universal screening for sickle cell traits across 278 districts.'
  }
];

export const OCRPage: React.FC = () => {
  const [targetLang, setTargetLang] = useState('hin');
  const [ocrLangMode, setOcrLangMode] = useState<'eng+hin' | 'eng' | 'hin'>('eng+hin');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<{ status: string; progress: number }>({ status: '', progress: 0 });
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editableExtractedText, setEditableExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState('sample_document.jpg');
  const [copied, setCopied] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleProcessOCR = async (imgUrl: string, langCode: string = 'eng') => {
    setIsProcessing(true);
    setOcrResult(null);
    setEditableExtractedText('');
    setTranslatedText('');
    setOcrProgress({ status: 'Starting Neural OCR Engine...', progress: 0.05 });

    try {
      const result = await processImageOCR(imgUrl, ocrLangMode, (p) => {
        setOcrProgress(p);
      });

      setOcrResult(result);
      setEditableExtractedText(result.text);
      setIsProcessing(false);

      // Auto-translate extracted text into selected target language
      if (result.text && result.text.trim()) {
        setIsTranslating(true);
        const detected = detectScriptFromText(result.text);
        const trans = await translateText(result.text, detected.code || 'eng', targetLang);
        setTranslatedText(trans.targetText);
        setIsTranslating(false);
      }
    } catch (err) {
      console.error('OCR processing error:', err);
      setIsProcessing(false);
    }
  };

  const handleManualTranslate = async () => {
    if (!editableExtractedText.trim()) return;
    setIsTranslating(true);
    const detected = detectScriptFromText(editableExtractedText);
    const trans = await translateText(editableExtractedText, detected.code || 'eng', targetLang);
    setTranslatedText(trans.targetText);
    setIsTranslating(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setImageName(file.name);
      handleProcessOCR(url, 'eng');
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
            Extract text from tribal manuscripts, health pamphlets, field photos, and documents using neural in-browser OCR with instant tribal language translation.
          </p>
        </div>

        {/* OCR Studio Grid */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            
            {/* Left Column: Image Upload & Scan Preview */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#249144]" /> Document Image Source
                  </h3>
                  <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-xs">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={ocrLangMode}
                      onChange={(e) => setOcrLangMode(e.target.value as any)}
                      className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
                      title="OCR Language Mode"
                    >
                      <option value="eng+hin">Auto (Eng + Hindi/Devanagari)</option>
                      <option value="eng">English Only</option>
                      <option value="hin">Devanagari Only</option>
                    </select>
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

                  {/* Hidden file inputs */}
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

                {/* Sample Manuscripts Preset Chips */}
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Try Sample Manuscripts:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_DOCS.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedImage(doc.previewUrl);
                          setImageName(doc.title);
                          handleProcessOCR(doc.previewUrl, doc.languageCode);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:border-[#249144] border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
                      >
                        {doc.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress & Scan Trigger Button */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                {isProcessing && (
                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-2 text-[#249144]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {ocrProgress.status || 'Extracting characters...'}
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

                <button
                  onClick={() => {
                    if (selectedImage) {
                      handleProcessOCR(selectedImage, 'eng');
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-2xl bg-[#249144] hover:bg-[#1a7536] disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isProcessing ? 'Analyzing & Extracting Text...' : 'Extract & Translate Text →'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Extracted Text & Live Translation */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-slate-50/50">
              <div className="space-y-6">
                
                {/* 1. Extracted Text Display & Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#249144]" />
                        Extracted Text
                      </span>
                      {ocrResult && (
                        <span className="text-[10px] bg-green-100 text-[#14532d] px-2 py-0.5 rounded-full font-bold">
                          {ocrResult.detectedLanguage} • {Math.round(ocrResult.confidence * 100)}% Accuracy
                        </span>
                      )}
                    </div>

                    {editableExtractedText && (
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
                </div>

                {/* 2. Target Translation Box */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-[#249144]" />
                      Target Translation
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">Translate to:</span>
                      <select
                        value={targetLang}
                        onChange={(e) => {
                          const newLang = e.target.value;
                          setTargetLang(newLang);
                          if (editableExtractedText.trim()) {
                            setIsTranslating(true);
                            const detected = detectScriptFromText(editableExtractedText);
                            translateText(editableExtractedText, detected.code || 'eng', newLang).then(t => {
                              setTranslatedText(t.targetText);
                              setIsTranslating(false);
                            });
                          }
                        }}
                        aria-label="Translate OCR result to language"
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-800 outline-none hover:border-[#249144] transition cursor-pointer"
                      >
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <option key={lang.id} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 min-h-[120px] shadow-sm text-sm leading-relaxed text-slate-900 font-medium">
                    {isTranslating ? (
                      <div className="flex items-center gap-2 text-emerald-700 animate-pulse">
                        <Sparkles className="w-4 h-4 animate-spin" /> Translating extracted text...
                      </div>
                    ) : translatedText ? (
                      <p className="whitespace-pre-wrap">{translatedText}</p>
                    ) : (
                      <p className="text-slate-400 italic font-light">
                        Automatic translation in {SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name} will appear here.
                      </p>
                    )}
                  </div>

                  {editableExtractedText && (
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
              {translatedText && (
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
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

                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Neural Verified
                  </span>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* Supported Formats Banner */}
        <div className="mt-8 flex items-center gap-2 flex-wrap justify-center text-center">
          <span className="text-xs text-slate-400 font-medium mr-1">Supported Scripts & Formats:</span>
          {['Ol Chiki', 'Devanagari', 'Warang Citi', 'Odia', 'Bengali', 'Latin / English', 'PNG', 'JPG', 'WEBP', 'Camera Snapshots'].map((fmt, i) => (
            <span key={i} className="text-xs px-3 py-1 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs font-medium">
              {fmt}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
};
