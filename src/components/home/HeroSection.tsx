import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[85vh] lg:min-h-[92vh] w-full bg-[#fcfbf7] pt-24 pb-16 lg:pt-16 lg:pb-24 overflow-hidden flex items-center">
      
      {/* Soft Botanical Leafy Motifs (Top-Right & Bottom-Left) */}
      <div className="absolute -top-6 right-0 w-64 h-64 sm:w-80 sm:h-80 pointer-events-none opacity-40 select-none -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path d="M 120 20 Q 150 60, 190 80 Q 150 100, 110 90 Q 130 50, 120 20 Z" fill="#8ca68c" opacity="0.6" />
          <path d="M 140 10 Q 170 40, 200 50 Q 175 75, 140 60 Q 150 30, 140 10 Z" fill="#658865" opacity="0.5" />
          <path d="M 90 40 Q 130 65, 160 110 Q 120 115, 95 90 Q 85 60, 90 40 Z" fill="#9db69d" opacity="0.5" />
          <path d="M 70 80 Q 110 90, 130 140 Q 95 140, 75 120 Z" fill="#7a9a7a" opacity="0.5" />
          <circle cx="160" cy="140" r="3" fill="#658865" opacity="0.4" />
          <circle cx="175" cy="125" r="2" fill="#658865" opacity="0.4" />
        </svg>
      </div>

      <div className="absolute bottom-0 -left-6 w-64 h-64 sm:w-80 sm:h-80 pointer-events-none opacity-45 select-none -z-10">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path d="M 80 180 Q 50 140, 10 120 Q 50 100, 90 110 Q 70 150, 80 180 Z" fill="#8ca68c" opacity="0.6" />
          <path d="M 60 190 Q 30 160, 0 150 Q 25 125, 60 140 Q 50 170, 60 190 Z" fill="#658865" opacity="0.5" />
          <path d="M 110 160 Q 70 135, 40 90 Q 80 85, 105 110 Q 115 140, 110 160 Z" fill="#9db69d" opacity="0.5" />
          <path d="M 130 120 Q 90 110, 70 60 Q 105 60, 125 80 Z" fill="#7a9a7a" opacity="0.5" />
          <circle cx="40" cy="60" r="3" fill="#658865" opacity="0.4" />
          <circle cx="25" cy="75" r="2" fill="#658865" opacity="0.4" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Heading, Subtitle & CTA (Exact match to UI.png) */}
          <div className="flex flex-col space-y-6 sm:space-y-8 lg:col-span-6 text-center lg:text-left items-center lg:items-start">
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.12] tracking-tight text-[#1e293b]" style={{ fontFamily: "'Domine', Georgia, serif" }}>
              Translate{' '}
              <span className="text-[#1b5e3b]">
                Anything
              </span>
              <br />
              Instantly with AI
            </h1>

            <p className="max-w-md text-base text-slate-500 sm:text-lg md:text-xl font-normal leading-relaxed font-sans">
              Type or speak. Get translation in your language instantly.
            </p>

            <div className="pt-2 w-full sm:w-auto">
              <Link
                to="/features/text-to-text"
                className="bg-[#1b5e3b] hover:bg-[#14472c] text-white px-8 py-4 text-base font-semibold rounded-2xl inline-flex items-center gap-3 shadow-md hover:shadow-lg transition-all duration-200 group w-full sm:w-auto justify-center cursor-pointer active:scale-98"
              >
                <span>Try Translation Now</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

          </div>

          {/* Right Column: Globe, Open Book, Botanical Leaves & Orbiting Speech Bubbles (Exact match to UI.png) */}
          <div className="w-full lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full max-w-[520px] aspect-[1.1/1] flex items-center justify-center">
              
              {/* Soft Organic Beige/Sand Cloud Silhouette Backdrop */}
              <div className="absolute inset-2 sm:inset-4 bg-[#f4eee3] rounded-[48px] -z-10 opacity-90 scale-95 sm:scale-100" />
              <div className="absolute -bottom-4 right-10 w-48 h-20 bg-[#ebe2d3] rounded-full filter blur-xl -z-10 opacity-60" />

              {/* Main Illustration SVG (Globe + Book + Leaves + Bubbles) */}
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                
                {/* Orbiting Speech Bubbles Container */}
                <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center">
                  
                  {/* Subtle Dotted Orbit Ring */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 340 340">
                    <circle cx="170" cy="170" r="145" fill="none" stroke="#d5c8b2" strokeWidth="1.5" strokeDasharray="4 6" />
                  </svg>

                  {/* Bubble 1: Top - नमस्ते (Hindi) */}
                  <div className="absolute -top-2 sm:top-0 left-1/2 -translate-x-1/2 bg-[#faebd4] border border-[#e8d8be] px-4 py-1.5 rounded-full shadow-xs text-[#2d241e] font-semibold text-sm sm:text-base select-none">
                    नमस्ते
                  </div>

                  {/* Bubble 2: Left - Hello (English) */}
                  <div className="absolute top-1/4 -left-3 sm:left-0 bg-[#faebd4] border border-[#e8d8be] px-3.5 py-1.5 rounded-full shadow-xs text-[#2d241e] font-semibold text-xs sm:text-sm select-none">
                    Hello
                  </div>

                  {/* Bubble 3: Bottom Left - Johar (Tribal) */}
                  <div className="absolute bottom-1/4 -left-2 sm:left-2 bg-[#faebd4] border border-[#e8d8be] px-3.5 py-1.5 rounded-full shadow-xs text-[#2d241e] font-semibold text-xs sm:text-sm select-none">
                    Johar
                  </div>

                  {/* Bubble 4: Top Right - ᱡᱚᱦᱟᱨ (Ol Chiki Johar) */}
                  <div className="absolute top-1/4 -right-3 sm:right-0 bg-[#faebd4] border border-[#e8d8be] px-3.5 py-1.5 rounded-full shadow-xs text-[#2d241e] font-semibold text-xs sm:text-sm select-none font-sans">
                    ᱡᱚᱦᱟᱨ
                  </div>

                  {/* Bubble 5: Bottom Right - ᱥᱟᱱᱛᱟᱲᱤ (Santali) */}
                  <div className="absolute bottom-1/4 -right-2 sm:right-2 bg-[#faebd4] border border-[#e8d8be] px-3.5 py-1.5 rounded-full shadow-xs text-[#2d241e] font-semibold text-xs sm:text-sm select-none font-sans">
                    ᱥᱟᱱᱛᱟᱲᱤ
                  </div>

                  {/* Center Globe */}
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-[#dfd6c6] border-2 border-[#cfc4b0] relative overflow-hidden shadow-inner flex items-center justify-center">
                    <svg viewBox="0 0 160 160" className="w-full h-full">
                      {/* Meridian & Parallel Lines */}
                      <circle cx="80" cy="80" r="78" fill="#e5ddce" />
                      <ellipse cx="80" cy="80" rx="40" ry="78" fill="none" stroke="#cfc4b0" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="80" y1="2" x2="80" y2="158" stroke="#cfc4b0" strokeWidth="1" strokeDasharray="3 3" />
                      <line x1="2" y1="80" x2="158" y2="80" stroke="#cfc4b0" strokeWidth="1" strokeDasharray="3 3" />
                      <ellipse cx="80" cy="80" rx="78" ry="38" fill="none" stroke="#cfc4b0" strokeWidth="1" strokeDasharray="3 3" />

                      {/* Landmass Silhouettes in warm earth tone */}
                      <path d="M 60 30 Q 80 35, 95 45 Q 90 70, 75 75 Q 65 65, 55 50 Z" fill="#c3b49c" opacity="0.9" />
                      <path d="M 90 60 Q 110 50, 125 70 Q 115 100, 95 110 Q 85 90, 85 70 Z" fill="#c3b49c" opacity="0.9" />
                      <path d="M 40 85 Q 55 90, 60 115 Q 45 130, 35 110 Z" fill="#c3b49c" opacity="0.85" />
                      <path d="M 70 115 Q 90 120, 95 140 Q 80 145, 65 135 Z" fill="#c3b49c" opacity="0.85" />
                    </svg>
                  </div>

                </div>

                {/* Open Book with Sprouting Leaves below Globe */}
                <div className="relative -mt-12 sm:-mt-14 w-56 sm:w-68 flex flex-col items-center">
                  
                  {/* Sprouting Botanical Leaf Sprigs */}
                  <div className="absolute -top-8 left-6 w-16 h-16 pointer-events-none">
                    <svg viewBox="0 0 60 60" className="w-full h-full">
                      <path d="M 30 50 Q 20 30, 5 25 Q 20 20, 30 50" fill="#4d7358" />
                      <path d="M 30 45 Q 35 25, 20 15 Q 28 28, 30 45" fill="#6e967a" />
                      <path d="M 30 40 Q 40 30, 48 20 Q 38 35, 30 40" fill="#3a5a43" />
                    </svg>
                  </div>

                  <div className="absolute -top-8 right-6 w-16 h-16 pointer-events-none">
                    <svg viewBox="0 0 60 60" className="w-full h-full">
                      <path d="M 30 50 Q 40 30, 55 25 Q 40 20, 30 50" fill="#4d7358" />
                      <path d="M 30 45 Q 25 25, 40 15 Q 32 28, 30 45" fill="#6e967a" />
                      <path d="M 30 40 Q 20 30, 12 20 Q 22 35, 30 40" fill="#3a5a43" />
                    </svg>
                  </div>

                  {/* Open Book Vector */}
                  <svg viewBox="0 0 240 80" className="w-full h-auto drop-shadow-sm">
                    {/* Dark Green Cover */}
                    <path d="M 12 62 Q 120 74, 228 62 L 222 68 Q 120 80, 18 68 Z" fill="#1b5e3b" />
                    
                    {/* Left Page */}
                    <path d="M 120 60 Q 60 52, 14 58 L 14 36 Q 60 30, 120 40 Z" fill="#faebd4" stroke="#d5c8b2" strokeWidth="1" />
                    {/* Left Page Top Curve */}
                    <path d="M 120 40 Q 60 30, 14 36 L 20 32 Q 65 26, 120 38 Z" fill="#fff9ef" stroke="#e8dcbe" strokeWidth="0.8" />
                    
                    {/* Right Page */}
                    <path d="M 120 60 Q 180 52, 226 58 L 226 36 Q 180 30, 120 40 Z" fill="#faebd4" stroke="#d5c8b2" strokeWidth="1" />
                    {/* Right Page Top Curve */}
                    <path d="M 120 40 Q 180 30, 226 36 L 220 32 Q 175 26, 120 38 Z" fill="#fff9ef" stroke="#e8dcbe" strokeWidth="0.8" />

                    {/* Book Spine / Center Binding */}
                    <line x1="120" y1="38" x2="120" y2="62" stroke="#bda585" strokeWidth="2" strokeLinecap="round" />
                  </svg>

                  {/* Tagline below book: "Languages Connect People" with warm gold underline */}
                  <div className="mt-3 flex flex-col items-center">
                    <span className="font-handwriting text-2xl sm:text-3xl font-medium text-[#2d241e] tracking-wide select-none">
                      Languages Connect People
                    </span>
                    <svg viewBox="0 0 140 10" className="w-32 sm:w-36 h-2.5 mt-0.5">
                      <path d="M 5 5 Q 70 8, 135 4" fill="none" stroke="#c5a874" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
