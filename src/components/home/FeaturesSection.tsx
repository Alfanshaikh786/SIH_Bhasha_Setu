import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  link: string;
  badgeIllustration: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  link,
  badgeIllustration
}) => {
  return (
    <div className="bg-[#faf8f4] rounded-[24px] border border-[#eae3d5] shadow-xs hover:shadow-md hover:border-[#8ca68c] transition-all duration-300 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-7 group">
      
      {/* Left: Illustrated Disc with Botanical Foliage & Scanner Brackets (Exact match to UI2.png) */}
      <div className="relative flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
        {/* Soft Organic Beige Disc */}
        <div className="absolute inset-1 bg-[#ede5d6] rounded-full scale-95 group-hover:scale-100 transition-transform duration-300" />
        
        {/* Watercolor Botanical Leaf Sprigs */}
        <div className="absolute -bottom-1 -left-2 w-10 h-10 pointer-events-none">
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <path d="M 25 35 Q 10 25, 5 10 Q 20 15, 25 35" fill="#587d60" />
            <path d="M 28 32 Q 35 15, 20 5 Q 22 20, 28 32" fill="#7a9e82" />
          </svg>
        </div>

        <div className="absolute -top-1 -right-1 w-8 h-8 pointer-events-none">
          <svg viewBox="0 0 30 30" className="w-full h-full">
            <path d="M 10 25 Q 15 10, 28 5 Q 20 18, 10 25" fill="#698e71" />
          </svg>
        </div>

        {/* Small Decorative Green Dots */}
        <div className="absolute top-2 left-3 w-1.5 h-1.5 rounded-full bg-[#587d60] opacity-60" />
        <div className="absolute bottom-3 right-4 w-2 h-2 rounded-full bg-[#587d60] opacity-50" />

        {/* Inner Badge Illustration */}
        <div className="relative z-10 w-20 h-20 flex items-center justify-center">
          {badgeIllustration}
        </div>
      </div>

      {/* Right: Title, Description & Green CTA Button */}
      <div className="flex flex-col justify-between flex-1 text-center sm:text-left h-full">
        <div>
          <h3 className="text-xl font-bold text-[#1e293b] tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed font-sans">
            {description}
          </p>
        </div>

        <div className="mt-5">
          <Link
            to={link}
            className="bg-[#1b5e3b] hover:bg-[#14472c] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl inline-flex items-center gap-2 shadow-xs transition-all duration-200 group-hover:shadow cursor-pointer active:scale-98"
          >
            <span>Start Translating</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

    </div>
  );
};

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#fcfbf7] border-t border-[#ede7dc] relative overflow-hidden">
      
      {/* Decorative Botanical Foliage in Background */}
      <div className="absolute top-12 -left-8 w-56 h-56 pointer-events-none opacity-35 select-none -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path d="M 60 140 Q 20 80, 40 20 Q 90 60, 60 140 Z" fill="#8ca68c" />
          <path d="M 80 120 Q 50 60, 100 20 Q 110 80, 80 120 Z" fill="#658865" />
          <path d="M 100 130 Q 80 90, 130 50 Q 140 100, 100 130 Z" fill="#9db69d" />
          <circle cx="140" cy="80" r="3" fill="#658865" />
          <circle cx="160" cy="100" r="2" fill="#658865" />
        </svg>
      </div>

      <div className="absolute top-12 -right-8 w-56 h-56 pointer-events-none opacity-35 select-none -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path d="M 140 140 Q 180 80, 160 20 Q 110 60, 140 140 Z" fill="#8ca68c" />
          <path d="M 120 120 Q 150 60, 100 20 Q 90 80, 120 120 Z" fill="#658865" />
          <path d="M 100 130 Q 120 90, 70 50 Q 60 100, 100 130 Z" fill="#9db69d" />
          <circle cx="60" cy="80" r="3" fill="#658865" />
          <circle cx="40" cy="100" r="2" fill="#658865" />
        </svg>
      </div>

      {/* Header Banner (Exact match to UI3.png) */}
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center mb-10 sm:mb-14 relative z-10">
        
        {/* Open Book Icon in Circular Cream Disc with Foliage */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#faebd4] border border-[#e8d8be] flex items-center justify-center shadow-xs">
            <BookOpen className="w-7 h-7 text-[#b59567]" />
          </div>
          {/* Leaf sprigs flanking the disc */}
          <div className="absolute -left-5 top-1 w-6 h-6">
            <svg viewBox="0 0 30 30" className="w-full h-full">
              <path d="M 20 20 Q 5 15, 2 5 Q 15 8, 20 20" fill="#698e71" />
            </svg>
          </div>
          <div className="absolute -right-5 top-1 w-6 h-6">
            <svg viewBox="0 0 30 30" className="w-full h-full">
              <path d="M 10 20 Q 25 15, 28 5 Q 15 8, 10 20" fill="#698e71" />
            </svg>
          </div>
          <div className="absolute -top-1 -right-6 w-1.5 h-1.5 rounded-full bg-[#587d60] opacity-70" />
          <div className="absolute bottom-0 -left-6 w-2 h-2 rounded-full bg-[#587d60] opacity-50" />
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1e293b] tracking-tight" style={{ fontFamily: "'Domine', Georgia, serif" }}>
          Our <span className="text-[#1b5e3b]">Features</span>
        </h2>
        
        {/* Horizontal Divider with Centered Green Accent */}
        <div className="relative mt-3.5 w-36 sm:w-48 h-[2px] bg-slate-200">
          <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#1b5e3b] rounded-full" />
        </div>

        {/* Subtitle */}
        <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-500 max-w-xl font-sans">
          Discover the powerful capabilities of our translation platform.
        </p>

        {/* Gold Curved Brush Stroke Accent */}
        <svg viewBox="0 0 160 12" className="w-36 sm:w-44 h-3 mt-2">
          <path d="M 5 6 Q 80 10, 155 4" fill="none" stroke="#c5a874" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        </svg>

      </div>

      {/* Cursive Pill Badge: "Different Languages A Brighter Tomorrow" (From UI2.png) */}
      <div className="max-w-6xl mx-auto flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#f4ece0] border border-[#e8dcc8] shadow-2xs">
          <span className="font-handwriting text-xl sm:text-2xl text-[#6b4e2e] font-semibold tracking-wide">
            Different Languages A Brighter Tomorrow
          </span>
        </div>
      </div>

      {/* Grid of 6 Features (Exact match to UI2.png) */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 relative z-10">
        
        {/* 1. Text to Text Translation */}
        <FeatureCard
          title="Text to Text Translation"
          description="Instantly translate written text between languages with our AI-powered translation technology."
          link="/features/text-to-text"
          badgeIllustration={
            <svg viewBox="0 0 80 80" className="w-full h-full">
              {/* Corner brackets */}
              <path d="M 14 26 L 14 16 L 24 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 26 L 66 16 L 56 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 14 54 L 14 64 L 24 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 54 L 66 64 L 56 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Speech bubble A */}
              <rect x="18" y="24" width="24" height="20" rx="5" fill="#ffffff" stroke="#1b5e3b" strokeWidth="2" />
              <text x="30" y="38" textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="bold" fontFamily="sans-serif">A</text>
              
              {/* Speech bubble अ */}
              <rect x="38" y="36" width="24" height="20" rx="5" fill="#ffffff" stroke="#1b5e3b" strokeWidth="2" />
              <text x="50" y="50" textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="bold" fontFamily="serif">अ</text>
            </svg>
          }
        />

        {/* 2. OCR */}
        <FeatureCard
          title="OCR"
          description="Extract and translate text from images or documents."
          link="/features/ocr"
          badgeIllustration={
            <svg viewBox="0 0 80 80" className="w-full h-full">
              <path d="M 14 26 L 14 16 L 24 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 26 L 66 16 L 56 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 14 54 L 14 64 L 24 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 54 L 66 64 L 56 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Document Sheet */}
              <rect x="25" y="22" width="30" height="36" rx="4" fill="#ffffff" stroke="#7a9e82" strokeWidth="2" />
              <text x="40" y="35" textAnchor="middle" fill="#1b5e3b" fontSize="9" fontWeight="900" fontFamily="sans-serif">OCR</text>
              <line x1="30" y1="42" x2="50" y2="42" stroke="#7a9e82" strokeWidth="2" strokeLinecap="round" />
              <line x1="30" y1="48" x2="46" y2="48" stroke="#7a9e82" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
        />

        {/* 3. Speech to Text */}
        <FeatureCard
          title="Speech to Text"
          description="Convert spoken tribal dialects into accurate transcribed text in real-time."
          link="/features/speech-to-text"
          badgeIllustration={
            <svg viewBox="0 0 80 80" className="w-full h-full">
              <path d="M 14 26 L 14 16 L 24 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 26 L 66 16 L 56 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 14 54 L 14 64 L 24 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 54 L 66 64 L 56 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Microphone */}
              <rect x="34" y="24" width="12" height="20" rx="6" fill="#1b5e3b" />
              <path d="M 28 35 C 28 44, 52 44, 52 35" fill="none" stroke="#1b5e3b" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="40" y1="44" x2="40" y2="52" stroke="#1b5e3b" strokeWidth="2.5" />
              <line x1="32" y1="52" x2="48" y2="52" stroke="#1b5e3b" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          }
        />

        {/* 4. Voice to Voice (S2S) */}
        <FeatureCard
          title="Voice to Voice"
          description="Real-time two-way voice conversation translation in indigenous dialects."
          link="/features/speech-to-speech"
          badgeIllustration={
            <svg viewBox="0 0 80 80" className="w-full h-full">
              <path d="M 14 26 L 14 16 L 24 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 26 L 66 16 L 56 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 14 54 L 14 64 L 24 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 54 L 66 64 L 56 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Audio waves / concentric circles */}
              <circle cx="40" cy="40" r="5" fill="#1b5e3b" />
              <path d="M 32 32 Q 28 40, 32 48" fill="none" stroke="#1b5e3b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 48 32 Q 52 40, 48 48" fill="none" stroke="#1b5e3b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 26 26 Q 20 40, 26 54" fill="none" stroke="#1b5e3b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 54 26 Q 60 40, 54 54" fill="none" stroke="#1b5e3b" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          }
        />

        {/* 5. Text to Speech */}
        <FeatureCard
          title="Text to Speech"
          description="Convert written tribal literature into natural-sounding neural speech."
          link="/features/text-to-speech"
          badgeIllustration={
            <svg viewBox="0 0 80 80" className="w-full h-full">
              <path d="M 14 26 L 14 16 L 24 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 26 L 66 16 L 56 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 14 54 L 14 64 L 24 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 54 L 66 64 L 56 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Megaphone / Speaker */}
              <path d="M 26 34 L 34 34 L 44 26 L 44 54 L 34 46 L 26 46 Z" fill="#1b5e3b" stroke="#1b5e3b" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 49 34 Q 53 40, 49 46" fill="none" stroke="#1b5e3b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 54 29 Q 60 40, 54 51" fill="none" stroke="#1b5e3b" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          }
        />

        {/* 6. Video Subtitle */}
        <FeatureCard
          title="Video Subtitle"
          description="Neural video subtitling for educational and government broadcasts."
          link="/features/video-subtitle"
          badgeIllustration={
            <svg viewBox="0 0 80 80" className="w-full h-full">
              <path d="M 14 26 L 14 16 L 24 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 26 L 66 16 L 56 16" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 14 54 L 14 64 L 24 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 66 54 L 66 64 L 56 64" fill="none" stroke="#1b5e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Video Monitor */}
              <rect x="24" y="24" width="32" height="24" rx="4" fill="#ffffff" stroke="#1b5e3b" strokeWidth="2.5" />
              <polygon points="36,31 46,36 36,41" fill="#1b5e3b" />
              <line x1="33" y1="52" x2="47" y2="52" stroke="#1b5e3b" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="40" y1="48" x2="40" y2="52" stroke="#1b5e3b" strokeWidth="2" />
            </svg>
          }
        />

      </div>

      {/* Bottom Right Cursive Tagline (UI2.png) */}
      <div className="max-w-6xl mx-auto flex justify-end mt-10">
        <div className="flex flex-col items-end">
          <span className="font-handwriting text-2xl text-[#2d241e] font-medium tracking-wide">
            Languages Connect People
          </span>
          <svg viewBox="0 0 120 8" className="w-28 h-2 mt-0.5">
            <path d="M 5 4 Q 60 7, 115 3" fill="none" stroke="#c5a874" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

    </section>
  );
};

export default FeaturesSection;
