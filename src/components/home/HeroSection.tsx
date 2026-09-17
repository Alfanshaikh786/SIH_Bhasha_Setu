import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../../services/authService';

export const HeroSection: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: string } | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const handleAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener('auth-changed', handleAuth);
    return () => window.removeEventListener('auth-changed', handleAuth);
  }, []);

  return (
    <section className="relative w-full bg-[#fcfbf7] overflow-hidden select-none py-2 sm:py-3">
      {/* Complete Hero Composition — exact approved image, scaled to 88% for breathing room */}
      <div
        className="relative w-[88%] mx-auto"
        style={{ aspectRatio: '1492 / 864' }}
      >
        {/* ── The Approved Hero Image — used directly, not recreated ── */}
        <img
          src="/hero-target.png"
          srcSet="/hero-target.png 1x, /hero-target@2x.png 2x"
          alt="Bhasha Setu — Translate Anything Instantly with AI. Globe with speech bubbles showing Hello, Johar, नमस्ते, and Santali script, resting on an open book surrounded by botanical leaves."
          className="w-full h-full object-contain pointer-events-none select-none block"
          style={{ mixBlendMode: 'multiply' }}
          draggable={false}
        />

        {/* ── Accessible semantic structure for screen readers & SEO ── */}
        <div className="sr-only">
          <h1>Translate Anything Instantly with AI</h1>
          <p>Type or speak. Get translation in your language instantly.</p>
        </div>

        {/* ── Transparent Overlay: Install App button (over the image's Install App button area) ── */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('trigger-pwa-install'))}
          className="absolute cursor-pointer focus:outline-none"
          style={{
            left: '70.98%',
            top: '2.79%',
            width: '12.20%',
            height: '6.86%',
            background: 'transparent',
            border: 'none',
            appearance: 'none',
          }}
          aria-label="Install App"
        />

        {/* ── Transparent Overlay: Login button (over the image's Login button area) ── */}
        {currentUser ? (
          /* When logged in — show a logout action silently on the login button area */
          <button
            type="button"
            onClick={() => { logoutUser(); setCurrentUser(null); }}
            className="absolute cursor-pointer focus:outline-none"
            style={{
              left: '85.25%',
              top: '3.02%',
              width: '10.92%',
              height: '6.51%',
              background: 'transparent',
              border: 'none',
              appearance: 'none',
            }}
            aria-label="Logout"
            title={`Logged in as ${currentUser.name || currentUser.email} — click to logout`}
          />
        ) : (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))}
            className="absolute cursor-pointer focus:outline-none"
            style={{
              left: '85.25%',
              top: '3.02%',
              width: '10.92%',
              height: '6.51%',
              background: 'transparent',
              border: 'none',
              appearance: 'none',
            }}
            aria-label="Login"
          />
        )}

        {/* ── Transparent Overlay: Try Translation Now CTA button ── */}
        <Link
          to="/features/text-to-text"
          className="absolute focus:outline-none cursor-pointer"
          style={{
            left: '3.5%',
            top: '63%',
            width: '26%',
            height: '10%',
            background: 'transparent',
          }}
          aria-label="Try Translation Now"
        />
      </div>
    </section>
  );
};

export default HeroSection;
