import React from 'react';
import { ArrowLeftRight, Mic, Sparkles } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-16 lg:py-24 px-6 sm:px-8 lg:px-12 bg-[#f5fbf5]/60 border-y border-[#d1ead4]/60">
      {/* Section Header */}
      <div className="w-full py-8 px-4 flex flex-col items-center text-center">
        <h2 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900 max-w-5xl">
          How It Works
        </h2>
        <div className="relative mt-4 sm:mt-5 w-32 sm:w-48 md:w-64 h-[2px] bg-slate-200">
          <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 sm:w-20 bg-[#86c498] rounded-full"></div>
        </div>
        <p className="mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-slate-500">
          Experience the simplicity of our AI contributor and translation platform in just 3 easy steps.
        </p>
      </div>

      <div className="relative mx-auto max-w-6xl mt-8">
        {/* Curved connecting SVG path for large screens */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block" style={{ height: '176px' }}>
          <svg className="w-full h-full" viewBox="0 0 1000 176" fill="none" preserveAspectRatio="none">
            <path d="M 180 88 Q 340 -10, 500 88 T 820 88" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 8" />
          </svg>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 relative z-10">
          
          {/* Step 1: Choose Your Languages */}
          <div className="flex flex-col items-center text-center px-4 relative">
            <div className="mb-6 w-full flex justify-center">
              <div className="relative w-full h-44 flex items-center justify-center select-none">
                <div className="w-52 h-32 bg-white border border-slate-200/80 rounded-2xl shadow-md p-3 flex flex-col justify-center gap-2 relative">
                  <div className="bg-[#249144] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center justify-between w-32 shadow-sm absolute top-3 left-3">
                    <span>English</span>
                    <span className="opacity-70 text-[9px]">EN</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white border border-slate-200 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center justify-between w-32 shadow-md">
                    <span>Santali</span>
                    <span className="text-slate-400 text-[9px]">SNT</span>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-[2.5px] border-[#249144] flex items-center justify-center z-10 shadow-sm">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#249144]" />
                  </div>
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-[#249144] uppercase tracking-wider mb-1">Step 01</span>
            <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Choose Your Languages</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Select your source and target languages. We support bidirectional translation to Santali, Gondi, Bhili, Mundari, Kui, and more.
            </p>
          </div>

          {/* Step 2: Input Your Content */}
          <div className="flex flex-col items-center text-center px-4 relative">
            <div className="mb-6 w-full flex justify-center">
              <div className="relative w-full h-44 flex items-center justify-center select-none">
                <div className="w-52 h-32 bg-white border border-slate-200/80 rounded-2xl shadow-md p-3 flex flex-col gap-2 relative justify-center">
                  <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
                  <div className="w-full h-11 bg-slate-50 border border-slate-200/60 rounded-xl p-2 flex items-center gap-2">
                    <div className="w-0.5 h-4 bg-[#249144] animate-pulse"></div>
                    <div className="w-28 h-2 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="absolute -bottom-2 -left-2 bg-[#249144] text-white rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-white text-[#249144] flex items-center justify-center">
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div className="w-0.5 h-2 bg-white/60 rounded animate-pulse"></div>
                      <div className="w-0.5 h-4 bg-white rounded animate-pulse"></div>
                      <div className="w-0.5 h-1.5 bg-white/60 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-[#249144] uppercase tracking-wider mb-1">Step 02</span>
            <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Input Your Content</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Type text, speak using your microphone, or upload document scans. Our multi-modal AI handles text, speech, and OCR effortlessly.
            </p>
          </div>

          {/* Step 3: Get Instant Translation */}
          <div className="flex flex-col items-center text-center px-4 relative">
            <div className="mb-6 w-full flex justify-center">
              <div className="relative w-full h-44 flex items-center justify-center select-none">
                <div className="w-52 h-32 bg-gradient-to-br from-[#249144] to-[#14532d] rounded-2xl shadow-lg p-3.5 flex flex-col justify-between relative text-white">
                  <div className="space-y-1.5">
                    <div className="w-16 h-1.5 bg-white/40 rounded-full"></div>
                    <div className="w-32 h-1.5 bg-white/40 rounded-full"></div>
                  </div>
                  <div className="border-t border-white/20 my-1"></div>
                  <div className="space-y-2">
                    <div className="w-36 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="w-24 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute -top-3 -left-3 bg-white border border-slate-100 rounded-xl shadow-md px-3 py-1 text-[10px] font-bold text-[#249144] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#249144]" /> Translated
                  </div>
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-[#249144] uppercase tracking-wider mb-1">Step 03</span>
            <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Get Instant Translation</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Receive high-precision translations in real time. Listen to authentic pronunciations or copy and export subtitles instantly.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
