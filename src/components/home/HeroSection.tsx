import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, ArrowRight, ArrowLeftRight, ChevronDown, Menu, Wifi, Battery } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { translateText, playTextSpeech } from '../../services/translationService';

export const HeroSection: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('sat'); // Default Santali matching screenshot
  const [targetLang, setTargetLang] = useState('eng'); // Default English
  const [inputText, setInputText] = useState('ᱥᱟᱱᱛᱟᱲᱤ ᱨᱚᱲ/ᱥᱟᱱᱛᱟᱲᱤ...');
  const [outputText, setOutputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);

  const handleTranslate = async () => {
    setIsTranslating(true);
    const result = await translateText(inputText, sourceLang, targetLang);
    setOutputText(result.targetText || 'Welcome to the Bhasha Setu portal for tribal languages.');
    setIsTranslating(false);
  };

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText || 'Hello, how are you?');
    setOutputText(inputText);
  };

  const sourceLangObj = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang) || SUPPORTED_LANGUAGES[0];
  const targetLangObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLang) || SUPPORTED_LANGUAGES[1];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white pt-28 pb-20 lg:pt-36 lg:pb-28">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-emerald-100/40 via-green-50/30 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading & Description */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Ministry Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dcfce7] border border-[#bbf7d0] text-[#14532d] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#249144] animate-pulse" />
              <span>Ministry of Tribal Affairs Initiative</span>
            </div>

            {/* Main Headline */}
            <h1 className="domine-bold text-4xl sm:text-5xl lg:text-[52px] font-bold text-slate-900 leading-[1.15] tracking-tight">
              Preserving & Empowering <span className="text-[#249144] underline decoration-emerald-200 decoration-wavy decoration-2 underline-offset-8">Tribal Languages</span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-slate-600 font-sans max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              India's premier AI-powered multidirectional translation, speech synthesis, and cultural archiving ecosystem bridging tribal heritage with modern digital accessibility.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/features/text-to-text"
                className="btn-mota inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <span>Start Translating</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/resources/dictionary"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition shadow-2xs"
              >
                <BookOpen className="w-4 h-4 text-[#249144]" />
                <span>Explore 6,800+ Words</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#249144]" />
                <span>Ol Chiki & Romanized Santali</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#249144]" />
                <span>Neural Voice Synthesis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#249144]" />
                <span>100% Free & Open-Access</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Translation Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 space-y-4 relative">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Languages className="w-5 h-5 text-[#249144]" />
                  <span className="font-bold text-sm text-slate-800">Quick Portal Translate</span>
                </div>
                <span className="text-[11px] font-semibold text-[#249144] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Instant AI
                </span>
              </div>

              {/* Language Selector Toolbar */}
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <div className="flex-1 text-center">
                  <span className="text-xs font-bold text-slate-800 block truncate">{sourceLangObj.name}</span>
                  <span className="text-[10px] text-slate-400 font-sans block">{sourceLangObj.script}</span>
                </div>

                <button
                  onClick={handleSwap}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-[#249144] flex items-center justify-center transition shadow-2xs mx-1"
                  title="Swap languages"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>

                <div className="flex-1 text-center">
                  <span className="text-xs font-bold text-[#249144] block truncate">{targetLangObj.name}</span>
                  <span className="text-[10px] text-slate-400 font-sans block">{targetLangObj.script}</span>
                </div>
              </div>

              {/* Input Area */}
              <div className="space-y-1.5">
                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={3}
                    placeholder="Type words or sentences in English/Hindi..."
                    className="w-full text-sm p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:border-[#249144] focus:ring-2 focus:ring-[#249144]/20 outline-hidden transition resize-none text-slate-800 placeholder:text-slate-400 font-sans"
                  />
                  {inputText && (
                    <button
                      onClick={() => setInputText('')}
                      className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Phrases Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                  <span className="text-slate-400 text-[10px] font-medium flex-shrink-0">Quick:</span>
                  {[
                    { label: 'Hello / Johar', text: 'Hello, welcome!' },
                    { label: 'How are you?', text: 'How are you doing today?' },
                    { label: 'What is your name?', text: 'What is your name?' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => {
                        setInputText(chip.text);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-[#249144] text-slate-600 transition flex-shrink-0 font-medium"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Translate Action Button */}
              <button
                onClick={handleTranslate}
                disabled={isTranslating || !inputText.trim()}
                className="w-full py-3 rounded-2xl bg-[#249144] hover:bg-[#1b7535] disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isTranslating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Translate Now</span>
                  </>
                )}
              </button>

              {/* Output Result Card */}
              <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-[#dcfce7] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span className="text-[#14532d]">RESULT ({targetLangObj.name})</span>
                  <div className="flex items-center gap-1 text-[#249144]">
                    <Sparkles className="w-3 h-3" />
                    <span>Verified AI</span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900 leading-relaxed font-serif min-h-[38px]">
                  {isTranslating ? (
                    <span className="text-[#249144] animate-pulse">Translating...</span>
                  ) : (
                    outputText || <span className="text-slate-400">Translation output...</span>
                  )}
                </p>
                <div className="flex justify-end items-center pt-1 border-t border-slate-50">
                  <button
                    onClick={() => playTextSpeech(outputText || 'Welcome to Bhasha Setu', targetLang)}
                    title="Listen to translation"
                    className="text-slate-400 hover:text-[#249144] transition p-0.5"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Tribal Background Art (Top-Left & Top-Right Mandalas) */}
      <div className="absolute top-0 left-0 w-72 h-72 sm:w-96 sm:h-96 pointer-events-none opacity-25 select-none -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full text-[#86c498] fill-none stroke-current" strokeWidth="1.5">
          <circle cx="20" cy="20" r="40" strokeDasharray="3 3" />
          <circle cx="20" cy="20" r="70" />
          <circle cx="20" cy="20" r="100" strokeDasharray="6 6" />
          <circle cx="20" cy="20" r="130" />
          <circle cx="20" cy="20" r="160" strokeDasharray="4 4" />
          {/* Tribal ray spokes */}
          <path d="M20 20 L160 20 M20 20 L120 120 M20 20 L20 160 M20 20 L90 140 M20 20 L140 90" strokeOpacity="0.4" />
        </svg>
      </div>

      <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 pointer-events-none opacity-25 select-none -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full text-[#86c498] fill-none stroke-current" strokeWidth="1.5">
          <circle cx="180" cy="20" r="40" strokeDasharray="3 3" />
          <circle cx="180" cy="20" r="70" />
          <circle cx="180" cy="20" r="100" strokeDasharray="6 6" />
          <circle cx="180" cy="20" r="130" />
          <circle cx="180" cy="20" r="160" strokeDasharray="4 4" />
          <path d="M180 20 L40 20 M180 20 L80 120 M180 20 L180 160 M180 20 L110 140 M180 20 L60 90" strokeOpacity="0.4" />
        </svg>
      </div>

      {/* Decorative Bottom Nature Elements (Soft mint rolling hills, hut, tree, birds) */}
      <div className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none opacity-40 select-none -z-10 flex items-end justify-between px-6 sm:px-16 overflow-hidden">
        {/* Left Hill with Hut */}
        <div className="relative w-64 sm:w-80 h-32">
          <svg viewBox="0 0 300 150" className="w-full h-full fill-[#e8f5ec] stroke-[#86c498]" strokeWidth="1.5">
            <path d="M-50 150 Q 80 50, 240 150 Z" />
            {/* Traditional Hut */}
            <path d="M80 120 L105 85 L130 120 Z" fill="#ffffff" stroke="#86c498" strokeWidth="2" />
            <path d="M90 120 L90 105 L120 105 L120 120" fill="#ffffff" stroke="#86c498" strokeWidth="1.5" />
            {/* Flying Birds */}
            <path d="M40 40 Q 48 34, 56 40 Q 64 34, 72 40" fill="none" stroke="#249144" strokeWidth="1.5" />
            <path d="M140 30 Q 146 25, 152 30 Q 158 25, 164 30" fill="none" stroke="#249144" strokeWidth="1.5" />
            <path d="M170 50 Q 175 46, 180 50 Q 185 46, 190 50" fill="none" stroke="#249144" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Right Hill with Tree */}
        <div className="relative w-64 sm:w-80 h-32 hidden sm:block">
          <svg viewBox="0 0 300 150" className="w-full h-full fill-[#e8f5ec] stroke-[#86c498]" strokeWidth="1.5">
            <path d="M60 150 Q 220 50, 350 150 Z" />
            {/* Tree */}
            <circle cx="230" cy="90" r="30" fill="#d1ead4" stroke="#86c498" strokeWidth="1.5" />
            <line x1="230" y1="120" x2="230" y2="150" stroke="#86c498" strokeWidth="2" />
            {/* Birds */}
            <path d="M90 45 Q 96 40, 102 45 Q 108 40, 114 45" fill="none" stroke="#249144" strokeWidth="1.5" />
            <path d="M130 65 Q 135 61, 140 65 Q 145 61, 150 65" fill="none" stroke="#249144" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column: Heading, Subtitle & Call to Action (Exact match to Image 5) */}
          <div className="flex flex-col space-y-6 sm:space-y-8 lg:col-span-7">
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.12] tracking-tight text-[#1e293b]" style={{ fontFamily: "'Domine', Georgia, serif" }}>
              Translate{' '}
              <span className="text-[#249144]">
                Anything
              </span>
              <br />
              Instantly with AI
            </h1>

            <p className="max-w-lg text-base text-slate-500 sm:text-lg md:text-xl font-normal leading-relaxed font-sans">
              Type or speak. Get translation in your language instantly.
            </p>

            <div className="pt-2">
              <Link
                to="/features/text-to-text"
                className="bg-[#249144] hover:bg-[#1a7536] text-white px-8 py-4 text-base font-semibold rounded-2xl inline-flex items-center gap-2.5 shadow-lg shadow-green-900/15 hover:shadow-xl transition-all duration-200 group w-full sm:w-max justify-center"
              >
                <span>Try Translation Now</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

          </div>

          {/* Right Column: Sleek Smartphone Mockup Simulator (Exact match to Image 5) */}
          <div className="flex items-center justify-center lg:col-span-5 relative select-none">
            
            <div className="relative w-[290px] sm:w-[320px] h-[550px] bg-slate-950 rounded-[46px] p-3.5 shadow-2xl border-[4px] border-slate-900 flex flex-col justify-between transform hover:scale-[1.01] transition-transform duration-300">
              
              {/* Dynamic Island / Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-900 rounded-full mr-1.5"></div>
                <div className="w-1.5 h-1.5 bg-[#249144] rounded-full"></div>
              </div>

              {/* Internal Screen Content */}
              <div className="bg-[#f8fafc] w-full h-full rounded-[36px] overflow-hidden flex flex-col p-4 pt-7 text-slate-800 relative justify-between">
                
                {/* Top Status Bar: 5:30, WiFi, Battery */}
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 mb-3 px-1">
                    <span>5:30</span>
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-3 h-3 text-slate-700" />
                      <Battery className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                  </div>

                  {/* App Header: Hamburger + Centered 'Text to text' in Green */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <Menu className="w-4 h-4 text-slate-700 cursor-pointer" />
                    <span className="text-xs font-bold text-[#249144] tracking-tight">
                      Text to text
                    </span>
                    <div className="w-4 h-4"></div>
                  </div>
                </div>

                {/* Main Converter Flow */}
                <div className="flex flex-col gap-2 my-auto">
                  
                  {/* FROM Language Picker & Box */}
                  <div className="relative z-20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">From</span>
                      <button
                        onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs rounded-full px-2.5 py-1 text-[10px] font-semibold text-slate-700"
                      >
                        <div className="w-4 h-4 rounded-full bg-[#249144] flex items-center justify-center text-white text-[7px] font-bold">
                          {sourceLangObj.badge}
                        </div>
                        <span>{sourceLangObj.name}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>

                    {showSourceDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto p-1">
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <button
                            key={lang.id}
                            onClick={() => {
                              setSourceLang(lang.code);
                              setShowSourceDropdown(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-[10px] rounded-lg hover:bg-green-50 flex items-center justify-between"
                          >
                            <span className="font-medium">{lang.name}</span>
                            <span className="text-[8px] text-slate-400">{lang.badge}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Input Card with Santali Text & Speaker */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs text-xs font-medium min-h-[88px] flex flex-col justify-between">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type phrase to translate..."
                        className="w-full resize-none outline-none bg-transparent text-slate-800 text-[11px] leading-relaxed h-12"
                      />
                      <div className="flex justify-end items-center pt-1 border-t border-slate-50">
                        <button
                          onClick={() => playTextSpeech(inputText, sourceLang)}
                          title="Listen"
                          className="text-slate-400 hover:text-[#249144] transition p-0.5"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Centered Circular Swap Button */}
                  <div className="flex justify-center my-0.5 relative z-10">
                    <button
                      onClick={handleSwap}
                      className="w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center hover:scale-110 active:scale-95 transition text-slate-700 cursor-pointer"
                      title="Swap languages"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* TO Language Picker & Box */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">To</span>
                      <button
                        onClick={() => setShowTargetDropdown(!showTargetDropdown)}
                        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-xs rounded-full px-2.5 py-1 text-[10px] font-semibold text-slate-700"
                      >
                        <div className="w-4 h-4 rounded-full bg-[#249144] flex items-center justify-center text-white text-[7px] font-bold">
                          {targetLangObj.badge}
                        </div>
                        <span>{targetLangObj.name}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>

                    {showTargetDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-40 overflow-y-auto p-1">
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <button
                            key={lang.id}
                            onClick={() => {
                              setTargetLang(lang.code);
                              setShowTargetDropdown(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-[10px] rounded-lg hover:bg-green-50 flex items-center justify-between"
                          >
                            <span className="font-medium">{lang.name}</span>
                            <span className="text-[8px] text-slate-400">{lang.badge}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Output Card with Speaker */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs text-xs font-medium min-h-[88px] flex flex-col justify-between">
                      <p className="text-slate-800 text-[11px] leading-relaxed min-h-12">
                        {isTranslating ? (
                          <span className="text-[#249144] animate-pulse">Translating...</span>
                        ) : (
                          outputText || <span className="text-slate-400">Translation output...</span>
                        )}
                      </p>
                      <div className="flex justify-end items-center pt-1 border-t border-slate-50">
                        <button
                          onClick={() => playTextSpeech(outputText || 'Welcome to Bhasha Setu', targetLang)}
                          title="Listen to translation"
                          className="text-slate-400 hover:text-[#249144] transition p-0.5"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bottom Translate Action Button */}
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="w-full text-white rounded-2xl py-3 text-xs font-bold text-center mt-3 shadow-md transition-all active:scale-98 bg-[#249144] hover:bg-[#1a7536] cursor-pointer"
                >
                  {isTranslating ? 'Translating...' : 'Translate'}
                </button>

              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
