import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { AdiVaaniLogo } from '../common/AdiVaaniLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-slate-900 border-t border-slate-200 mt-auto">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12 pt-16 lg:pt-20 pb-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          
          {/* Col 1: Brand & Addresses */}
          <div className="space-y-5">
            <Link to="/" className="flex items-center gap-3">
              <AdiVaaniLogo size="md" />
            </Link>

            <div className="space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#249144] flex-shrink-0" />
                Address:
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 pl-5">
                Sahyadri College of Engineering and Management, Mangaluru
              </p>
            </div>

            <div className="space-y-1.5 text-sm text-slate-600">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#249144] flex-shrink-0" />
                Email:
              </p>
              <a
                href="mailto:alfanshaikh902@gmail.com"
                className="text-xs sm:text-sm font-medium text-[#249144] hover:underline block break-all pl-5"
              >
                alfanshaikh902@gmail.com
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900">Quick Links</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/" className="hover:text-[#249144] transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/features/learning-studio" className="hover:text-[#249144] transition-colors font-semibold text-[#14532d]">
                  🎓 Learning Studio (Flashcards & Worksheets)
                </Link>
              </li>
              <li>
                <Link to="/about-us" className="hover:text-[#249144] transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact-us" className="hover:text-[#249144] transition-colors">Contact & Feedback</Link>
              </li>
              <li>
                <Link to="/vaani-stream" className="hover:text-[#249144] transition-colors">Vaani Stream (Live)</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#249144] transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources & Features */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900">Resources & AI Tools</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/features/text-to-text" className="hover:text-[#249144] transition-colors">Text-to-Text Translation</Link>
              </li>
              <li>
                <Link to="/features/ocr" className="hover:text-[#249144] transition-colors">OCR Text Extraction</Link>
              </li>
              <li>
                <Link to="/features/speech-to-text" className="hover:text-[#249144] transition-colors">Speech-to-Text ASR</Link>
              </li>
              <li>
                <Link to="/features/speech-to-speech" className="hover:text-[#249144] transition-colors">Voice-to-Voice Dialogue</Link>
              </li>
              <li>
                <Link to="/features/video-subtitle" className="hover:text-[#249144] transition-colors">Video Subtitling</Link>
              </li>
              <li>
                <Link to="/resources/dictionary" className="hover:text-[#249144] transition-colors">Multilingual Dictionary</Link>
              </li>
              <li>
                <span className="hover:text-[#249144] transition-colors cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-offline-modal'))}>Offline Mode</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Sahyadri College of Engineering and Management. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
