import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, Monitor, Globe, Sparkles, HelpCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showFloatingBadge, setShowFloatingBadge] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'desktop' | 'android' | 'ios'>('desktop');

  useEffect(() => {
    // Detect if already installed / running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Auto-detect device
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActiveDeviceTab('ios');
    } else if (/android/.test(ua)) {
      setActiveDeviceTab('android');
    } else {
      setActiveDeviceTab('desktop');
    }

    // Capture Chrome / Edge beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowFloatingBadge(false);
      setShowModal(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for custom trigger from Navbar buttons
    const handleTrigger = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt().then(() => {
          deferredPrompt.userChoice.then((res) => {
            if (res.outcome === 'accepted') {
              setShowFloatingBadge(false);
              setDeferredPrompt(null);
            }
          });
        }).catch(() => {
          setShowModal(true);
        });
      } else {
        setShowModal(true);
      }
    };

    window.addEventListener('trigger-pwa-install', handleTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('trigger-pwa-install', handleTrigger);
    };
  }, [deferredPrompt]);

  const handleInstallNow = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setShowFloatingBadge(false);
          setShowModal(false);
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.warn('Deferred prompt error:', err);
      }
    }
    // If deferredPrompt is unavailable or on iOS/Desktop
    setShowModal(true);
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Floating Bottom-Right Install Badge */}
      {showFloatingBadge && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-emerald-200 shadow-2xl flex items-center gap-3.5 max-w-sm">
            <div className="w-11 h-11 rounded-xl bg-[#249144] text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 leading-tight truncate flex items-center gap-1.5">
                <span>Install Adi Vaani</span>
                <span className="text-[9px] bg-green-100 text-[#14532d] px-1.5 py-0.2 rounded-full font-bold">App</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Full-screen app mode & offline speed
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleInstallNow}
                className="px-3.5 py-1.5 bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={() => setShowFloatingBadge(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guided App Installation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 text-[#249144] flex items-center justify-center mx-auto shadow-sm">
                <Download className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 domine-bold">
                Install Adi Vaani App
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Use full-screen mode without browser bars, and access tribal translations faster.
              </p>
            </div>

            {/* Device Selector Tabs */}
            <div className="flex p-1 rounded-xl bg-slate-100 gap-1 text-xs font-bold">
              <button
                onClick={() => setActiveDeviceTab('desktop')}
                className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeDeviceTab === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (PC)</span>
              </button>

              <button
                onClick={() => setActiveDeviceTab('android')}
                className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeDeviceTab === 'android' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                onClick={() => setActiveDeviceTab('ios')}
                className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeDeviceTab === 'ios' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Share className="w-3.5 h-3.5" />
                <span>iPhone / iOS</span>
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs text-slate-700 space-y-3 font-medium">
              {activeDeviceTab === 'desktop' && (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#249144] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Look at the top address bar in Chrome / Edge.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#249144] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>Click the <strong>Install icon (⊕)</strong> or tap <strong>Menu (⋮) $\rightarrow$ "Install Adi Vaani"</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#249144] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                    <span>Click <strong>"Install"</strong> to launch as a standalone desktop app.</span>
                  </div>
                </div>
              )}

              {activeDeviceTab === 'android' && (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#249144] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Tap the <strong>three dots menu (⋮)</strong> at the top-right in Chrome.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#249144] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#249144] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                    <span>Tap <strong>"Install"</strong> to add the Adi Vaani icon to your home screen!</span>
                  </div>
                </div>
              )}

              {activeDeviceTab === 'ios' && (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#249144] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Tap the <strong>Share button (⎋)</strong> at the bottom of Safari.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#249144] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>Scroll down and select <strong>"Add to Home Screen" ⊞</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#249144] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                    <span>Tap <strong>"Add"</strong> in the top-right corner.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Action */}
            <div className="space-y-2">
              {deferredPrompt && (
                <button
                  onClick={async () => {
                    if (deferredPrompt) {
                      await deferredPrompt.prompt();
                      const res = await deferredPrompt.userChoice;
                      if (res.outcome === 'accepted') {
                        setShowModal(false);
                        setDeferredPrompt(null);
                      }
                    }
                  }}
                  className="w-full py-3 bg-[#249144] hover:bg-[#1a7536] text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Launch 1-Click Browser Install</span>
                </button>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Got It, Thanks!
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
