import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-6 sm:gap-7 group">
      
      {/* Left: Illustrated Green Organic Cloud Badge (Exact match to Image 1) */}
      <div className="relative flex-shrink-0 w-32 h-32 flex items-center justify-center">
        {/* Organic Background Blob */}
        <div className="absolute inset-0 bg-[#e8f5ec] rounded-full scale-95 group-hover:scale-105 transition-transform duration-300"></div>
        
        {/* Floating Green Decorative Dots */}
        <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-[#86c498] opacity-60"></div>
        <div className="absolute top-6 right-1 w-1.5 h-1.5 rounded-full bg-[#249144] opacity-50"></div>
        <div className="absolute bottom-2 left-3 w-2.5 h-2.5 rounded-full bg-[#249144] opacity-70"></div>
        <div className="absolute bottom-4 right-2 w-2 h-2 rounded-full bg-[#86c498] opacity-60"></div>

        {/* Badge Illustration Content */}
        <div className="relative z-10 w-24 h-24 flex items-center justify-center">
          {badgeIllustration}
        </div>
      </div>

      {/* Right: Title, Description & Gradient Green Button */}
      <div className="flex flex-col justify-between flex-1 text-center sm:text-left">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed font-sans">
            {description}
          </p>
        </div>

        <div className="mt-4">
          <Link
            to={link}
            className="bg-gradient-to-b from-[#249144] to-[#14532d] hover:from-[#1b7536] hover:to-[#0f3e21] text-white px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl inline-flex items-center gap-2 shadow-xs transition-all duration-200 group-hover:shadow"
          >
            <span>Start Translating</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

    </div>
  );
};

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
      
      {/* Section Header (Exact Match to Image 1) */}
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1e293b] tracking-tight" style={{ fontFamily: "'Domine', Georgia, serif" }}>
          Our Features
        </h2>
        
        {/* Underline Bar with Centered Green Accent */}
        <div className="relative mt-3.5 w-36 sm:w-48 h-[2px] bg-slate-200">
          <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#249144] rounded-full"></div>
        </div>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-500 max-w-xl font-sans">
          Discover the powerful capabilities of our translation platform.
        </p>
      </div>

      {/* Grid of 6 Features */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        
        {/* 1. Text to Text Translation (A ⇄ अ speech bubble inside scanner corners) */}
        <FeatureCard
          title="Text to Text Translation"
          description="Instantly translate written text between languages with our AI-powered translation technology."
          link="/features/text-to-text"
          badgeIllustration={
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Green Corner Scanner Brackets */}
              <path d="M 22 34 L 22 24 L 34 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 34 L 78 24 L 66 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 22 66 L 22 76 L 34 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 66 L 78 76 L 66 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Speech Bubble with A */}
              <rect x="25" y="30" width="28" height="24" rx="6" fill="#ffffff" stroke="#249144" strokeWidth="2.5" />
              <text x="39" y="47" textAnchor="middle" fill="#1e293b" fontSize="15" fontWeight="bold" fontFamily="sans-serif">A</text>
              
              {/* Circular Arrows */}
              <path d="M 44 58 Q 50 62, 56 58" fill="none" stroke="#249144" strokeWidth="2" markerEnd="url(#arrow)" />
              <path d="M 56 42 Q 50 38, 44 42" fill="none" stroke="#249144" strokeWidth="2" />
              
              {/* Speech Bubble with अ */}
              <rect x="47" y="46" width="28" height="24" rx="6" fill="#ffffff" stroke="#249144" strokeWidth="2.5" />
              <text x="61" y="63" textAnchor="middle" fill="#1e293b" fontSize="14" fontWeight="bold" fontFamily="serif">अ</text>
            </svg>
          }
        />

        {/* 2. OCR (OCR Document inside scanner corners) */}
        <FeatureCard
          title="OCR"
          description="Extract and translate text from images or documents."
          link="/features/ocr"
          badgeIllustration={
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Green Corner Scanner Brackets */}
              <path d="M 22 34 L 22 24 L 34 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 34 L 78 24 L 66 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 22 66 L 22 76 L 34 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 66 L 78 76 L 66 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Document Sheet */}
              <rect x="32" y="28" width="36" height="44" rx="4" fill="#ffffff" stroke="#86c498" strokeWidth="2" />
              
              {/* OCR Text in document */}
              <text x="50" y="43" textAnchor="middle" fill="#249144" fontSize="10" fontWeight="900" fontFamily="sans-serif">OCR</text>
              
              {/* Text Lines */}
              <line x1="38" y1="50" x2="62" y2="50" stroke="#86c498" strokeWidth="2" strokeLinecap="round" />
              <line x1="38" y1="56" x2="58" y2="56" stroke="#86c498" strokeWidth="2" strokeLinecap="round" />
              <line x1="38" y1="62" x2="54" y2="62" stroke="#86c498" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
        />

        {/* 3. Speech to Text */}
        <FeatureCard
          title="Speech to Text"
          description="Convert spoken tribal dialects into accurate transcribed text in real-time."
          link="/features/speech-to-text"
          badgeIllustration={
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Green Corner Scanner Brackets */}
              <path d="M 22 34 L 22 24 L 34 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 34 L 78 24 L 66 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 22 66 L 22 76 L 34 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 66 L 78 76 L 66 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Microphone inside badge */}
              <rect x="42" y="30" width="16" height="24" rx="8" fill="#249144" />
              <path d="M 36 44 C 36 54, 64 54, 64 44" fill="none" stroke="#249144" strokeWidth="3" strokeLinecap="round" />
              <line x1="50" y1="54" x2="50" y2="66" stroke="#249144" strokeWidth="3" strokeLinecap="round" />
              <line x1="40" y1="66" x2="60" y2="66" stroke="#249144" strokeWidth="3" strokeLinecap="round" />
            </svg>
          }
        />

        {/* 4. Voice to Voice */}
        <FeatureCard
          title="Voice to Voice"
          description="Real-time two-way voice conversation translation in indigenous dialects."
          link="/features/speech-to-speech"
          badgeIllustration={
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Green Corner Scanner Brackets */}
              <path d="M 22 34 L 22 24 L 34 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 34 L 78 24 L 66 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 22 66 L 22 76 L 34 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 66 L 78 76 L 66 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Dual Conversational Waves */}
              <circle cx="50" cy="50" r="10" fill="#249144" />
              <path d="M 32 38 Q 26 50, 32 62" fill="none" stroke="#249144" strokeWidth="3" strokeLinecap="round" />
              <path d="M 68 38 Q 74 50, 68 62" fill="none" stroke="#249144" strokeWidth="3" strokeLinecap="round" />
              <path d="M 38 43 Q 34 50, 38 57" fill="none" stroke="#86c498" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 62 43 Q 66 50, 62 57" fill="none" stroke="#86c498" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          }
        />

        {/* 5. Text to Speech */}
        <FeatureCard
          title="Text to Speech"
          description="Convert written tribal literature into natural-sounding neural speech."
          link="/features/text-to-speech"
          badgeIllustration={
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Green Corner Scanner Brackets */}
              <path d="M 22 34 L 22 24 L 34 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 34 L 78 24 L 66 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 22 66 L 22 76 L 34 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 66 L 78 76 L 66 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Speaker with Audio Waves */}
              <path d="M 34 42 L 44 42 L 54 32 L 54 68 L 44 58 L 34 58 Z" fill="#249144" />
              <path d="M 62 40 Q 68 50, 62 60" fill="none" stroke="#249144" strokeWidth="3" strokeLinecap="round" />
              <path d="M 68 34 Q 78 50, 68 66" fill="none" stroke="#86c498" strokeWidth="3" strokeLinecap="round" />
            </svg>
          }
        />

        {/* 6. Video Subtitle */}
        <FeatureCard
          title="Video Subtitle"
          description="Neural video subtitling for educational and government broadcasts."
          link="/features/video-subtitle"
          badgeIllustration={
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Green Corner Scanner Brackets */}
              <path d="M 22 34 L 22 24 L 34 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 34 L 78 24 L 66 24" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 22 66 L 22 76 L 34 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 78 66 L 78 76 L 66 76" fill="none" stroke="#249144" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Video Player Display */}
              <rect x="28" y="32" width="44" height="36" rx="4" fill="#ffffff" stroke="#249144" strokeWidth="2.5" />
              <polygon points="45,43 45,57 58,50" fill="#249144" />
              {/* CC Subtitle lines */}
              <line x1="34" y1="62" x2="48" y2="62" stroke="#86c498" strokeWidth="2" strokeLinecap="round" />
              <line x1="52" y1="62" x2="66" y2="62" stroke="#86c498" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
        />


      </div>
    </section>
  );
};
