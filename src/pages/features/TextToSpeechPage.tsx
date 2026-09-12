import React, { useState } from 'react';
import { Volume2, Play, Pause, RotateCcw, Sparkles, Sliders, Download, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../data/languages';
import { playTextSpeech, stopTextSpeech } from '../../services/translationService';
import { TTSAudioExporter } from '../../services/tts';

interface PresetItem {
  label: string;
  text: string;
  icon?: string;
}

const PRESETS_BY_LANG: Record<string, PresetItem[]> = {
  sat: [
    { label: 'Welcome & Healthcare', text: 'ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ • ᱟᱵᱚᱣᱟᱜ ᱫᱤᱥᱚᱢ ᱫᱚ ᱵᱷᱟᱨᱚᱛ ᱠᱟᱱᱟ᱾ ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱨᱮ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ᱾', icon: '✨' },
    { label: 'Cow (Santali)', text: 'ᱱᱩᱭ ᱫᱚ ᱜᱟᱹᱭ ᱠᱟᱱᱟᱭ ᱾', icon: '🐄' },
    { label: 'Elephant (Santali)', text: 'ᱱᱩᱭ ᱫᱚ ᱦᱟᱹᱛᱤ ᱠᱟᱱᱟᱭ ᱾', icon: '🐘' },
    { label: 'Classroom (Santali)', text: 'ᱟᱞᱮ ᱪᱟᱱᱟᱪ ᱨᱮ ᱢᱤᱫ ᱦᱩᱰᱤᱧ ᱠᱟᱹᱢᱤᱦᱚᱨᱟ ᱢᱮᱱᱟᱜᱼᱟ ᱾', icon: '🏫' }
  ],
  hin: [
    { label: 'स्वागत एवं परिचय', text: 'नमस्ते, भाषा सेतु में आपका स्वागत है। हम जनजातीय भाषाओं का संवर्धन करते हैं।', icon: '🙏' },
    { label: 'स्वास्थ्य परामर्श', text: 'दवा समय पर लें और अस्पताल में स्वास्थ्य जांच करवाएं।', icon: '🏥' },
    { label: 'शिक्षा', text: 'बच्चे कक्षा में ध्यान से पढ़ाई कर रहे हैं।', icon: '📚' }
  ],
  eng: [
    { label: 'Welcome Portal', text: 'Welcome to Bhasha Setu text to speech workspace for indigenous languages.', icon: '🌐' },
    { label: 'Clinical Instruction', text: 'Please take two tablets of paracetamol after meals daily.', icon: '💊' },
    { label: 'Phonetic Test', text: 'The quick brown fox jumps over the lazy dog.', icon: '🦊' }
  ],
  unr: [
    { label: 'Greeting (Mundari)', text: 'ᱡᱚᱦᱟᱨ ᱜᱮ • ᱟᱞᱮ ᱫᱚ ᱢᱩᱱᱰᱟ ᱦᱚᱲ ᱠᱟᱱᱟᱞᱮ᱾', icon: '🌿' }
  ],
  hoc: [
    { label: 'Greeting (Ho)', text: 'ᱡᱚᱦᱟᱨ • ᱟᱞᱤᱝ ᱫᱚ ᱦᱚ ᱦᱚᱲ ᱛᱟᱱᱟᱞᱤᱝ᱾', icon: '🌾' }
  ]
};

export const TextToSpeechPage: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState('sat');
  const [text, setText] = useState('ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ • ᱟᱵᱚᱣᱟᱜ ᱫᱤᱥᱚᱢ ᱫᱚ ᱵᱷᱟᱨᱚᱛ ᱠᱟᱱᱟ᱾ ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱨᱮ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ᱾');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusText, setStatusText] = useState('Ready');
  const [isDownloading, setIsDownloading] = useState(false);

  const langObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];
  const presets = PRESETS_BY_LANG[selectedLang] || PRESETS_BY_LANG['sat'];
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Cleanup on unmount to prevent orphaned speech playback
  React.useEffect(() => {
    return () => {
      stopTextSpeech();
    };
  }, []);

  // Status lifecycle and auto-recovery to 'Ready'
  React.useEffect(() => {
    if (isPlaying) {
      setStatusText('Speaking audio...');
    } else {
      setStatusText(prev => (prev === 'Speaking audio...' ? 'Speech completed' : prev));
      const timer = setTimeout(() => {
        setStatusText(current =>
          current === 'Speech completed' ||
          current === 'Speech stopped' ||
          current === 'Speech stopped (language switched)' ||
          current === 'Preset phrase loaded' ||
          current === 'Text cleared' ||
          current === 'Speech tuning reset to 1.0x'
            ? 'Ready'
            : current
        );
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [isPlaying]);

  const handleLanguageChange = (newLang: string) => {
    if (isPlaying) {
      stopTextSpeech();
      setIsPlaying(false);
      setStatusText('Speech stopped (language switched)');
    }
    setSelectedLang(newLang);
  };

  const handleSelectPreset = (presetText: string) => {
    if (isPlaying) {
      stopTextSpeech();
      setIsPlaying(false);
    }
    setText(presetText);
    setStatusText('Preset phrase loaded');
  };

  const handleSpeak = () => {
    if (!text.trim()) {
      setStatusText('Please enter text to speak');
      return;
    }
    if (isPlaying) {
      stopTextSpeech();
      setIsPlaying(false);
      setStatusText('Speech stopped');
      return;
    }
    setIsPlaying(true);
    playTextSpeech(text, selectedLang, rate, () => setIsPlaying(false));
  };

  const handleDownload = async () => {
    if (!text.trim()) {
      setStatusText('Please enter text to download');
      return;
    }
    setIsDownloading(true);
    setStatusText('Exporting WAV audio...');
    try {
      await TTSAudioExporter.downloadSpeech(text, selectedLang);
      setStatusText('Audio file downloaded');
      setTimeout(() => {
        setIsDownloading(false);
        setStatusText(isPlaying ? 'Speaking audio...' : 'Ready');
      }, 2500);
    } catch {
      setIsDownloading(false);
      setStatusText('Audio download unavailable');
      setTimeout(() => setStatusText(isPlaying ? 'Speaking audio...' : 'Ready'), 2500);
    }
  };

  const handleClear = () => {
    if (isPlaying) {
      stopTextSpeech();
      setIsPlaying(false);
    }
    setText('');
    setStatusText('Text cleared');
  };

  const handleResetTuning = () => {
    setRate(1.0);
    setPitch(1.0);
    setStatusText('Speech tuning reset to 1.0x');
  };

  const getEngineBadge = () => {
    if (selectedLang === 'sat') {
      return {
        label: 'Phonetic Speech Bridge',
        sublabel: 'Acoustic Indian Voice',
        dotColor: 'bg-[#249144]'
      };
    }
    if (selectedLang === 'hin' || selectedLang === 'eng') {
      return {
        label: 'Browser Native Voice',
        sublabel: 'Device Synthesis',
        dotColor: 'bg-[#249144]'
      };
    }
    return {
      label: 'Architecture Ready',
      sublabel: 'Future Scope',
      dotColor: 'bg-amber-500'
    };
  };

  const engineBadge = getEngineBadge();

  return (
    <section className="min-h-screen bg-slate-50/50 pt-16 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">

        {/* Screen Header */}
        <div className="w-full py-2 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-2.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#249144]" /> Phonetic Speech Synthesis (Web Speech API)
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl font-semibold leading-tight text-gray-900">
            Text to Speech (TTS)
          </h1>
          <div className="relative mt-2.5 w-28 sm:w-36 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-14 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-2.5 max-w-2xl text-xs sm:text-sm text-slate-500 font-normal">
            Listen to written phrases rendered via verified phonetic transliteration guides using browser speech engines.
          </p>
        </div>

        {/* TTS Linguistic Honesty Notice */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 sm:p-3.5 text-xs text-amber-900 flex items-start gap-2.5 sm:gap-3 shadow-2xs">
          <span className="text-sm sm:text-base select-none mt-0.5" aria-hidden="true">📢</span>
          <div className="leading-relaxed">
            <strong className="font-semibold text-amber-950">Linguistic Transparency Notice:</strong> Native tribal neural voice models (Santali, Mundari, Ho) are currently unavailable in browser speech engines. Bhasha Setu synthesizes authentic pronunciations using Roman phonetic transliteration guides through Indian English and Hindi system voices.
          </div>
        </div>

        {/* Main Voice Studio Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-5 sm:p-7 space-y-5 sm:space-y-6">

          {/* Top Bar: Language Selector & Engine Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label htmlFor="tts-language-select" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Voice Dialect:
              </label>
              <div className="relative">
                <select
                  id="tts-language-select"
                  value={selectedLang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  aria-label="Select voice dialect"
                  className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-3.5 py-2 min-h-[44px] text-sm font-semibold text-slate-800 outline-none hover:border-[#249144] focus:border-[#249144] focus:ring-2 focus:ring-[#249144]/15 transition cursor-pointer shadow-2xs"
                >
                  {SUPPORTED_LANGUAGES.map(lang => {
                    const isFuture = lang.code === 'unr' || lang.code === 'hoc';
                    return (
                      <option key={lang.id} value={lang.code}>
                        {lang.name} ({lang.nativeName}){isFuture ? ' — Future Scope' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 min-h-[44px] shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${engineBadge.dotColor} ${isPlaying ? 'animate-ping' : ''}`}></span>
              <span className="font-semibold text-slate-800">{engineBadge.label}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">{engineBadge.sublabel}</span>
            </div>
          </div>

          {/* Quick Preset Phrases */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
              <span>Quick Practice Phrases ({langObj.name})</span>
              <span className="text-[11px] font-medium text-slate-400 lowercase">click to load</span>
            </div>
            <div className="flex flex-wrap items-center gap-2" role="region" aria-label="Preset practice phrases">
              {presets.map((preset, idx) => {
                const isSelected = text === preset.text;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset.text)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl border text-xs font-medium transition shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#249144]/20 cursor-pointer touch-manipulation ${
                      isSelected
                        ? 'border-[#249144] bg-green-50 text-[#14532d] font-semibold ring-1 ring-[#249144]/30'
                        : 'bg-slate-50 border-slate-200/80 hover:border-[#249144] hover:bg-green-50/60 hover:text-[#249144] text-slate-700'
                    }`}
                    title={preset.text}
                  >
                    {preset.icon && <span className="text-xs" aria-hidden="true">{preset.icon}</span>}
                    <span>{preset.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#249144] ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Input Workspace */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tts-input-textarea" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Input Text:
              </label>
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <span className="font-medium text-slate-600">{wordCount} words</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-slate-600">{text.length} characters</span>
              </div>
            </div>

            <div className="relative">
              <textarea
                id="tts-input-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to synthesize into speech..."
                rows={5}
                aria-label="Text to speak"
                className={`w-full p-4 sm:p-5 rounded-2xl bg-slate-50 border transition-all duration-200 outline-none resize-none text-base sm:text-lg leading-relaxed text-slate-900 font-medium ${
                  isPlaying
                    ? 'border-[#249144] bg-green-50/20 ring-2 ring-[#249144]/15 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 focus:border-[#249144] focus:bg-white focus:ring-2 focus:ring-[#249144]/15'
                }`}
              />

              {/* In-text action bar */}
              <div className="flex items-center justify-between px-1 mt-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${isPlaying ? 'bg-[#249144] animate-pulse motion-reduce:animate-none' : 'bg-slate-300'}`} />
                  <span className="text-xs text-slate-500 font-medium italic" aria-live="polite">
                    Status: {statusText}
                  </span>
                </div>
                {text.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 transition font-medium focus:outline-none py-1 px-2 -mr-1 rounded-md hover:bg-slate-100 touch-manipulation cursor-pointer"
                    title="Clear entered text"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Speech Tuning Panel (Rate & Pitch) */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-[#249144]" />
                <span>Speech Tuning</span>
              </div>
              {(rate !== 1.0 || pitch !== 1.0) && (
                <button
                  type="button"
                  onClick={handleResetTuning}
                  className="text-xs text-[#249144] hover:underline font-semibold cursor-pointer"
                >
                  Reset (1.0x)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {/* Speed / Rate Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <label htmlFor="tts-rate-slider">Speed / Rate</label>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 shadow-2xs">
                    {rate.toFixed(1)}x
                  </span>
                </div>
                <input
                  id="tts-rate-slider"
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  aria-label="Speech speed rate"
                  aria-valuemin={0.5}
                  aria-valuemax={1.5}
                  aria-valuenow={rate}
                  aria-valuetext={`${rate.toFixed(1)}x`}
                  className="w-full accent-[#249144] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#249144]/30 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
                  <span>0.5x (Slow)</span>
                  <span>1.0x (Standard)</span>
                  <span>1.5x (Fast)</span>
                </div>
              </div>

              {/* Pitch Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <label htmlFor="tts-pitch-slider">Pitch</label>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 shadow-2xs">
                    {pitch.toFixed(1)}
                  </span>
                </div>
                <input
                  id="tts-pitch-slider"
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  aria-label="Speech voice pitch"
                  aria-valuemin={0.5}
                  aria-valuemax={1.5}
                  aria-valuenow={pitch}
                  aria-valuetext={`${pitch.toFixed(1)}`}
                  className="w-full accent-[#249144] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#249144]/30 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
                  <span>0.5 (Low)</span>
                  <span>1.0 (Normal)</span>
                  <span>1.5 (High)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleSpeak}
                disabled={!text.trim()}
                className={`btn-mota w-full sm:w-auto px-7 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 shadow-md min-h-[46px] transition cursor-pointer ${
                  !text.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label={isPlaying ? 'Stop speech playback' : 'Generate and play speech'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Stop Speech</span>
                    {/* Subtle rhythmic waveform indicator */}
                    <div className="flex items-center gap-0.5 h-3.5 ml-1" aria-hidden="true">
                      <span className="w-1 h-2.5 bg-white/90 rounded-full animate-pulse motion-reduce:animate-none" />
                      <span className="w-1 h-3.5 bg-white/90 rounded-full animate-pulse delay-75 motion-reduce:animate-none" />
                      <span className="w-1 h-2 bg-white/90 rounded-full animate-pulse delay-150 motion-reduce:animate-none" />
                    </div>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Generate & Play Speech</span>
                  </>
                )}
              </button>

              {isPlaying && (
                <span className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#249144] bg-green-50 px-3 py-1.5 rounded-lg border border-[#d1ead4]">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse motion-reduce:animate-none" />
                  <span>Playing audio</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                onClick={handleDownload}
                disabled={!text.trim() || isDownloading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 hover:border-[#249144] hover:bg-green-50/50 text-slate-700 hover:text-[#249144] shadow-xs text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Download 16-bit PCM Audio (.wav)"
                aria-label="Download audio WAV file"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Exporting...' : 'Download WAV'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
