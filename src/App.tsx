import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { ScrollToTop } from './components/common/ScrollToTop';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

// Pages
import { HomePage } from './pages/HomePage';
import { TextToTextPage } from './pages/features/TextToTextPage';
import { OCRPage } from './pages/features/OCRPage';
import { SpeechToTextPage } from './pages/features/SpeechToTextPage';
import { SpeechToSpeechPage } from './pages/features/SpeechToSpeechPage';
import { TextToSpeechPage } from './pages/features/TextToSpeechPage';
import { VideoSubtitlePage } from './pages/features/VideoSubtitlePage';
import { LearningStudioPage } from './pages/features/LearningStudioPage';
import { DictionaryPage } from './pages/resources/DictionaryPage';
import { AdiKarmayogiPage } from './pages/resources/AdiKarmayogiPage';
import { VVIPSpeechesPage } from './pages/gallery/VVIPSpeechesPage';
import { SCDAwarenessPage } from './pages/gallery/SCDAwarenessPage';
import { MediaGalleryPage } from './pages/gallery/MediaGalleryPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { VaaniStreamPage } from './pages/VaaniStreamPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      <ScrollToTop />
      <Navbar />
      <div className="flex-1 flex flex-col">
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
          <Route path="/resources/adi-karmayogi" element={<AdiKarmayogiPage />} />
          
          {/* Gallery */}
          <Route path="/gallery" element={<MediaGalleryPage />} />
          <Route path="/gallery/vvip-speeches" element={<VVIPSpeechesPage />} />
          <Route path="/gallery/scd-awareness" element={<SCDAwarenessPage />} />
          <Route path="/gallery/media" element={<MediaGalleryPage />} />
          
          {/* Info & Support */}
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/vaani-stream" element={<VaaniStreamPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Fallback */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      <PWAInstallPrompt />
    </div>
  );
};

export default App;
