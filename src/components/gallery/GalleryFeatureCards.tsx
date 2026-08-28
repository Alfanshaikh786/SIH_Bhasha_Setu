import React from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Heart, Mic2, ArrowRight } from 'lucide-react';

export const GalleryFeatureCards: React.FC = () => {
  return (
    <div className="w-full mb-12">
      {/* Section Header (Exact Match to User Screenshot) */}
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1e293b] tracking-tight" style={{ fontFamily: "'Domine', Georgia, serif" }}>
          Bhasha Setu Media Gallery
        </h1>

        {/* Underline Bar with Centered Green Accent */}
        <div className="relative mt-3.5 w-36 sm:w-48 h-[2px] bg-slate-200">
          <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#249144] rounded-full"></div>
        </div>

        <p className="mt-4 text-sm sm:text-base text-slate-500 max-w-2xl font-sans leading-relaxed">
          Explore translated national speeches, health awareness campaigns, and event photo archives dedicated to indigenous languages.
        </p>
      </div>

      {/* 3 Gallery Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Media & Event Gallery */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-4">
            {/* Top Row: Icon Badge + Pill Tag */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#249144] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className="rounded-full bg-[#f0fdf4] border border-[#dcfce7] px-3 py-1 text-[11px] font-semibold text-emerald-800">
                Event Albums & Photos
              </span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Media & Event Gallery
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Photo Albums & Event Coverage
              </p>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
              Browse photo archives from national summits, field voice recording drives, and community workshops across India.
            </p>
          </div>

          {/* Action Link */}
          <div className="pt-6 border-t border-slate-100 mt-6">
            <Link
              to="/gallery/media"
              className="text-xs sm:text-sm font-bold text-[#249144] hover:text-[#1a7536] inline-flex items-center gap-1.5 transition-colors group-hover:translate-x-0.5"
            >
              <span>Explore Media Gallery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Sickle Cell Disease Awareness */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-4">
            {/* Top Row: Icon Badge + Pill Tag */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <span className="rounded-full bg-[#f0fdf4] border border-[#dcfce7] px-3 py-1 text-[11px] font-semibold text-emerald-800">
                Health & Medical
              </span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h3 className="text-lg font-bold text-[#249144] tracking-tight">
                Sickle Cell Disease Awareness
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Multilingual Health Campaigns
              </p>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
              Educational awareness videos and prevention guides in Bhili, Baigani, Odia, Kui, Kuvi Khond, and Habli dialects.
            </p>
          </div>

          {/* Action Link */}
          <div className="pt-6 border-t border-slate-100 mt-6">
            <Link
              to="/gallery/scd-awareness"
              className="text-xs sm:text-sm font-bold text-[#249144] hover:text-[#1a7536] inline-flex items-center gap-1.5 transition-colors group-hover:translate-x-0.5"
            >
              <span>Watch Awareness Videos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: VVIP Speeches */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
          <div className="space-y-4">
            {/* Top Row: Icon Badge + Pill Tag */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Mic2 className="w-6 h-6" />
              </div>
              <span className="rounded-full bg-[#f0fdf4] border border-[#dcfce7] px-3 py-1 text-[11px] font-semibold text-emerald-800">
                Speeches & Leadership
              </span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                VVIP Speeches
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Leadership Addresses in Dialects
              </p>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">
              Historical speeches by Hon'ble President & Prime Minister translated into Gondi, Mundari, and tribal languages.
            </p>
          </div>

          {/* Action Link */}
          <div className="pt-6 border-t border-slate-100 mt-6">
            <Link
              to="/gallery/vvip-speeches"
              className="text-xs sm:text-sm font-bold text-[#249144] hover:text-[#1a7536] inline-flex items-center gap-1.5 transition-colors group-hover:translate-x-0.5"
            >
              <span>Listen to VVIP Speeches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
