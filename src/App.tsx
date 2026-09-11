import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
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

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      <ScrollToTop />
      <Navbar />
      <div className="flex-1 flex flex-col">
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            
            {/* Features */}
            <Route path="/features/text-to-text" element={<TextToTextPage />} />
            <Route path="/features/ocr" element={<OCRPage />} />
            <Route path="/features/speech-to-text" element={<SpeechToTextPage />} />
            <Route path="/features/speech-to-speech" element={<SpeechToSpeechPage />} />
            <Route path="/features/text-to-speech" element={<TextToSpeechPage />} />
            <Route path="/features/video-subtitle" element={<VideoSubtitlePage />} />
            <Route path="/features/learning-studio" element={<LearningStudioPage />} />
            
            {/* Resources */}
            <Route path="/resources/learning-studio" element={<LearningStudioPage />} />
            <Route path="/learning-studio" element={<LearningStudioPage />} />
            <Route path="/resources/dictionary" element={<DictionaryPage />} />
            
            {/* Info & Support */}
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="/contact-us" element={<ContactPage />} />
            <Route path="/vaani-stream" element={<VaaniStreamPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Fallback */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
      </div>
      <PWAInstallPrompt />
    </div>
  );
};

export default App;
