import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { HomeSidebarLayout } from './components/layout/HomeSidebar';
import { ScrollToTop } from './components/common/ScrollToTop';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

// Eager load HomePage for instantaneous initial landing render
import { HomePage } from './pages/HomePage';

// Lazy load feature and resource routes to cleanly isolate heavy bundles
const TextToTextPage = lazy(() => import('./pages/features/TextToTextPage').then(m => ({ default: m.TextToTextPage })));
const OCRPage = lazy(() => import('./pages/features/OCRPage').then(m => ({ default: m.OCRPage })));
const SpeechToTextPage = lazy(() => import('./pages/features/SpeechToTextPage').then(m => ({ default: m.SpeechToTextPage })));
const SpeechToSpeechPage = lazy(() => import('./pages/features/SpeechToSpeechPage').then(m => ({ default: m.SpeechToSpeechPage })));
const TextToSpeechPage = lazy(() => import('./pages/features/TextToSpeechPage').then(m => ({ default: m.TextToSpeechPage })));
const VideoSubtitlePage = lazy(() => import('./pages/features/VideoSubtitlePage').then(m => ({ default: m.VideoSubtitlePage })));
const LearningStudioPage = lazy(() => import('./pages/features/LearningStudioPage').then(m => ({ default: m.LearningStudioPage })));
const DictionaryPage = lazy(() => import('./pages/resources/DictionaryPage').then(m => ({ default: m.DictionaryPage })));
const FieldModePage = lazy(() => import('./pages/features/FieldModePage').then(m => ({ default: m.FieldModePage })));
const TeacherModePage = lazy(() => import('./pages/features/TeacherModePage').then(m => ({ default: m.TeacherModePage })));
const KnowledgeBasePage = lazy(() => import('./pages/resources/KnowledgeBasePage').then(m => ({ default: m.KnowledgeBasePage })));
const EmergencyModePage = lazy(() => import('./pages/features/EmergencyModePage').then(m => ({ default: m.EmergencyModePage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const VaaniStreamPage = lazy(() => import('./pages/VaaniStreamPage').then(m => ({ default: m.VaaniStreamPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center" aria-live="polite">
    <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
    <p className="text-sm font-semibold text-slate-700">Loading Bhasha Setu Module...</p>
    <p className="text-xs text-slate-400 mt-1">Zero Network Dependency • Offline Ready</p>
  </div>
);

/** Layout wrapper for all pages that use the standard top Navbar */
const WithNavbar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-white text-slate-800">
    <Navbar />
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <PWAInstallPrompt />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>

          {/* ── Home page: left sidebar layout ── */}
          <Route
            path="/"
            element={
              <HomeSidebarLayout>
                <HomePage />
              </HomeSidebarLayout>
            }
          />
          <Route
            path="/home"
            element={
              <HomeSidebarLayout>
                <HomePage />
              </HomeSidebarLayout>
            }
          />

          {/* ── All other pages: standard top Navbar ── */}

          {/* Core Workflows */}
          <Route path="/field-mode" element={<WithNavbar><FieldModePage /></WithNavbar>} />
          <Route path="/teacher-mode" element={<WithNavbar><TeacherModePage /></WithNavbar>} />
          <Route path="/knowledge-base" element={<WithNavbar><KnowledgeBasePage /></WithNavbar>} />
          <Route path="/emergency-mode" element={<WithNavbar><EmergencyModePage /></WithNavbar>} />
          <Route path="/conversation" element={<WithNavbar><SpeechToSpeechPage /></WithNavbar>} />

          {/* Features */}
          <Route path="/features/text-to-text" element={<WithNavbar><TextToTextPage /></WithNavbar>} />
          <Route path="/features/ocr" element={<WithNavbar><OCRPage /></WithNavbar>} />
          <Route path="/features/speech-to-text" element={<WithNavbar><SpeechToTextPage /></WithNavbar>} />
          <Route path="/features/speech-to-speech" element={<WithNavbar><SpeechToSpeechPage /></WithNavbar>} />
          <Route path="/features/text-to-speech" element={<WithNavbar><TextToSpeechPage /></WithNavbar>} />
          <Route path="/features/video-subtitle" element={<WithNavbar><VideoSubtitlePage /></WithNavbar>} />
          <Route path="/features/learning-studio" element={<WithNavbar><LearningStudioPage /></WithNavbar>} />

          {/* Resources */}
          <Route path="/resources/knowledge-base" element={<WithNavbar><KnowledgeBasePage /></WithNavbar>} />
          <Route path="/resources/learning-studio" element={<WithNavbar><LearningStudioPage /></WithNavbar>} />
          <Route path="/learning-studio" element={<WithNavbar><LearningStudioPage /></WithNavbar>} />
          <Route path="/resources/dictionary" element={<WithNavbar><DictionaryPage /></WithNavbar>} />

          {/* Info & Support */}
          <Route path="/about-us" element={<WithNavbar><AboutPage /></WithNavbar>} />
          <Route path="/contact-us" element={<WithNavbar><ContactPage /></WithNavbar>} />
          <Route path="/vaani-stream" element={<WithNavbar><VaaniStreamPage /></WithNavbar>} />
          <Route path="/privacy-policy" element={<WithNavbar><PrivacyPolicyPage /></WithNavbar>} />
          <Route path="/login" element={<WithNavbar><LoginPage /></WithNavbar>} />

          {/* Fallback */}
          <Route
            path="*"
            element={
              <HomeSidebarLayout>
                <HomePage />
              </HomeSidebarLayout>
            }
          />

        </Routes>
      </Suspense>
    </>
  );
};

export default App;
