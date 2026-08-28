import React, { useState } from 'react';
import { Film, Play, Sparkles, Filter, UserCheck, Calendar, Clock, Subtitles, X } from 'lucide-react';
import { VVIP_SPEECHES, VVIPSpeech } from '../../data/speechesData';

export const VVIPSpeechesPage: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<string>('All');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('All');
  const [activeVideoModal, setActiveVideoModal] = useState<VVIPSpeech | null>(null);

  const languages = ['All', ...Array.from(new Set(VVIP_SPEECHES.map(s => s.language)))];

  const filteredSpeeches = VVIP_SPEECHES.filter(s => {
    const matchLang = selectedLang === 'All' || s.language === selectedLang;
    const matchSpeaker = selectedSpeaker === 'All' || s.speaker.includes(selectedSpeaker);
    return matchLang && matchSpeaker;
  });

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="w-full py-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-green-50 border border-[#d1ead4] text-xs font-bold text-[#14532d] mb-3">
            <Film className="w-3.5 h-3.5 text-[#249144]" /> National Leadership Addresses
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            VVIP Speeches Gallery
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-[#86c498] rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-500">
            Watch national addresses by the Hon'ble Prime Minister and Hon'ble President with synchronized AI-generated subtitles in indigenous tribal languages.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm my-8 space-y-4">
          {/* Speaker Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2">Speaker:</span>
            {['All', 'Narendra Modi', 'Droupadi Murmu'].map((sp, i) => (
              <button
                key={i}
                onClick={() => setSelectedSpeaker(sp)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${selectedSpeaker === sp ? 'bg-[#249144] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {sp === 'All' ? 'All Speakers' : sp}
              </button>
            ))}
          </div>

          {/* Language Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2 flex-shrink-0">Subtitles:</span>
            {languages.map((l, i) => (
              <button
                key={i}
                onClick={() => setSelectedLang(l)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${selectedLang === l ? 'bg-[#14532d] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Speeches Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpeeches.map((speech) => (
            <div
              key={speech.id}
              onClick={() => setActiveVideoModal(speech)}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#86c498] transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* YouTube Thumbnail Preview */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${speech.youtubeId}/hqdefault.jpg`}
                    alt={speech.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-md px-2 py-0.5 text-[10px] font-mono text-white">
                    {speech.duration}
                  </div>

                  <div className="absolute bottom-3 left-3 bg-[#249144] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Subtitles className="w-3 h-3" /> {speech.language} Subtitles
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-[#249144] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <Calendar className="w-3 h-3" /> {speech.date}
                    <span>•</span>
                    <span className="font-semibold text-slate-600">{speech.speakerRole}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-[#249144] transition-colors">
                    {speech.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {speech.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-[#249144] font-semibold">
                <span>Watch with Subtitles →</span>
              </div>
            </div>
          ))}
        </div>

        {/* Video Player Modal */}
        {activeVideoModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col relative text-white">
              
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
                    {activeVideoModal.language} Synchronized Edition
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                    {activeVideoModal.title}
                  </h3>
                </div>

                <button
                  onClick={() => setActiveVideoModal(null)}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideoModal.youtubeId}?autoplay=1&controls=1&rel=0`}
                  title={activeVideoModal.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="p-6 bg-slate-900/90 max-h-48 overflow-y-auto space-y-2 text-xs text-slate-300">
                <p className="font-bold text-white text-xs uppercase tracking-wider">Full Transcript:</p>
                {activeVideoModal.subtitles.map((sub, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                    <p className="text-emerald-400 font-bold">{sub.textNative}</p>
                    <p className="text-slate-400 italic">{sub.textEn}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
};
