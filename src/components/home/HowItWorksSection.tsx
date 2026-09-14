import React from 'react';
import { 
  ArrowLeftRight, 
  Mic, 
  Globe, 
  Volume2, 
  Copy, 
  Download, 
  FileText, 
  Upload, 
  Image as ImageIcon,
  Sparkles 
} from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#fcfbf7] border-t border-[#ede7dc] relative overflow-hidden">
      
      {/* Decorative Botanical Foliage in Background */}
      <div className="absolute top-12 -right-8 w-56 h-56 pointer-events-none opacity-35 select-none -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path d="M 140 140 Q 180 80, 160 20 Q 110 60, 140 140 Z" fill="#8ca68c" />
          <path d="M 120 120 Q 150 60, 100 20 Q 90 80, 120 120 Z" fill="#658865" />
          <circle cx="60" cy="80" r="3" fill="#658865" />
        </svg>
      </div>

      <div className="absolute bottom-12 -left-8 w-56 h-56 pointer-events-none opacity-35 select-none -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path d="M 60 140 Q 20 80, 40 20 Q 90 60, 60 140 Z" fill="#8ca68c" />
          <path d="M 80 120 Q 50 60, 100 20 Q 110 80, 80 120 Z" fill="#658865" />
          <circle cx="140" cy="80" r="3" fill="#658865" />
        </svg>
      </div>

      {/* Floating Cursive Stickers on Top Margins (UI5.png) */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-4 px-4 select-none">
        
        {/* Top Left: "Simple Steps Real Change" Sticker */}
        <div className="hidden sm:flex flex-col items-start -rotate-6">
          <div className="relative bg-[#f4ecd8] border border-[#e8dcbe] rounded-2xl px-4 py-2 shadow-xs flex flex-col items-center">
            {/* Sun rays above sticker */}
            <div className="absolute -top-3 -left-2 flex gap-1">
              <div className="w-1 h-2.5 bg-[#c5a874] rounded-full -rotate-45" />
              <div className="w-1 h-3 bg-[#c5a874] rounded-full" />
              <div className="w-1 h-2.5 bg-[#c5a874] rounded-full rotate-45" />
            </div>
            <span className="font-handwriting text-xl text-[#52391e] font-bold leading-tight text-center">
              Simple Steps<br />Real Change
            </span>
          </div>
        </div>

        {/* Top Right: "From Voices to Opportunities" */}
        <div className="hidden sm:flex flex-col items-end rotate-6">
          <span className="font-handwriting text-2xl text-[#6b4e2e] font-semibold text-right leading-tight">
            From<br />Voices to Opportunities
          </span>
          <svg viewBox="0 0 80 8" className="w-20 h-2 mt-0.5">
            <path d="M 5 4 Q 40 7, 75 3" fill="none" stroke="#c5a874" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

      </div>

      {/* Section Header (UI5.png) */}
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center mb-12 sm:mb-16 relative z-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1e293b] tracking-tight" style={{ fontFamily: "'Domine', Georgia, serif" }}>
          How It <span className="text-[#1b5e3b]">Works</span>
        </h2>
        
        {/* Green Bar Accent */}
        <div className="mt-3.5 w-16 sm:w-20 h-[3px] bg-[#1b5e3b] rounded-full" />

        <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-500 max-w-xl font-sans">
          Experience the simplicity of our AI contributor and translation platform in just 3 easy steps.
        </p>
      </div>

      <div className="relative mx-auto max-w-6xl">
        
        {/* Connecting Dotted Curved Path for Large Screens (UI5.png) */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block" style={{ height: '220px' }}>
          <svg className="w-full h-full" viewBox="0 0 1000 220" fill="none" preserveAspectRatio="none">
            <path d="M 230 110 Q 365 30, 500 110 T 770 110" stroke="#8ca68c" strokeWidth="2" strokeDasharray="6 8" opacity="0.6" />
          </svg>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 relative z-10">
          
          {/* STEP 01: Choose Your Languages */}
          <div className="flex flex-col items-center text-center px-4 relative group">
            
            {/* Visual Box */}
            <div className="mb-6 w-full flex justify-center">
              <div className="relative w-full max-w-[280px] h-48 flex items-center justify-center select-none">
                
                {/* Floating Globe Disc with Leaves (Top Left) */}
                <div className="absolute -top-1 left-2 z-20 flex items-center">
                  <div className="w-11 h-11 rounded-full bg-[#f4ecd8] border border-[#e8dcbe] flex items-center justify-center shadow-xs">
                    <Globe className="w-5 h-5 text-[#1b5e3b]" />
                  </div>
                  <div className="absolute -left-2 -bottom-1 w-6 h-6 pointer-events-none">
                    <svg viewBox="0 0 30 30" className="w-full h-full">
                      <path d="M 20 20 Q 5 15, 2 5 Q 15 8, 20 20" fill="#587d60" />
                    </svg>
                  </div>
                </div>

                {/* Card Container */}
                <div className="w-60 h-36 bg-[#faf8f4] border border-[#eae3d5] rounded-2xl shadow-sm p-3.5 flex flex-col justify-center gap-2.5 relative">
                  
                  {/* English Selector (Dark Green) */}
                  <div className="bg-[#1b5e3b] text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center justify-between shadow-xs">
                    <span>English</span>
                    <span className="text-emerald-200 text-[10px] font-mono flex items-center gap-1">EN ▾</span>
                  </div>

                  {/* Circular Swap Icon */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#faf8f4] border-2 border-[#1b5e3b] flex items-center justify-center z-10 shadow-xs">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#1b5e3b]" />
                  </div>

                  {/* Santali Selector (White) */}
                  <div className="bg-white border border-[#eae3d5] text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center justify-between shadow-2xs">
                    <span>Santali</span>
                    <span className="text-slate-400 text-[10px] font-mono flex items-center gap-1">SNT ▾</span>
                  </div>

                </div>

                {/* Botanical leaf on right */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 pointer-events-none">
                  <svg viewBox="0 0 30 30" className="w-full h-full">
                    <path d="M 10 25 Q 15 10, 28 5 Q 20 18, 10 25" fill="#698e71" />
                  </svg>
                </div>

              </div>
            </div>

            {/* Pill Badge */}
            <span className="text-[11px] font-bold text-[#1b5e3b] bg-[#e4efe6] px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              STEP 01
            </span>

            {/* Title & Description */}
            <h3 className="text-xl font-bold text-[#1e293b] mb-2 tracking-tight">
              Choose Your Languages
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs font-sans">
              Select your source and target languages. We support bidirectional translation to Santali, Gondi, Bhili, Mundari, Kui, and more.
            </p>
          </div>

          {/* STEP 02: Input Your Content */}
          <div className="flex flex-col items-center text-center px-4 relative group">
            
            {/* Visual Box */}
            <div className="mb-6 w-full flex justify-center">
              <div className="relative w-full max-w-[280px] h-48 flex items-center justify-center select-none">
                
                {/* Floating Mic Disc with Waveform (Bottom Left) */}
                <div className="absolute -bottom-2 -left-2 z-20 flex items-center gap-1.5">
                  <div className="w-11 h-11 rounded-full bg-[#f4ecd8] border border-[#e8dcbe] flex items-center justify-center shadow-xs">
                    <Mic className="w-5 h-5 text-[#1b5e3b]" />
                  </div>
                  {/* Waveform bars */}
                  <div className="flex items-center gap-0.5">
                    <div className="w-0.5 h-3 bg-[#1b5e3b] rounded-full animate-pulse" />
                    <div className="w-0.5 h-5 bg-[#1b5e3b] rounded-full" />
                    <div className="w-0.5 h-2 bg-[#1b5e3b] rounded-full" />
                    <div className="w-0.5 h-4 bg-[#1b5e3b] rounded-full" />
                    <div className="w-0.5 h-2 bg-[#1b5e3b] rounded-full" />
                  </div>
                </div>

                {/* Card Container */}
                <div className="w-60 h-36 bg-[#faf8f4] border border-[#eae3d5] rounded-2xl shadow-sm p-3 flex flex-col justify-between relative">
                  
                  {/* Input Mode Tabs */}
                  <div className="flex items-center justify-between text-[10px] font-semibold border-b border-slate-100 pb-1.5">
                    <span className="flex items-center gap-1 text-[#1b5e3b] font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      <FileText className="w-3 h-3" /> Text
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 hover:text-slate-600">
                      <Mic className="w-3 h-3" /> Speech
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 hover:text-slate-600">
                      <Upload className="w-3 h-3" /> Upload
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 hover:text-slate-600">
                      <ImageIcon className="w-3 h-3" /> Image
                    </span>
                  </div>

                  {/* Input Placeholder with Mic CTA */}
                  <div className="w-full bg-white border border-[#eae3d5] rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                    <span className="text-[11px] text-slate-400 truncate">
                      Type, speak, or upload your content...
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#1b5e3b] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Mic className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="h-1" />

                </div>

                {/* Botanical leaf on top */}
                <div className="absolute -top-3 right-8 w-8 h-8 pointer-events-none">
                  <svg viewBox="0 0 30 30" className="w-full h-full">
                    <path d="M 20 25 Q 25 10, 10 5 Q 15 18, 20 25" fill="#698e71" />
                  </svg>
                </div>

              </div>
            </div>

            {/* Pill Badge */}
            <span className="text-[11px] font-bold text-[#1b5e3b] bg-[#e4efe6] px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              STEP 02
            </span>

            {/* Title & Description */}
            <h3 className="text-xl font-bold text-[#1e293b] mb-2 tracking-tight">
              Input Your Content
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs font-sans">
              Type text, speak using your microphone, or upload document scans. Our multi-modal AI handles text, speech, and OCR effortlessly.
            </p>
          </div>

          {/* STEP 03: Get Instant Translation */}
          <div className="flex flex-col items-center text-center px-4 relative group">
            
            {/* Visual Box */}
            <div className="mb-6 w-full flex justify-center">
              <div className="relative w-full max-w-[280px] h-48 flex items-center justify-center select-none">
                
                {/* Floating "✨ Translated" Badge on Top Left */}
                <div className="absolute -top-2 left-2 z-20 flex items-center">
                  <div className="px-3 py-1 rounded-full bg-white border border-[#eae3d5] text-[10px] font-bold text-[#1b5e3b] flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3 h-3 text-[#1b5e3b]" />
                    <span>Translated</span>
                  </div>
                </div>

                {/* Dark Green Gradient Card (UI5.png) */}
                <div className="w-60 h-36 bg-gradient-to-br from-[#1b5e3b] to-[#114028] text-white rounded-2xl shadow-md p-3.5 flex flex-col justify-between relative border border-[#14472c]">
                  
                  {/* Top: Devanagari Greeting + Speaker Audio */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-base font-bold font-serif tracking-wide text-white">
                      नमस्ते
                    </span>
                    <button 
                      type="button"
                      aria-label="Listen audio"
                      className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
                    >
                      <Volume2 className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/20 my-1" />

                  {/* Bottom: English Hello + Copy & Download */}
                  <div className="flex items-center justify-between pb-0.5">
                    <span className="text-xs text-white/90 font-medium">
                      Hello
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        type="button"
                        aria-label="Copy text"
                        className="w-6 h-6 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
                      >
                        <Copy className="w-3 h-3 text-white" />
                      </button>
                      <button 
                        type="button"
                        aria-label="Download translation"
                        className="w-6 h-6 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
                      >
                        <Download className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>

                </div>

                {/* Botanical leaves around card */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 pointer-events-none">
                  <svg viewBox="0 0 30 30" className="w-full h-full">
                    <path d="M 10 25 Q 15 10, 28 5 Q 20 18, 10 25" fill="#698e71" />
                  </svg>
                </div>

              </div>
            </div>

            {/* Pill Badge */}
            <span className="text-[11px] font-bold text-[#1b5e3b] bg-[#e4efe6] px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              STEP 03
            </span>

            {/* Title & Description */}
            <h3 className="text-xl font-bold text-[#1e293b] mb-2 tracking-tight">
              Get Instant Translation
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs font-sans">
              Receive high-precision translations in real time. Listen to authentic pronunciations or copy and export subtitles instantly.
            </p>
          </div>

        </div>

      </div>

      {/* Bottom Center Cursive Signature (UI5.png) */}
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center mt-14 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 sm:w-16 h-[1.5px] bg-[#c5a874]/70" />
          <span className="font-handwriting text-2xl sm:text-3xl text-[#2d241e] font-medium tracking-wide">
            Languages Connect People
          </span>
          <div className="w-10 sm:w-16 h-[1.5px] bg-[#c5a874]/70" />
        </div>
      </div>

    </section>
  );
};

export default HowItWorksSection;
