import React, { useState } from 'react';
import { HeartHandshake, Play, Sparkles, Filter, Activity, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { SCD_VIDEOS, SCD_DIALECT_FILTERS, SCD_INFOGRAPHICS, SCDVideo } from '../../data/scdData';

export const SCDAwarenessPage: React.FC = () => {
  const [selectedDialect, setSelectedDialect] = useState<string>('All');
  const [activeVideo, setActiveVideo] = useState<SCDVideo | null>(null);

  const filteredVideos = SCD_VIDEOS.filter(v => 
    selectedDialect === 'All' || v.language.toLowerCase() === selectedDialect.toLowerCase()
  );

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="w-full py-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-700 mb-3">
            <HeartHandshake className="w-3.5 h-3.5 text-red-600" /> National SCD Elimination Mission 2047
          </div>
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-semibold leading-snug text-gray-900">
            Sickle Cell Disease (SCD) Awareness Hub
          </h1>
          <div className="relative mt-3 w-32 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[3px] w-16 bg-red-500 rounded-full"></div>
          </div>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-500">
            Multilingual medical video guides, pre-marital genetic counseling, and awareness materials in 10+ tribal dialects.
          </p>
        </div>

        {/* Infographic Guide Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-8">
          
          {/* What is SCD */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase">
              <Activity className="w-4 h-4" /> Genetic Blood Disorder Overview
            </div>
            <h2 className="text-xl font-bold text-slate-900 domine-bold">
              {SCD_INFOGRAPHICS.whatIsScd.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
              {SCD_INFOGRAPHICS.whatIsScd.desc}
            </p>
            <div className="space-y-1.5 pt-2">
              {SCD_INFOGRAPHICS.whatIsScd.points.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#249144] flex-shrink-0 mt-0.5" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Screening Cards Guide */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#249144] uppercase">
              <ShieldAlert className="w-4 h-4" /> Color-Coded Health Status Cards
            </div>
            <h2 className="text-xl font-bold text-slate-900 domine-bold">
              Mission 2047 Screening Protocol
            </h2>
            <p className="text-xs text-slate-500">
              {SCD_INFOGRAPHICS.mission2047.target}
            </p>
            <div className="grid gap-2.5 pt-1">
              {SCD_INFOGRAPHICS.mission2047.cards.map((card, i) => (
                <div key={i} className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${card.color}`}>
                  <span className="font-bold">{card.type}</span>
                  <span className="text-[11px] max-w-[65%] text-right font-medium">{card.status}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Dialect Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 my-6 hide-scrollbar">
          {SCD_DIALECT_FILTERS.map((dialect, i) => (
            <button
              key={i}
              onClick={() => setSelectedDialect(dialect)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${selectedDialect === dialect ? 'bg-red-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {dialect}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => setActiveVideo(video)}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-red-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-md px-2 py-0.5 text-[10px] font-mono text-white">
                    {video.duration}
                  </div>

                  <div className="absolute bottom-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    {video.language} Dialect
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Region: {video.region}
                  </span>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-red-700 transition-colors">
                    {video.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {video.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-red-600 font-semibold">
                <span>Play Awareness Video →</span>
              </div>
            </div>
          ))}
        </div>

        {/* Video Player Modal */}
        {activeVideo && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col relative text-white">
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    {activeVideo.language} SCD Awareness Video
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                    {activeVideo.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&controls=1&rel=0`}
                  title={activeVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="p-5 bg-slate-900 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">Key Discussion Topics:</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeVideo.keyTopics.map((topic, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px]">
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
