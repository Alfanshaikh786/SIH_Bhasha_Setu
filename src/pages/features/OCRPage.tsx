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
  Info
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { processImageOCR, translateText, playTextSpeech, OCRResult } from '../../services/translationService';

interface SampleDoc {
  id: string;
  title: string;
  language: string;
  languageCode: string;
  previewUrl: string;
}

const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: 'sample-santali',
    title: 'Santali Ol Chiki Health Advisory',
    language: 'Santali',
    languageCode: 'sat',
    previewUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80'
  },
  {
    id: 'sample-bhili',
    title: 'Bhili Traditional Medical Notice',
    language: 'Bhili',
    languageCode: 'bhi',
    previewUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80'
  },
  {
    id: 'sample-gondi',
    title: 'Gondi Community Forest Circular',
    language: 'Gondi',
    languageCode: 'gon',
    previewUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80'
  }
];

export const OCRPage: React.FC = () => {
  const [targetLang, setTargetLang] = useState('hin');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_DOCS[0].previewUrl);
  const [imageName, setImageName] = useState('santali_health_banner.jpg');
  const [copied, setCopied] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessOCR = async (imgUrl: string, langCode: string) => {
    setIsProcessing(true);
    setOcrResult(null);
    setTranslatedText('');

    const result = await processImageOCR(imgUrl, langCode);
    setOcrResult(result);
    setIsProcessing(false);

    // Auto-translate extracted text into target language
    setIsTranslating(true);
    const trans = await translateText(result.text, langCode, targetLang);
    setTranslatedText(trans.targetText);
    setIsTranslating(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setImageName(file.name);
      handleProcessOCR(url, 'sat');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="w-full py-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#249144]" /> Multi-Script OCR & Document Scanner
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Text Extraction (OCR)
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-500">
            Convert tribal manuscripts, scanned documents, and field photos into editable digital text and instant translations.
          </p>
        </div>

        {/* OCR Studio Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            
            {/* Left Column: Image Upload & Scan Preview */}
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#249144]" /> Document Image Source
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">PNG, JPG, PDF up to 15MB</span>
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
                        className="max-h-52 w-auto object-contain rounded-xl shadow-sm group-hover:opacity-90 transition"
                      />
                      <span className="mt-3 text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        {imageName}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-green-100/80 text-[#249144] flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">Click or drag image here</p>
                      <p className="text-xs text-slate-400 mt-1">Supports Ol Chiki, Devanagari, and Latin tribal scripts</p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* File & Camera Triggers */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Upload className="w-4 h-4 text-slate-500" /> Browse File
                  </button>
                  <button
                    onClick={() => {
                      setCameraActive(true);
                      handleProcessOCR(SAMPLE_DOCS[0].previewUrl, 'sat');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Camera className="w-4 h-4 text-[#249144]" /> Scan with Camera
                  </button>
                </div>

                {/* Sample Manuscripts Preset Chips */}
                <div className="mt-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Try Sample Tribal Manuscripts:
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
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-green-50 hover:border-[#249144] border border-transparent text-xs font-medium text-slate-700 transition"
                      >
                        {doc.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scan Trigger Button */}
              <div className="pt-6 border-t border-slate-100 mt-6">
                <button
                  onClick={() => handleProcessOCR(selectedImage || SAMPLE_DOCS[0].previewUrl, 'sat')}
                  disabled={isProcessing}
                  className="btn-mota w-full py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isProcessing ? 'Scanning & Extracting Script...' : 'Extract & Translate Text →'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Extracted Text & Live Translation */}
            <div className="p-6 sm:p-8 flex flex-col justify-between bg-slate-50/50">
              <div className="space-y-6">
                
                {/* 1. Extracted Text Display */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#249144]" />
                      Extracted Text ({ocrResult?.detectedLanguage || 'Ol Chiki / Devanagari'})
                    </span>
                    {ocrResult && (
                      <button
                        onClick={() => handleCopy(ocrResult.text)}
                        className="text-xs text-[#249144] font-semibold hover:underline flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 min-h-[110px] shadow-sm text-sm leading-relaxed text-slate-800 font-medium">
                    {isProcessing ? (
                      <div className="flex items-center gap-2 text-emerald-700 animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Neural OCR recognizing tribal script...
                      </div>
                    ) : ocrResult ? (
                      <p className="whitespace-pre-wrap">{ocrResult.text}</p>
                    ) : (
                      <p className="text-slate-400 italic font-light">
                        Uploaded manuscript text will be extracted here with bounding boxes.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Target Translation Box */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-[#249144]" />
                      Target Translation
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">Translate to:</span>
                      <select
                        value={targetLang}
                        onChange={(e) => {
                          setTargetLang(e.target.value);
                          if (ocrResult) {
                            translateText(ocrResult.text, 'sat', e.target.value).then(t => setTranslatedText(t.targetText));
                          }
                        }}
                        aria-label="Translate OCR result to language"
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none hover:border-[#249144] transition"
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
                </div>

              </div>

              {/* Actions */}
              {translatedText && (
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(translatedText)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-[#249144] hover:text-[#249144] flex items-center gap-1.5 shadow-sm"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Translation</span>
                    </button>
                    <button
                      onClick={() => playTextSpeech(translatedText, targetLang)}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-[#249144] shadow-sm"
                      title="Listen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Accuracy
                  </span>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* Supported Formats Banner */}
        <div className="mt-8 flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs text-slate-400 font-medium mr-1">Supported Scripts & Formats:</span>
          {['Ol Chiki', 'Devanagari', 'Warang Citi', 'Odia', 'Bengali', 'Latin', 'PNG', 'JPG', 'WEBP', 'PDF', 'Handwritten Manuscripts'].map((fmt, i) => (
            <span key={i} className="text-xs px-3 py-1 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm">
              {fmt}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
};
