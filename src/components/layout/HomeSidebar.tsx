import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Languages,
  Sparkles,
  BookOpen,
  GraduationCap,
  Info,
  Smartphone,
  ChevronRight,
  X,
  Menu,
  User,
  LogOut,
} from 'lucide-react';
import { BhashaSetuLogo } from '../common/BhashaSetuLogo';
import { LoginModal } from '../common/LoginModal';
import { getCurrentUser, logoutUser } from '../../services/authService';

/* ─── Sidebar nav items ─── */
const NAV_ITEMS = [
  { icon: Home, label: 'Home', to: '/' },
  { icon: Languages, label: 'Features', to: '/features/text-to-text' },
  { icon: Sparkles, label: 'Additional Features', to: '/field-mode' },
  { icon: BookOpen, label: 'Resources', to: '/resources/dictionary' },
  { icon: GraduationCap, label: 'Learning Studio', to: '/features/learning-studio' },
  { icon: Info, label: 'About', to: '/about-us' },
];

/* ─── Tiny botanical leaf SVG decorations ─── */
const SidebarLeaves: React.FC = () => (
  <>
    <svg
      className="absolute -bottom-2 -left-2 w-36 h-36 pointer-events-none opacity-25 select-none"
      viewBox="0 0 150 150"
    >
      <path d="M 75 140 Q 40 100, 10 80 Q 40 65, 75 140" fill="#4d7358" />
      <path d="M 75 130 Q 55 90, 25 70 Q 50 60, 75 130" fill="#6e967a" />
      <path d="M 60 145 Q 20 115, 5 95 Q 30 90, 60 145" fill="#3a5a43" />
      <path d="M 50 148 Q 15 120, 0 105 Q 22 100, 50 148" fill="#4d7358" opacity="0.7" />
    </svg>
    <svg
      className="absolute top-24 -right-1 w-16 h-24 pointer-events-none opacity-20 select-none"
      viewBox="0 0 60 100"
    >
      <path d="M 55 10 Q 35 30, 30 60 Q 45 50, 55 10" fill="#658865" />
      <path d="M 50 5 Q 30 25, 28 55 Q 40 48, 50 5" fill="#4d7358" />
    </svg>
  </>
);

interface HomeSidebarLayoutProps {
  children: React.ReactNode;
}

export const HomeSidebarLayout: React.FC<HomeSidebarLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: string } | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, [location.pathname, loginOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen flex bg-[#fcfbf7]">

      {/* ── Desktop Left Sidebar ── */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-[270px] z-40 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f5f0e8 0%, #ede6d6 100%)' }}
      >
        <SidebarLeaves />

        {/* Logo */}
        <div className="px-6 pt-7 pb-5 flex-shrink-0 relative z-10">
          <Link to="/" className="inline-block">
            <BhashaSetuLogo size="md" showTagline={true} />
          </Link>
        </div>

        {/* Separator */}
        <div className="mx-6 h-px bg-[#cec5b0] opacity-60 flex-shrink-0" />

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 flex flex-col gap-1 overflow-y-auto relative z-10">
          {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-medium text-[15px] transition-all duration-150 group ${
                  active
                    ? 'bg-[#1b5e3b] text-white shadow-sm'
                    : 'text-[#3d3425] hover:bg-[#e5dcc8] hover:text-[#1b5e3b]'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                    active ? 'text-white' : 'text-[#4d7358] group-hover:text-[#1b5e3b]'
                  }`}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom separator */}
        <div className="mx-6 h-px bg-[#cec5b0] opacity-60 flex-shrink-0" />

        {/* Install App card */}
        <div className="p-4 pb-6 flex-shrink-0 relative z-10">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('trigger-pwa-install'))}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/70 border border-[#d8ccba] rounded-2xl shadow-xs hover:bg-white/90 transition-all duration-150 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1b5e3b] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1b5e3b] leading-tight">Install App</p>
              <p className="text-[11px] text-[#7a6a50] leading-tight mt-0.5">Full-screen app mode &amp; offline speed</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9e8e72] group-hover:text-[#1b5e3b] transition flex-shrink-0" />
          </button>
        </div>
      </aside>

      {/* ── Mobile Topbar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-[#d8ccba]/60 shadow-sm"
        style={{ background: 'rgba(245,240,232,0.97)', backdropFilter: 'blur(8px)' }}
      >
        <Link to="/">
          <BhashaSetuLogo size="sm" showTagline={false} />
        </Link>
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="w-5 h-5 rounded-full bg-[#249144] text-white flex items-center justify-center text-[9px] font-bold">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-800 max-w-[80px] truncate">
                {currentUser.name || currentUser.email}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="bg-[#1b5e3b] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition hover:bg-[#14472c] cursor-pointer"
            >
              Login
            </button>
          )}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="p-2 rounded-xl text-[#3d3425] hover:bg-[#e5dcc8] transition cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-72 flex flex-col pt-16 overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #f5f0e8 0%, #ede6d6 100%)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-3">
              <Link to="/" onClick={() => setMobileOpen(false)}>
                <BhashaSetuLogo size="md" showTagline={true} />
              </Link>
            </div>
            <div className="mx-5 h-px bg-[#cec5b0] opacity-60" />

            <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
              {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all ${
                      active
                        ? 'bg-[#1b5e3b] text-white shadow-sm'
                        : 'text-[#3d3425] hover:bg-[#e5dcc8] hover:text-[#1b5e3b]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-[#4d7358]'}`} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#cec5b0]/60">
              <button
                onClick={() => { setMobileOpen(false); window.dispatchEvent(new CustomEvent('trigger-pwa-install')); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-[#d8ccba] rounded-2xl shadow-xs cursor-pointer"
              >
                <Smartphone className="w-5 h-5 text-[#1b5e3b]" />
                <span className="text-sm font-bold text-[#1b5e3b]">Install App</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 lg:ml-[270px] flex flex-col min-h-screen relative">

        {/* Desktop top-right: Install App + Login */}
        <div className="hidden lg:flex items-center gap-3 fixed top-6 right-8 z-30">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('trigger-pwa-install'))}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#1b5e3b] bg-white border border-[#cec5b0] rounded-xl shadow-xs hover:shadow-sm transition cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Install App</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="w-6 h-6 rounded-full bg-[#249144] text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                  {currentUser.name || currentUser.email}
                </span>
              </div>
              <button
                onClick={() => { logoutUser(); setCurrentUser(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-[#1b5e3b] rounded-xl shadow-sm hover:bg-[#14472c] transition cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 pt-16 lg:pt-0">
          {children}
        </main>
      </div>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
};

export default HomeSidebarLayout;
