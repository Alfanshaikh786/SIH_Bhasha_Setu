import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[85vh] lg:min-h-[90vh] w-full bg-[#fbfdfb] pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden flex items-center">
      
      {/* Decorative Tribal Background Art (Top-Left & Top-Right Mandalas) */}
      <div className="absolute top-0 left-0 w-72 h-72 sm:w-96 sm:h-96 pointer-events-none opacity-25 select-none -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full text-[#86c498] fill-none stroke-current" strokeWidth="1.5">
          <circle cx="20" cy="20" r="40" strokeDasharray="3 3" />
          <circle cx="20" cy="20" r="70" />
          <circle cx="20" cy="20" r="100" strokeDasharray="6 6" />
          <circle cx="20" cy="20" r="130" />
          <circle cx="20" cy="20" r="160" strokeDasharray="4 4" />
          <path d="M20 20 L160 20 M20 20 L120 120 M20 20 L20 160 M20 20 L90 140 M20 20 L140 90" strokeOpacity="0.4" />
        </svg>
      </div>

      <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 pointer-events-none opacity-25 select-none -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full text-[#86c498] fill-none stroke-current" strokeWidth="1.5">
          <circle cx="180" cy="20" r="40" strokeDasharray="3 3" />
          <circle cx="180" cy="20" r="70" />
          <circle cx="180" cy="20" r="100" strokeDasharray="6 6" />
          <circle cx="180" cy="20" r="130" />
          <circle cx="180" cy="20" r="160" strokeDasharray="4 4" />
          <path d="M180 20 L40 20 M180 20 L80 120 M180 20 L180 160 M180 20 L110 140 M180 20 L60 90" strokeOpacity="0.4" />
        </svg>
      </div>

      {/* Decorative Bottom Nature Elements (Soft mint rolling hills, traditional hut, trees, birds) */}
      <div className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none opacity-40 select-none -z-10 flex items-end justify-between px-6 sm:px-16 overflow-hidden">
        {/* Left Hill with Traditional Hut */}
        <div className="relative w-64 sm:w-80 h-32">
          <svg viewBox="0 0 300 150" className="w-full h-full fill-[#e8f5ec] stroke-[#86c498]" strokeWidth="1.5">
            <path d="M-50 150 Q 80 50, 240 150 Z" />
            <path d="M80 120 L105 85 L130 120 Z" fill="#ffffff" stroke="#86c498" strokeWidth="2" />
            <path d="M90 120 L90 105 L120 105 L120 120" fill="#ffffff" stroke="#86c498" strokeWidth="1.5" />
            <path d="M40 40 Q 48 34, 56 40 Q 64 34, 72 40" fill="none" stroke="#249144" strokeWidth="1.5" />
            <path d="M140 30 Q 146 25, 152 30 Q 158 25, 164 30" fill="none" stroke="#249144" strokeWidth="1.5" />
            <path d="M170 50 Q 175 46, 180 50 Q 185 46, 190 50" fill="none" stroke="#249144" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Right Hill with Tree & Birds */}
        <div className="relative w-64 sm:w-80 h-32 hidden sm:block">
          <svg viewBox="0 0 300 150" className="w-full h-full fill-[#e8f5ec] stroke-[#86c498]" strokeWidth="1.5">
            <path d="M60 150 Q 220 50, 350 150 Z" />
            <circle cx="230" cy="90" r="30" fill="#d1ead4" stroke="#86c498" strokeWidth="1.5" />
            <line x1="230" y1="120" x2="230" y2="150" stroke="#86c498" strokeWidth="2" />
            <path d="M90 45 Q 96 40, 102 45 Q 108 40, 114 45" fill="none" stroke="#249144" strokeWidth="1.5" />
            <path d="M130 65 Q 135 61, 140 65 Q 145 61, 150 65" fill="none" stroke="#249144" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
          
          {/* Left Column: Heading, Subtitle & Call to Action (Exact match to User Screenshot) */}
          <div className="flex flex-col space-y-6 sm:space-y-8 lg:col-span-7">
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.12] tracking-tight text-[#1e293b]" style={{ fontFamily: "'Domine', Georgia, serif" }}>
              Translate{' '}
              <span className="text-[#249144]">
                Anything
              </span>
              <br />
              Instantly with AI
            </h1>

            <p className="max-w-lg text-base text-slate-500 sm:text-lg md:text-xl font-normal leading-relaxed font-sans">
              Type or speak. Get translation in your language instantly.
            </p>

            <div className="pt-2">
              <Link
                to="/features/text-to-text"
                className="bg-[#249144] hover:bg-[#1a7536] text-white px-8 py-4 text-base font-semibold rounded-2xl inline-flex items-center gap-2.5 shadow-lg shadow-green-900/15 hover:shadow-xl transition-all duration-200 group w-full sm:w-max justify-center"
              >
                <span>Try Translation Now</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

          </div>

          {/* Right Column: Left intentionally clean and open as requested */}
          <div className="hidden lg:block lg:col-span-5" />

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
