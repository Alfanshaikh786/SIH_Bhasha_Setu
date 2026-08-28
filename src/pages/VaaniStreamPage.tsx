import React, { useState, useEffect } from 'react';
import { Radio, Play, Pause, Sparkles, Volume2, Globe, Users, MessageSquare } from 'lucide-react';
import { playTextSpeech } from '../services/translationService';

interface LiveCaption {
  lang: string;
  script: string;
  badge: string;
  text: string;
}

export const VaaniStreamPage: React.FC = () => {
  const [streamPlaying, setStreamPlaying] = useState(true);
  const [captions, setCaptions] = useState<LiveCaption[]>([
    { lang: 'Santali', script: 'Ol Chiki', badge: 'SNT', text: 'ᱥᱟᱱᱟᱢ ᱫᱤᱥᱚᱢ ᱦᱚᱲ ᱠᱚ ᱡᱚᱦᱟᱨ • ᱛᱮᱦᱮᱧᱟᱜ ᱡᱟᱹᱛᱤᱭᱟᱹᱨᱤ ᱠᱟᱹᱢᱤᱦᱚᱨᱟ ᱨᱮ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾' },
    { lang: 'Bhili', script: 'Devanagari', badge: 'BHI', text: 'सगळा भाइया-बेहना ने घणी बधाई • हमारो गाम मां विकास नी योजना लागू थई।' },
    { lang: 'Gondi', script: 'Central', badge: 'GON', text: 'सेवा जोहार! सगा समाज तुन बड़ादेव पेन ना कृपा मंतू • स्कूल अऊर अस्पताल बने मंता।' },
    { lang: 'Mundari', script: 'Bani', badge: 'UNR', text: 'ᱟᱞᱮᱭᱟᱜ ᱦᱟᱛᱩ ᱨᱮ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ • ᱵᱤᱨᱥᱟ ᱢᱩᱱᱰᱟ ᱣᱟᱜ ᱩᱞᱜᱩᱞᱟᱱ ᱫᱤᱥᱟᱹ ᱫᱚᱦᱚᱭ ᱢᱮ᱾' },
    { lang: 'Kui', script: 'Odia', badge: 'KUI', text: 'ଜୋହାର • ଆମୋ ଗାଁ ରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ • ଧରଣୀ ପେନୁ ସବୁ ଜୀବନ ଦେଇଚି।' },
    { lang: 'Garo', script: 'A·chik', badge: 'GRT', text: 'Mitela pilak manderangna • Wangala sal sokbaaha chingni a·dokona.' }
  ]);

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="w-full py-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-700 mb-3">
            <Radio className="w-3.5 h-3.5 text-red-600 animate-ping" /> Live Multilingual Simulcast
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Vaani Stream
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-500">
            Live speech broadcast with simultaneous real-time multi-dialect neural caption stream.
          </p>
        </div>

        {/* Simulcast Box */}
        <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 text-white my-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                Live Broadcast Feed • Red Fort Independence Broadcast
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> 14,280 Listening</span>
            </div>
          </div>

          {/* Video / Audio Canvas Display */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
            <iframe
              src="https://www.youtube.com/embed/DNDJYTGDyj8?autoplay=1&mute=1&controls=1"
              title="Vaani Stream"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Simultaneous Multi-Dialect Caption Wall */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#249144]" /> Simultaneous Multi-Dialect Neural Captions (6 Channels)
              </h3>
              <span className="text-[10px] text-green-400 font-mono">Live latency: 340ms</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {captions.map((cap, i) => (
                <div
                  key={i}
                  className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-1.5 hover:border-[#249144] transition"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#249144] font-bold">Channel 0{i + 1} • {cap.lang}</span>
                    <span className="text-slate-500">{cap.script}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-200 leading-relaxed font-olchiki">
                    {cap.text}
                  </p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => playTextSpeech(cap.text, 'sat')}
                      className="text-slate-400 hover:text-green-400 p-1"
                      title="Listen channel"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
