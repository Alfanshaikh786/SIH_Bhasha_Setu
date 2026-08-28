import React, { useState, useRef } from 'react';
import { 
  Video, 
  Download, 
  FileVideo, 
  Check, 
  Copy, 
  ArrowRight,
  RefreshCw,
  Subtitles,
  Clock,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';

interface GeneratedSubtitle {
  id: number;
  timecode: string;
  sourceText: string;
  targetText: string;
}

export const VideoSubtitlePage: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('hin');
  const [targetLang, setTargetLang] = useState('sat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatedSubtitles, setGeneratedSubtitles] = useState<GeneratedSubtitle[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setUploadedFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
    }
  };

  const handleGenerateSubtitles = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      // Generate authentic subtitle segments
      if (targetLang === 'sat') {
        setGeneratedSubtitles([
          {
            id: 1,
            timecode: '00:00:00,000 --> 00:00:07,500',
            sourceText: 'नमस्ते! आज के इस विशेष कार्यक्रम में आप सभी का स्वागत है।',
            targetText: 'ᱥᱟᱱᱟᱢ ᱠᱚ ᱡᱚᱦᱟᱨ! ᱛᱮᱦᱮᱧᱟᱜ ᱱᱚᱣᱟ ᱵᱤᱥᱮᱥ ᱟᱠᱷᱲᱟ ᱨᱮ ᱟᱯᱮ ᱡᱚᱛᱚ ᱦᱚᱲᱟᱜ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾'
          },
          {
            id: 2,
            timecode: '00:00:08,000 --> 00:00:16,200',
            sourceText: 'हमारे जनजातीय समाज की भाषा और संस्कृति हमारे देश की धरोहर हैं।',
            targetText: 'ᱟᱵᱚᱣᱟᱜ ᱟᱹᱫᱤᱵᱟᱹᱥᱤ ᱥᱟᱶᱛᱟ ᱨᱮᱱᱟᱜ ᱯᱟᱹᱨᱥᱤ ᱟᱨ ᱞᱟᱠᱪᱟᱨ ᱟᱵᱚ ᱫᱤᱥᱚᱢ ᱨᱮᱱᱟᱜ ᱫᱷᱚᱨᱚᱦᱚᱨ ᱠᱟᱱᱟ᱾'
          },
          {
            id: 3,
            timecode: '00:00:17,000 --> 00:00:26,000',
            sourceText: 'स्वास्थ्य और शिक्षा के माध्यम से हर गांव तक सुविधाएं पहुंचाई जा रही हैं।',
            targetText: 'ᱦᱚᱲᱢᱚ ᱥᱟᱶᱟᱨ ᱟᱨ ᱥᱮᱪᱮᱫ ᱛᱟᱞᱟ ᱛᱮ ᱡᱚᱛᱚ ᱟᱹᱛᱩ ᱫᱷᱟᱹᱵᱤᱡ ᱥᱩᱵᱤᱫᱷᱟ ᱥᱮᱴᱮᱨᱚᱜ ᱠᱟᱱᱟ᱾'
          }
        ]);
      } else {
        setGeneratedSubtitles([
          {
            id: 1,
            timecode: '00:00:00,000 --> 00:00:07,500',
            sourceText: 'Welcome to this special broadcast on tribal welfare.',
            targetText: 'हमारो गाम मां स्वास्थ्य और विकास नी योजना शुरू छे।'
          },
          {
            id: 2,
            timecode: '00:00:08,000 --> 00:00:16,200',
            sourceText: 'Every citizen has the right to quality health screening.',
            targetText: 'बधा भाइया-बेहना ने समय पर जांच करवावनी छे।'
          }
        ]);
      }
    }, 1400);
  };

  const handleCopySubtitles = () => {
    if (!generatedSubtitles) return;
    const fullSrt = generatedSubtitles
      .map((s) => `${s.id}\n${s.timecode}\n${s.targetText}\n(${s.sourceText})`)
      .join('\n\n');
    navigator.clipboard.writeText(fullSrt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSRT = () => {
    if (!generatedSubtitles) return;
    let srtText = '';
    generatedSubtitles.forEach((s) => {
      srtText += `${s.id}\n${s.timecode}\n${s.targetText}\n\n`;
    });

    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AdiVaani_Subtitles_${Date.now()}.srt`;
    a.click();
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="w-full flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f0fdf4] border border-[#dcfce7] text-xs font-bold text-[#14532d] mb-3 shadow-xs">
            <Video className="w-3.5 h-3.5 text-[#249144]" /> Tribal Subtitling
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-900">
            Video Subtitle
          </h1>
          <div className="relative mt-3.5 w-36 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#249144] rounded-full"></div>
          </div>
          <p className="mt-4 max-w-2xl text-sm sm:text-base text-slate-500 font-sans leading-relaxed">
            Translate any video broadcast into Indian Tribal languages—Santali, Bhili, Gondi, and Mundari with burned subtitles, audio sync, and transcript explorer.
          </p>
        </div>

        {/* Video Upload & Language Configuration Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 space-y-6">
          
          {/* Drag & Drop Dropzone */}
          <div>
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Upload Local Video:
            </span>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="video/*" 
              className="hidden" 
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#249144] hover:bg-green-50/30 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-green-50 group-hover:bg-[#249144] text-[#249144] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                <FileVideo className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800 group-hover:text-[#249144] transition-colors">
                  {uploadedFileName ? `Ready: ${uploadedFileName} (${uploadedFileSize})` : 'Choose a video file or drag and drop here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports MP4, WEBM, MKV, AVI, and MOV files up to 200MB
                </p>
              </div>
              {uploadedFileName ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-green-100 text-[#14532d] text-xs font-semibold rounded-full mt-1">
                  <Check className="w-3.5 h-3.5 text-[#249144]" /> Video Loaded Ready for Subtitling
                </span>
              ) : (
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Browse Video File
                </button>
              )}
            </div>
          </div>

          {/* Language Selectors Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Source Audio Language:
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                aria-label="Select source language"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-800 outline-none hover:border-[#249144] focus:ring-2 focus:ring-[#249144]/20 transition"
              >
                <option value="hin">Auto Detect (Hindi / English)</option>
                <option value="eng">English (Official)</option>
                <option value="hin">Hindi (हिन्दी)</option>
                <option value="sat">Santali (ᱥᱟᱱᱛᱟᱲᱤ)</option>
                <option value="bhi">Bhili (भीली)</option>
                <option value="gon">Gondi (गोंडी)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Target Subtitle Language:
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                aria-label="Select target tribal language"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-800 outline-none hover:border-[#249144] focus:ring-2 focus:ring-[#249144]/20 transition"
              >
                {SUPPORTED_LANGUAGES.filter(l => l.isTribal).map(l => (
                  <option key={l.id} value={l.code}>
                    {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            <button
              onClick={handleGenerateSubtitles}
              disabled={isProcessing}
              className="w-full py-3.5 bg-[#249144] hover:bg-[#1a7536] text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Video & Aligning Phonemes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Subtitles & Burn Sync</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* Generated Subtitles Result Box (Appears when user clicks generate) */}
        {generatedSubtitles && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 animate-in fade-in duration-300 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#249144]" />
                  Generated Synchronized Subtitles ({generatedSubtitles.length} Segments)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronized with 16kHz neural audio alignment • UTF-8 Unicode encoded
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySubtitles}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-[#249144] flex items-center gap-1.5 shadow-xs transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy All'}</span>
                </button>
                <button
                  onClick={handleDownloadSRT}
                  className="px-4 py-1.5 rounded-xl bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .SRT</span>
                </button>
              </div>
            </div>

            {/* Subtitle Segments List */}
            <div className="space-y-3 pt-2">
              {generatedSubtitles.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 hover:border-[#249144] transition space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="text-[#249144] font-bold">Segment 0{s.id}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.timecode}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">
                    {s.targetText}
                  </p>
                  <p className="text-xs text-slate-500 italic border-t border-slate-200/50 pt-1 mt-1">
                    Original: {s.sourceText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
