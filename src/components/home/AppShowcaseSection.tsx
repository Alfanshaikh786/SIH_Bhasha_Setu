import React from 'react';
import { Camera, Mic, Volume2, Wifi, Battery, Play, ArrowDown } from 'lucide-react';

export const AppShowcaseSection: React.FC = () => {
  return (
    <section className="py-16 lg:py-24 px-6 sm:px-8 lg:px-12 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Dual 3D Tilted Phones */}
          <div className="relative w-full h-auto lg:h-[340px] lg:col-span-5 flex items-center justify-center py-6 lg:py-0">
            <div className="relative flex items-center justify-center gap-4 sm:gap-6 scale-95 sm:scale-100 lg:scale-105 origin-center select-none z-20">
              
              {/* Phone 1: OCR Translate with Laser Scanner animation */}
              <div className="relative z-20 w-44 h-84 bg-slate-950 rounded-[34px] p-2.5 shadow-2xl border-[3px] border-slate-800 flex flex-col justify-between -rotate-6 hover:rotate-0 transition-transform duration-500">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-3 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-1 h-1 bg-slate-800 rounded-full ml-auto mr-1"></div>
                </div>

                <div className="bg-slate-50 w-full h-full rounded-[24px] overflow-hidden flex flex-col p-2.5 pt-6 text-slate-800 relative">
                  <div className="flex justify-between items-center text-[7px] font-bold text-slate-500 mb-1.5">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <Wifi className="w-2 h-2 text-slate-500" />
                      <Battery className="w-2.5 h-2.5 text-slate-500" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 border-b border-slate-100 pb-1 mb-1.5">
                    <Camera className="w-3 h-3 text-[#249144]" />
                    <span className="text-[8.5px] font-bold text-slate-800">OCR Translate</span>
                  </div>

                  {/* Laser Scan Card */}
                  <div className="relative bg-slate-200 border border-slate-300 rounded-lg p-2 text-[7px] text-slate-600 font-medium h-[65px] flex flex-col justify-center items-center overflow-hidden mb-1">
                    <div className="laser-line"></div>
                    <Camera className="w-3.5 h-3.5 text-slate-400 mb-1 animate-pulse" />
                    <p className="font-bold text-slate-700 text-[6.5px]">tribal_signboard.jpg</p>
                  </div>

                  <div className="flex justify-center my-0.5">
                    <div className="w-4 h-4 rounded-full bg-[#249144] flex items-center justify-center text-white text-[8px] shadow-sm">
                      <ArrowDown className="w-2.5 h-2.5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-lg p-1.5 text-[7px] text-slate-700 min-h-[44px] flex flex-col justify-between shadow-sm">
                    <p className="font-semibold text-emerald-800 text-[7px]">Santali: ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ</p>
                    <div className="flex justify-end">
                      <Volume2 className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="w-full text-white rounded-md py-1 text-[7px] font-bold text-center mt-auto shadow-sm bg-[#249144]">
                    Scan Complete
                  </div>
                </div>
              </div>

              {/* Phone 2: AdiVaani Voice with Equalizer Waveform */}
              <div className="relative z-10 w-44 h-84 bg-slate-950 rounded-[34px] p-2.5 shadow-2xl border-[3px] border-slate-800 flex flex-col justify-between rotate-6 hover:rotate-0 transition-transform duration-500 -ml-8 mt-6">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-3 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-1 h-1 bg-slate-800 rounded-full ml-auto mr-1"></div>
                </div>

                <div className="bg-slate-50 w-full h-full rounded-[24px] overflow-hidden flex flex-col p-2.5 pt-6 text-slate-800 relative">
                  <div className="flex justify-between items-center text-[7px] font-bold text-slate-500 mb-1.5">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <Wifi className="w-2 h-2 text-slate-500" />
                      <Battery className="w-2.5 h-2.5 text-slate-500" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 border-b border-slate-100 pb-1 mb-1.5">
                    <Mic className="w-3 h-3 text-[#249144]" />
                    <span className="text-[8.5px] font-bold text-slate-800">Voice-to-Voice</span>
                  </div>

                  {/* Equalizer Wave Card */}
                  <div className="bg-white border border-slate-100 rounded-lg p-2 shadow-sm flex flex-col gap-1 mb-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[6px] font-bold text-red-500 uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> Live Mic
                      </span>
                    </div>
                    <div className="h-7 flex items-end justify-center gap-1 bg-slate-50 rounded p-1">
                      <div className="w-0.5 bg-[#249144] rounded h-3 animate-pulse"></div>
                      <div className="w-0.5 bg-[#249144] rounded h-5 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-0.5 bg-[#249144] rounded h-4 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-0.5 bg-[#249144] rounded h-6 animate-pulse" style={{ animationDelay: '0.05s' }}></div>
                      <div className="w-0.5 bg-[#249144] rounded h-2 animate-pulse" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-0.5 bg-emerald-600 rounded h-4"></div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-lg p-1.5 shadow-sm text-[7px] flex flex-col gap-1">
                    <div className="flex justify-between items-center font-medium text-slate-700">
                      <span>Source: English</span>
                      <Play className="w-2 h-2 text-slate-300" />
                    </div>
                    <div className="border-t border-slate-100 my-0.5"></div>
                    <div className="flex justify-between items-center font-bold text-emerald-700">
                      <span>Target: Bhili</span>
                      <Play className="w-2 h-2 text-[#249144]" />
                    </div>
                  </div>

                  {/* Record button */}
                  <div className="mt-auto flex flex-col items-center gap-0.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-md bg-red-500 text-white animate-pulse">
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[6px] text-slate-400 font-semibold uppercase">Recording Voice</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Banner Content */}
          <div className="relative z-10 lg:col-span-7 bg-gradient-to-br from-[#14532d] via-[#166534] to-[#15803d] rounded-[32px] px-8 sm:px-10 lg:px-12 py-8 lg:py-10 text-white border border-green-800/20 overflow-hidden shadow-xl flex flex-col gap-6">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-black/20 blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-4">
              <span className="text-xs font-bold text-green-200 uppercase tracking-wider">
                Mobile Translation Suite
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight domine-bold">
                Download Our App Now
              </h2>
              <p className="text-sm sm:text-base text-green-100 leading-relaxed max-w-xl font-light">
                Join our contributor community and help us build robust datasets for indigenous languages. Access offline translations, camera OCR, and voice dialogue anywhere in the field.
              </p>

              {/* App Store Badge Buttons */}
              <div className="flex flex-wrap gap-4 mt-2">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('trigger-pwa-install'))}
                  className="transition hover:scale-105 active:scale-95 bg-black/40 hover:bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-sm cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-green-400" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.99 1.99 0 0 1-.61-.936V2.75c.178-.36.38-.674.609-.936zm11.306 11.306L5.352 22.684c.328.188.707.29 1.108.29.54 0 1.05-.188 1.487-.514l8.968-5.15-2-4.19zm0-2.24L8.947 1.54C8.51 1.214 8 1.026 7.46 1.026c-.4 0-.78.102-1.108.29l9.563 9.564 2-4.19zM18.73 10.42l-2.707-1.554-2.22 2.22 2.22 2.22 2.707-1.554a1.82 1.82 0 0 0 0-3.332z"/>
                  </svg>
                  <div className="text-left">
                    <span className="block text-[9px] text-green-200 uppercase font-semibold">GET FOR ANDROID</span>
                    <span className="block text-xs sm:text-sm font-bold text-white">Install Web App</span>
                  </div>
                </button>

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('trigger-pwa-install'))}
                  className="transition hover:scale-105 active:scale-95 bg-black/40 hover:bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-sm cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.35c.63-.78 1.06-1.87.94-2.96-.91.04-2.02.61-2.67 1.38-.56.65-1.05 1.76-.92 2.82 1.02.08 2.02-.46 2.65-1.24z"/>
                  </svg>
                  <div className="text-left">
                    <span className="block text-[9px] text-green-200 uppercase font-semibold">GET FOR IOS / PC</span>
                    <span className="block text-xs sm:text-sm font-bold text-white">Install Web App</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
