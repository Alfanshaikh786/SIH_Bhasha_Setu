import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Languages, 
  ScanText, 
  Mic, 
  Volume2, 
  Video, 
  BookOpen, 
  BookMarked, 
  FileText, 
  Target, 
  Image as ImageIcon, 
  Mic2, 
  Lightbulb, 
  Radio, 
  ChevronDown, 
  ChevronUp, 
  Menu, 
  X, 
  ArrowRight, 
  Smartphone, 
  GraduationCap,
  Layers,
  Award,
  FileSpreadsheet,
  Wifi,
  WifiOff,
  Zap,
  CheckCircle2,
  Shield,
  Globe
} from 'lucide-react';
import { BhashaSetuLogo } from '../common/BhashaSetuLogo';
import { LoginModal } from '../common/LoginModal';
import { getCurrentUser, logoutUser } from '../../services/authService';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineActivating, setOfflineActivating] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync auth state
  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, [location.pathname, loginOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu & dropdowns on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Listen for open-offline-modal events from footer/other components
  useEffect(() => {
    const handleOpenOffline = () => setOfflineModalOpen(true);
    window.addEventListener('open-offline-modal', handleOpenOffline);
    return () => window.removeEventListener('open-offline-modal', handleOpenOffline);
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleOfflineToggle = () => {
    setOfflineActivating(true);
    setTimeout(() => {
      setIsOfflineMode(prev => !prev);
      setOfflineActivating(false);
    }, 1200);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100/90 shadow-sm transition-all duration-200">
        <div ref={dropdownRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Left: Official Bhasha Setu Logo */}
            <Link to="/" className="flex items-center group transition-transform hover:opacity-95">
              <BhashaSetuLogo size="md" />
            </Link>

            {/* Center Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-3">
              
              {/* Home */}
              <Link
                to="/"
                className={`font-medium transition-colors py-1.5 px-3.5 rounded-xl text-sm ${
                  location.pathname === '/'
                    ? 'text-[#14532d] bg-[#dcfce7] font-semibold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Home
              </Link>

              {/* 1. Features Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('features')}
                  className={`font-medium transition-all flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-sm ${
                    activeDropdown === 'features' || location.pathname.startsWith('/features')
                      ? 'text-[#14532d] bg-[#dcfce7] font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>Features</span>
                  {activeDropdown === 'features' ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#14532d]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Features Mega Panel */}
                {activeDropdown === 'features' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[680px] bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 grid gap-4 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                    <div className="border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        FEATURES
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Text to Text */}
                      <Link
                        to="/features/text-to-text"
                        className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition group bg-white shadow-xs"
                      >
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#249144] flex items-center justify-center flex-shrink-0 group-hover:bg-[#249144] group-hover:text-white transition">
                          <Languages className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#14532d]">Text to Text Translation</p>
                          <p className="text-xs text-slate-500 mt-0.5">Type in any tribal language</p>
                        </div>
                      </Link>

                      {/* OCR */}
                      <Link
                        to="/features/ocr"
                        className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition group bg-white shadow-xs"
                      >
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#249144] flex items-center justify-center flex-shrink-0 group-hover:bg-[#249144] group-hover:text-white transition">
                          <ScanText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#14532d]">OCR</p>
                          <p className="text-xs text-slate-500 mt-0.5">Extract and translate from images</p>
                        </div>
                      </Link>

                      {/* Speech to Text */}
                      <Link
                        to="/features/speech-to-text"
                        className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition group bg-white shadow-xs"
                      >
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#249144] flex items-center justify-center flex-shrink-0 group-hover:bg-[#249144] group-hover:text-white transition">
                          <Mic className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#14532d]">Speech to Text</p>
                          <p className="text-xs text-slate-500 mt-0.5">Speak, get it transcribed</p>
                        </div>
                      </Link>

                      {/* Voice to Voice */}
                      <Link
                        to="/features/speech-to-speech"
                        className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition group bg-white shadow-xs"
                      >
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#249144] flex items-center justify-center flex-shrink-0 group-hover:bg-[#249144] group-hover:text-white transition">
                          <Radio className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#14532d]">Voice to Voice</p>
                          <p className="text-xs text-slate-500 mt-0.5">Two-way conversational dialogue</p>
                        </div>
                      </Link>

                      {/* Text to Speech */}
                      <Link
                        to="/features/text-to-speech"
                        className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition group bg-white shadow-xs"
                      >
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#249144] flex items-center justify-center flex-shrink-0 group-hover:bg-[#249144] group-hover:text-white transition">
                          <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#14532d]">Text to Speech</p>
                          <p className="text-xs text-slate-500 mt-0.5">Listen in native tribal accents</p>
                        </div>
                      </Link>

                      {/* Video Subtitle */}
                      <Link
                        to="/features/video-subtitle"
                        className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition group bg-white shadow-xs"
                      >
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#249144] flex items-center justify-center flex-shrink-0 group-hover:bg-[#249144] group-hover:text-white transition">
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#14532d]">Video Subtitle</p>
                          <p className="text-xs text-slate-500 mt-0.5">Subtitles for videos & media</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Resources Dropdown (Matches User Mockup Image 3 & 4) */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('resources')}
                  className={`font-medium transition-all flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-sm ${
                    activeDropdown === 'resources' || location.pathname.startsWith('/resources')
                      ? 'text-[#14532d] bg-[#dcfce7] font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>Resources</span>
                  {activeDropdown === 'resources' ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#14532d]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Resources Mega Panel (2x2 Grid) */}
                {activeDropdown === 'resources' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[740px] bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 grid gap-4 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                    <div className="border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        RESOURCES
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Dictionary */}
                      <Link
                        to="/resources/dictionary"
                        className="flex items-center gap-4 p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition group bg-white shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#249144] flex items-center justify-center flex-shrink-0 group-hover:bg-[#249144] group-hover:text-white transition">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#14532d]">Dictionary</p>
                          <p className="text-xs text-slate-500 mt-0.5">Type in any tribal language</p>
                        </div>
                      </Link>


                      {/* Offline Mode Trigger */}
                      <button
                        onClick={() => { setOfflineModalOpen(true); setActiveDropdown(null); }}
                        className="flex items-center gap-4 p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition group bg-white shadow-xs w-full text-left cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#249144] flex items-center justify-center flex-shrink-0 group-hover:bg-[#249144] group-hover:text-white transition relative">
                          <Target className="w-6 h-6" />
                          {isOfflineMode && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-white animate-pulse" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#14532d]">Offline Mode</p>
                          <p className="text-xs mt-0.5 flex items-center gap-1">
                            {isOfflineMode
                              ? <><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" /> <span className="text-orange-600 font-semibold">Offline Mode Active</span></>
                              : <><span className="text-slate-500">No internet? No problem</span></>}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Learning Studio Dropdown (1-Line Horizontal Cards Matching Screenshot) */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('learning-studio')}
                  className={`font-medium transition-all flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-sm cursor-pointer ${
                    activeDropdown === 'learning-studio' || location.pathname.includes('learning-studio')
                      ? 'text-[#14532d] bg-[#dcfce7] font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-[#249144]" />
                  <span>Learning Studio</span>
                  {activeDropdown === 'learning-studio' ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#14532d]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Learning Studio Mega Panel - All Features in the Same Line */}
                {activeDropdown === 'learning-studio' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[840px] bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 grid gap-4 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                    <div className="border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        LEARNING STUDIO
                      </span>
                    </div>

                    {/* Features in the Same Horizontal Line (1-Row 3-Cols Grid) */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Worksheets */}
                      <Link
                        to="/features/learning-studio?tab=worksheets"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition group bg-white shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#249144] flex items-center justify-center flex-shrink-0 group-hover:bg-[#249144] group-hover:text-white transition">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#14532d]">Worksheets</p>
                          <p className="text-xs text-slate-500 mt-0.5">Solve live or export printable A4</p>
                        </div>
                      </Link>

                      {/* 3D Flashcards */}
                      <Link
                        to="/features/learning-studio?tab=flashcards"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition group bg-white shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#249144] flex items-center justify-center flex-shrink-0 group-hover:bg-[#249144] group-hover:text-white transition">
                          <Layers className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#14532d]">3D Audio Flashcards</p>
                          <p className="text-xs text-slate-500 mt-0.5">Interactive cards with spoken audio</p>
                        </div>
                      </Link>

                      {/* Quiz and Assessment */}
                      <Link
                        to="/features/learning-studio?tab=assessment"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition group bg-white shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#249144] flex items-center justify-center flex-shrink-0 group-hover:bg-[#249144] group-hover:text-white transition">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-[#14532d]">Quiz and Assessment</p>
                          <p className="text-xs text-slate-500 mt-0.5">Language test & certificates</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. About */}
              <Link
                to="/about-us"
                className={`font-medium transition-colors py-1.5 px-3.5 rounded-xl text-sm ${
                  location.pathname === '/about-us'
                    ? 'text-[#14532d] bg-[#dcfce7] font-semibold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                About
              </Link>
            </nav>

            {/* Right Action CTA Buttons */}
            <div className="hidden md:flex items-center gap-2.5">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#14532d] bg-[#dcfce7] hover:bg-[#bbf7d0] border border-[#bbf7d0] rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
                title="Install Progressive Web App"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>

              {currentUser ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 border border-green-200">
                    <div className="w-6 h-6 rounded-full bg-[#249144] text-white flex items-center justify-center text-[10px] font-bold">
                      {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                      {currentUser.name || currentUser.email}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logoutUser();
                      setCurrentUser(null);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="bg-[#249144] hover:bg-[#1a7536] text-white px-6 py-2 text-xs sm:text-sm font-semibold rounded-xl transition active:scale-98 shadow-sm"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6 text-slate-800" />}
            </button>

          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed top-20 left-4 right-4 bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 md:hidden max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200 z-50">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl font-semibold text-slate-800 hover:bg-green-50 hover:text-[#249144] transition"
              >
                Home
              </Link>

              {/* Learning Studio (Prominent Mobile Placement) */}
              <div className="border-t border-slate-100 pt-2">
                <p className="px-4 py-1 text-[11px] font-bold text-[#14532d] uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#249144]" />
                  <span>Learning Studio (New)</span>
                </p>
                <div className="grid gap-1 mt-1 pl-2">
                  <Link 
                    to="/features/learning-studio?tab=flashcards" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:text-[#14532d] hover:bg-green-50 rounded-lg flex items-center gap-2"
                  >
                    <Layers className="w-4 h-4 text-[#249144]" /> 3D Audio Flashcards
                  </Link>
                  <Link 
                    to="/features/learning-studio?tab=worksheets" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:text-[#14532d] hover:bg-green-50 rounded-lg flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-[#249144]" /> Printable Worksheets Generator
                  </Link>
                  <Link 
                    to="/features/learning-studio?tab=assessment" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:text-[#14532d] hover:bg-green-50 rounded-lg flex items-center gap-2"
                  >
                    <Target className="w-4 h-4 text-[#249144]" /> Quiz and Assessment
                  </Link>
                </div>
              </div>

              {/* Features List */}
              <div className="border-t border-slate-100 pt-2">
                <p className="px-4 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Features</p>
                <div className="grid gap-1 mt-1 pl-2">
                  <Link to="/features/text-to-text" className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-green-50 rounded-lg flex items-center gap-2">
                    <Languages className="w-4 h-4 text-[#249144]" /> Text to Text Translation
                  </Link>
                  <Link to="/features/ocr" className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-green-50 rounded-lg flex items-center gap-2">
                    <ScanText className="w-4 h-4 text-[#249144]" /> OCR Text Extraction
                  </Link>
                  <Link to="/features/speech-to-text" className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-green-50 rounded-lg flex items-center gap-2">
                    <Mic className="w-4 h-4 text-[#249144]" /> Speech to Text
                  </Link>
                  <Link to="/features/speech-to-speech" className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-green-50 rounded-lg flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#249144]" /> Voice to Voice
                  </Link>
                  <Link to="/features/text-to-speech" className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-green-50 rounded-lg flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#249144]" /> Text to Speech
                  </Link>
                  <Link to="/features/video-subtitle" className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-green-50 rounded-lg flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#249144]" /> Video Subtitle
                  </Link>
                </div>
              </div>

              {/* Resources List */}
              <div className="border-t border-slate-100 pt-2">
                <p className="px-4 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resources</p>
                <div className="grid gap-1 mt-1 pl-2">
                  <Link to="/resources/dictionary" className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-green-50 rounded-lg flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#249144]" /> Multilingual Dictionary
                  </Link>
                  <button 
                    onClick={() => { setOfflineModalOpen(true); setMobileMenuOpen(false); }}
                    className="px-3 py-2 text-xs sm:text-sm text-slate-700 hover:bg-green-50 rounded-lg flex items-center gap-2 w-full text-left cursor-pointer"
                  >
                    <Target className="w-4 h-4 text-[#249144]" /> Offline Mode
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
                  }}
                  className="w-full py-2.5 text-center text-xs sm:text-sm font-bold rounded-xl bg-[#dcfce7] text-[#14532d] border border-[#bbf7d0] flex items-center justify-center gap-2 shadow-xs"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Install Mobile App</span>
                </button>
                <Link to="/about-us" className="px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 rounded-xl">
                  About Us
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLoginOpen(true);
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold rounded-xl bg-[#249144] text-white shadow-sm"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Login Modal */}
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* ─── Offline Mode Modal (White Theme Matching Website) ─── */}
      {offlineModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setOfflineModalOpen(false); }}
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Animated top gradient accent bar */}
            <div className={`h-1.5 w-full transition-all duration-700 ${isOfflineMode ? 'bg-gradient-to-r from-orange-400 via-amber-500 to-orange-500' : 'bg-gradient-to-r from-[#249144] via-emerald-400 to-[#86c498]'}`} />

            {/* Close Button */}
            <button
              onClick={() => setOfflineModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer z-10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-7 space-y-5">

              {/* Header with animated WiFi icon */}
              <div className="flex items-center gap-3.5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 shadow-xs ${isOfflineMode ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-emerald-50 text-[#249144] border border-emerald-200'}`}>
                  {offlineActivating ? (
                    <div className="w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isOfflineMode ? (
                    <WifiOff className="w-7 h-7 animate-pulse" />
                  ) : (
                    <Wifi className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 domine-bold tracking-tight">Offline Mode</h2>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">Offline-first tribal language tools</p>
                </div>
              </div>

              {/* Live Status Bar */}
              <div className={`rounded-2xl p-4 border transition-all duration-500 shadow-xs ${isOfflineMode ? 'bg-orange-50/70 border-orange-200' : 'bg-[#f0fdf4] border-[#dcfce7]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${offlineActivating ? 'bg-yellow-500 animate-ping' : isOfflineMode ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {offlineActivating ? 'Switching mode...' : isOfflineMode ? 'Offline Mode Active' : 'Online & Connected'}
                      </p>
                      <p className="text-xs text-slate-500 font-sans mt-0.5">
                        {offlineActivating ? 'Please wait' : isOfflineMode ? 'Using local cached dataset' : 'Using live cloud translation'}
                      </p>
                    </div>
                  </div>
                  {/* WiFi signal bars animation */}
                  <div className="flex items-end gap-1 h-6">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`w-1.5 rounded-xs transition-all duration-500 ${
                          isOfflineMode
                            ? bar <= 1 ? 'bg-orange-500' : 'bg-slate-200'
                            : 'bg-[#249144]'
                        }`}
                        style={{ height: `${bar * 4 + 6}px`, transitionDelay: `${bar * 60}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Big Toggle Switch */}
              <div className="flex items-center justify-between py-3.5 px-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-3">
                  {isOfflineMode ? <WifiOff className="w-5 h-5 text-orange-500" /> : <Globe className="w-5 h-5 text-[#249144]" />}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{isOfflineMode ? 'Offline Mode' : 'Online Mode'}</p>
                    <p className="text-xs text-slate-500 font-sans">Tap to {isOfflineMode ? 'reconnect' : 'go offline'}</p>
                  </div>
                </div>
                <button
                  onClick={handleOfflineToggle}
                  disabled={offlineActivating}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer shadow-inner disabled:opacity-60 ${isOfflineMode ? 'bg-orange-500' : 'bg-[#249144]'}`}
                  aria-label="Toggle offline mode"
                >
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${isOfflineMode ? 'left-8' : 'left-1'}`} />
                </button>
              </div>

              {/* Offline Features Grid */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#249144]" /> Available Offline
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: <BookOpen className="w-4 h-4" />, label: 'Dictionary', sub: '6,780+ words cached' },
                    { icon: <Volume2 className="w-4 h-4" />, label: 'Text to Speech', sub: 'On-device synthesis' },
                    { icon: <ScanText className="w-4 h-4" />, label: 'Ol Chiki OCR', sub: 'Local script reader' },
                    { icon: <Zap className="w-4 h-4" />, label: 'Quick Translate', sub: 'Pre-loaded phrases' },
                  ].map((feat) => (
                    <div key={feat.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-emerald-200 hover:bg-emerald-50/30 transition shadow-2xs">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 text-[#249144] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                        {feat.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{feat.label}</p>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5">{feat.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom note */}
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100 font-sans">
                <CheckCircle2 className="w-4 h-4 text-[#249144] flex-shrink-0" />
                <span>Offline Mode runs entirely on your device — no server needed for core features.</span>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
