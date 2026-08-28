import React, { useState } from 'react';
import { Sparkles, Play, Image as ImageIcon, Music, Film, Filter, Volume2 } from 'lucide-react';
import { playTextSpeech } from '../../services/translationService';
import { GalleryFeatureCards } from '../../components/gallery/GalleryFeatureCards';

interface MediaItem {
  id: string;
  title: string;
  category: 'Audio' | 'Video' | 'Photo';
  tribe: string;
  region: string;
  imageUrl: string;
  description: string;
  audioText?: string;
  langCode?: string;
}

const MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'm-1',
    title: 'Sarhul Spring Festival Chants & Madal Drums',
    category: 'Audio',
    tribe: 'Munda & Santhal',
    region: 'Jharkhand',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
    description: 'Sacred oral hymns praising Mother Nature during the Sal blossoming season.',
    audioText: 'ᱡᱚᱦᱟᱨ • ᱥᱟᱨᱦᱩᱞ ᱯᱚᱨᱚᱵᱽ ᱨᱮ ᱥᱟᱨᱡᱚᱢ ᱵᱟᱦᱟ ᱠᱚ ᱯᱩᱡᱟᱹᱭᱟ᱾',
    langCode: 'sat'
  },
  {
    id: 'm-2',
    title: 'Bhagoria Haat & Flute Music',
    category: 'Audio',
    tribe: 'Bhil',
    region: 'Madhya Pradesh',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    description: 'Traditional instrumental melodies celebrating pre-Holi agricultural harvest.',
    audioText: 'हमारो गाम मां भगोरिया हाट मां मांदळ वाज्यो।',
    langCode: 'bhi'
  },
  {
    id: 'm-3',
    title: 'Warli Sacred Canvas Painting Documentation',
    category: 'Photo',
    tribe: 'Warli',
    region: 'Maharashtra',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&q=80',
    description: 'Ancestral geometric ritual motifs created with rice paste and mud background.'
  },
  {
    id: 'm-4',
    title: 'Toda Sacred Dairy Temple (Toda Tribe)',
    category: 'Photo',
    tribe: 'Toda',
    region: 'Nilgiris, Tamil Nadu',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=80',
    description: 'Unique barrel-vaulted sacred architecture of the Nilgiri pastoral community.'
  },
  {
    id: 'm-5',
    title: 'Wangala 100-Drums Harvest Celebration',
    category: 'Video',
    tribe: 'Garo',
    region: 'Meghalaya',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
    description: 'The great post-harvest thanksgiving ritual honoring Saljong (Sun God).'
  },
  {
    id: 'm-6',
    title: 'Gondi Epic Songs of Lingo Pen',
    category: 'Audio',
    tribe: 'Gond',
    region: 'Bastar, Chhattisgarh',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80',
    description: 'Oral Pardhan bardic recitations tracing the origins of the 750 Gond clans.',
    audioText: 'सेवा जोहार! बड़ादेव पेन ना कृपा मंतू।',
    langCode: 'gon'
  }
];

export const MediaGalleryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'All' | 'Audio' | 'Video' | 'Photo'>('All');

  const filteredMedia = MEDIA_ITEMS.filter(m => activeTab === 'All' || m.category === activeTab);

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* 3 Gallery Feature Showcase Cards (Exact match to screenshot) */}
        <GalleryFeatureCards />

        {/* Media Archive Section Divider & Header */}
        <div className="border-t border-slate-200/80 pt-12 mt-8">
          <div className="w-full flex flex-col items-center text-center mb-6">
            <h2 className="domine-bold text-2xl sm:text-3xl font-bold text-slate-800">
              Photo, Audio & Video Archives
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Filter through authentic multimedia recordings, ritual music, and photo documentation.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {(['All', 'Audio', 'Video', 'Photo'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${activeTab === tab ? 'bg-[#249144] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {tab === 'All' ? 'All Media' : tab}
            </button>
          ))}
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#86c498] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-video overflow-hidden bg-slate-900">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-full px-3 py-1 text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
                    {item.category === 'Audio' && <Music className="w-3 h-3 text-green-400" />}
                    {item.category === 'Video' && <Film className="w-3 h-3 text-red-400" />}
                    {item.category === 'Photo' && <ImageIcon className="w-3 h-3 text-blue-400" />}
                    <span>{item.category}</span>
                  </div>

                  {item.category === 'Audio' && (
                    <button
                      onClick={() => item.audioText && playTextSpeech(item.audioText, item.langCode || 'sat')}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition"
                      title="Play Audio Chants"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/90 text-[#249144] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Volume2 className="w-5 h-5" />
                      </div>
                    </button>
                  )}
                </div>

                <div className="p-6 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {item.tribe} Tribe • {item.region}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base leading-snug domine-bold">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
              </div>

              {item.category === 'Audio' && item.audioText && (
                <div className="p-6 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <button
                    onClick={() => playTextSpeech(item.audioText!, item.langCode || 'sat')}
                    className="text-xs font-bold text-[#249144] hover:underline flex items-center gap-1.5"
                  >
                    <Volume2 className="w-4 h-4" /> Listen Chants
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
