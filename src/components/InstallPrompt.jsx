import { useState, useEffect } from 'react';
import { X, Download, Sparkles, AlertCircle } from 'lucide-react';

export default function InstallPrompt({ deferredPrompt, isInstalled }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos] = useState(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent);
    const isMacTouch = !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh/.test(userAgent));
    return isIphoneOrIpad || isMacTouch;
  });
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
  const dismissed = typeof localStorage !== 'undefined' && localStorage.getItem('sundar_gutka_pwa_dismissed') === 'true';

  useEffect(() => {
    if (isInstalled || isStandalone || dismissed) {
      return;
    }

    // Show prompt on home view after a short delay to feel premium and less intrusive
    if (deferredPrompt || (isIos && !isStandalone)) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt, isInstalled, isIos, isStandalone, dismissed]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native PWA install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      // Clear deferred prompt since it can only be used once
      setShowPrompt(false);
    } else if (isIos) {
      // Show iOS step-by-step installation instructions
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('sundar_gutka_pwa_dismissed', 'true');
  };

  if (isInstalled || isStandalone || dismissed || !showPrompt) return null;

  return (
    <>
      <div className="pwa-install-banner animate-slide-up">
        <div className="pwa-banner-content">
          <div className="pwa-icon-container">
            <img src="/icon-192.png" alt="Sundar Gutka Icon" className="pwa-app-icon" />
            <div className="pwa-badge">
              <Sparkles size={10} />
            </div>
          </div>
          <div className="pwa-text-container">
            <h4 className="pwa-title">Install Sundar Gutka</h4>
            <p className="pwa-desc">
              Access offline anytime, enjoy full-screen layout, and load prayers instantly.
            </p>
          </div>
        </div>

        <div className="pwa-actions-container">
          <button className="pwa-btn-dismiss" onClick={handleDismiss} aria-label="Dismiss banner">
            Maybe Later
          </button>
          <button className="pwa-btn-install" onClick={handleInstallClick}>
            <Download size={16} />
            <span>Install</span>
          </button>
        </div>
      </div>

      {/* iOS Safari Guide Overlay */}
      {showIosGuide && (
        <div className="ios-guide-overlay" onClick={() => setShowIosGuide(false)}>
          <div className="ios-guide-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="ios-guide-header">
              <h3>Install Sundar Gutka PWA</h3>
              <button className="icon-btn" onClick={() => setShowIosGuide(false)} aria-label="Close Guide">
                <X size={20} />
              </button>
            </div>
            <div className="ios-guide-body">
              <div className="ios-guide-banner-icon">
                <img src="/icon-512.png" alt="App Icon" className="ios-app-icon-large" />
              </div>
              <p className="ios-guide-intro">
                Follow these simple steps to install the app on your iPhone or iPad using Safari:
              </p>

              <div className="ios-steps-container">
                <div className="ios-step-item">
                  <div className="ios-step-number">1</div>
                  <div className="ios-step-desc">
                    Tap the <strong>Share</strong> button in the browser toolbar.
                    <div className="ios-step-subdesc">
                      It looks like a square with an upward arrow.
                    </div>
                  </div>
                  <div className="ios-step-visual">
                    <span className="ios-visual-icon share-icon-bg">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M12 15V3m0 0L8 7m4-4l4 4"/>
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="ios-step-item">
                  <div className="ios-step-number">2</div>
                  <div className="ios-step-desc">
                    Scroll down and select <strong>Add to Home Screen</strong>.
                    <div className="ios-step-subdesc">
                      You may need to scroll past your favorite contacts or options.
                    </div>
                  </div>
                  <div className="ios-step-visual">
                    <span className="ios-visual-icon plus-icon-bg">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <div className="ios-guide-footer-note">
                <AlertCircle size={14} className="note-icon" />
                <span>Note: This feature is only supported in the native Safari browser on iOS devices.</span>
              </div>

              <button className="ios-guide-close-btn" onClick={() => setShowIosGuide(false)}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
