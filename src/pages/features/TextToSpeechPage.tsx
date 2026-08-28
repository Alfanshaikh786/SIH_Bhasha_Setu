import React, { useState } from 'react';
import { Volume2, Play, Pause, RotateCcw, Sparkles, Sliders, AudioWaveform as Waveform, Download } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { playTextSpeech } from '../../services/translationService';

export const TextToSpeechPage: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState('sat');
  const [text, setText] = useState('ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ • ᱟᱵᱚᱣᱟᱜ ᱫᱤᱥᱚᱢ ᱫᱚ ᱵᱷᱟᱨᱚᱛ ᱠᱟᱱᱟ᱾ ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱨᱮ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ᱾');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  const langObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  const handleSpeak = () => {
    if (!text.trim()) return;
    setIsPlaying(true);
    playTextSpeech(text, selectedLang);
    setTimeout(() => setIsPlaying(false), 3000);
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="w-full py-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#249144]" /> Neural Speech Synthesis (TTS)
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Text to Speech (TTS)
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-500">
            Listen to written documents and phrases rendered in natural-sounding tribal phonetic voices.
          </p>
        </div>

        {/* Studio Box */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6 mt-4">
          
          {/* Top Bar Language Select */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Voice Dialect:</span>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                aria-label="Select voice dialect"
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none hover:border-[#249144]"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.id} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#249144]"></span> Neural HD Model
              </span>
              <span>24 kHz Studio Audio</span>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase">Input Text:</label>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 overflow-x-auto hide-scrollbar">
                <span className="text-slate-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => { setSelectedLang('sat'); setText('ᱱᱩᱭ ᱫᱚ ᱜᱟᱹᱭ ᱠᱟᱱᱟᱭ ᱾'); }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-green-50 hover:text-[#249144] font-medium"
                >
                  🐄 Cow (Santali)
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedLang('sat'); setText('ᱱᱩᱭ ᱫᱚ ᱦᱟᱹᱛᱤ ᱠᱟᱱᱟᱭ ᱾'); }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-green-50 hover:text-[#249144] font-medium"
                >
                  🐘 Elephant (Santali)
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedLang('sat'); setText('ᱟᱞᱮ ᱪᱟᱱᱟᱪ ᱨᱮ ᱢᱤᱫ ᱦᱩᱰᱤᱧ ᱠᱟᱹᱢᱤᱦᱚᱨᱟ ᱢᱮᱱᱟᱜᱼᱟ ᱾'); }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-green-50 hover:text-[#249144] font-medium"
                >
                  🏫 Classroom (Santali)
                </button>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to synthesize into speech..."
              className="w-full h-40 p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#249144] focus:bg-white outline-none resize-none text-base leading-relaxed text-slate-900 transition font-medium"
            />
            <div className="flex justify-between items-center text-xs text-slate-400 mt-1 px-1">
              <span>{text.length} characters</span>
              <button onClick={() => setText('')} className="hover:text-red-500">Clear</button>
            </div>
          </div>

          {/* Sliders for Speech Tuning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Speed / Rate</span>
                <span>{rate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-[#249144] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>Pitch</span>
                <span>{pitch}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-[#249144] cursor-pointer"
              />
            </div>
          </div>

          {/* Controls & Play Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeak}
                disabled={!text.trim()}
                className="btn-mota px-8 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? 'Playing Audio...' : 'Generate & Play Speech'}</span>
              </button>
            </div>

            <button
              onClick={handleSpeak}
              className="p-3 rounded-xl border border-slate-200 hover:border-[#249144] text-slate-600 hover:text-[#249144] shadow-sm transition"
              title="Download Audio"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
