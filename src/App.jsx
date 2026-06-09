import { useState, useEffect } from 'react';
import { Settings, ChevronLeft, Sun, Moon, Menu } from 'lucide-react';
import BaniList from './components/BaniList';
import Reader from './components/Reader';
import SettingsPanel from './components/SettingsPanel';
import InstallPrompt from './components/InstallPrompt';
import { DEFAULT_BANI_IDS, getBaniSlug, getBaniFromSlug } from './database/db.client';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  fontFace: 'GurbaniAkharTrue',
  fontSize: 32,
  baniLength: 'MEDIUM',
  translation: 'none',
  transliteration: 'none',
  larivaar: false,
  larivaarAssist: false,
  vishraam: true,
  vishraamOption: 'COLORED',
  vishraamSource: 'sttm'
};

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'reader'
  const [selectedBani, setSelectedBani] = useState({ id: null, gurmukhi: '', translit: '' });
  const [isReaderIndexOpen, setIsReaderIndexOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('sundar_gutka_web_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [activeLineId, setActiveLineId] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  });

  const [enabledBaniIds, setEnabledBaniIds] = useState(() => {
    const saved = localStorage.getItem('sundar_gutka_enabled_banis');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_BANI_IDS;
      }
    }
    return DEFAULT_BANI_IDS;
  });

  const updateEnabledBanis = (newIds) => {
    setEnabledBaniIds(newIds);
    localStorage.setItem('sundar_gutka_enabled_banis', JSON.stringify(newIds));
  };

  // Handle PWA installation state
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle history popstate events and initial deep link routing
  useEffect(() => {
    // Check if there is a deep link pathname on initial load
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    if (path && path !== 'index.html') {
      getBaniFromSlug(path).then((matchedBani) => {
        if (matchedBani) {
          setSelectedBani({ 
            id: matchedBani.id, 
            gurmukhi: matchedBani.gurmukhi, 
            translit: matchedBani.translit 
          });
          setCurrentView('reader');
          // Save the hash before we change the URL to '/'
          const currentHash = window.location.hash;
          // First set the home state at the root of our history stack
          window.history.replaceState({ view: 'home' }, '', '/');
          // Then push the reader state on top of it so the back button takes the user home
          window.history.pushState({ 
            view: 'reader', 
            id: matchedBani.id, 
            gurmukhi: matchedBani.gurmukhi, 
            translit: matchedBani.translit 
          }, '', `/${path}${currentHash}`);
        } else {
          window.history.replaceState({ view: 'home' }, '', '/');
        }
      }).catch((err) => {
        console.error("Error loading deep link:", err);
        window.history.replaceState({ view: 'home' }, '', '/');
      });
    } else {
      if (!window.history.state) {
        window.history.replaceState({ view: 'home' }, '', '/');
      }
    }

    const handlePopState = (event) => {
      setIsReaderIndexOpen(false);
      setShowHeader(true);
      setActiveLineId(null);
      const state = event.state;
      if (state && state.view === 'reader') {
        setSelectedBani({ id: state.id, gurmukhi: state.gurmukhi, translit: state.translit });
        setCurrentView('reader');
      } else {
        setCurrentView('home');
        setSelectedBani({ id: null, gurmukhi: '', translit: '' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Sync theme attribute with HTML document tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Lock body scroll when settings panel is open
  useEffect(() => {
    if (isSettingsOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isSettingsOpen]);

  // Persist settings changes
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('sundar_gutka_web_settings', JSON.stringify(newSettings));
  };

  const handleSelectBani = (id, gurmukhi, translit) => {
    setIsReaderIndexOpen(false);
    setShowHeader(true);
    setActiveLineId(null);
    setSelectedBani({ id, gurmukhi, translit });
    setCurrentView('reader');

    const slug = getBaniSlug(id, translit);

    // Push new state to history if we're not already in reader for this shabad
    const currentState = window.history.state;
    if (!currentState || currentState.view !== 'reader' || currentState.id !== id) {
      window.history.pushState({ view: 'reader', id, gurmukhi, translit }, '', `/${slug}`);
    }
  };

  const handleGoHome = () => {
    setIsReaderIndexOpen(false);
    setShowHeader(true);
    setActiveLineId(null);
    if (window.history.state && window.history.state.view === 'reader') {
      window.history.back();
    } else {
      setCurrentView('home');
      setSelectedBani({ id: null, gurmukhi: '', translit: '' });
      window.history.pushState({ view: 'home' }, '', '/');
    }
  };

  const toggleTheme = () => {
    updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Header */}
      <header 
        className={`app-header ${currentView === 'home' ? 'home-header' : 'reader-header'} ${!showHeader && currentView === 'reader' ? 'header-hidden' : ''}`}
        onClick={() => currentView === 'reader' && setActiveLineId(null)}
      >
        {currentView === 'home' ? (
          <>
            {/* Absolute positioned header actions */}
            <div className="home-header-actions left">
              <button className="icon-btn home-btn" onClick={toggleTheme} aria-label="Toggle Theme">
                {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
            <div className="home-header-actions right">
              <button className="icon-btn home-btn" onClick={() => setIsSettingsOpen(true)} aria-label="Open Settings">
                <Settings size={20} />
              </button>
            </div>

            {/* Centered Mobile-matching layout */}
            <div className="home-header-top">
              <span className="ikongkar">&lt;&gt;</span>
              <span>ਸ੍ਰੀ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ</span>
            </div>
            <div className="home-header-bottom">
              <span className="header-ornament">Œ</span>
              <span className="home-header-title-text">ਸੁੰਦਰ ਗੁਟਕਾ</span>
              <span className="header-ornament">‰</span>
            </div>
          </>
        ) : (
          <>
            <div className="logo-container" onClick={(e) => e.stopPropagation()}>
              <button className="icon-btn" onClick={handleGoHome} aria-label="Go Home">
                <ChevronLeft size={24} />
              </button>
              {[2, 4, 10, 31, 90].includes(selectedBani.id) && (
                <button 
                  className="icon-btn reader-menu-btn" 
                  onClick={(e) => { e.stopPropagation(); setIsReaderIndexOpen(!isReaderIndexOpen); }} 
                  aria-label="Toggle Table of Contents"
                >
                  <Menu size={22} />
                </button>
              )}
              <span className="logo-text">{selectedBani.translit}</span>
            </div>

            <div className="header-actions" onClick={(e) => e.stopPropagation()}>
              <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme">
                {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="icon-btn" onClick={() => setIsSettingsOpen(true)} aria-label="Open Settings">
                <Settings size={20} />
              </button>
            </div>
          </>
        )}
      </header>

      {/* Main View Area */}
      {currentView === 'home' ? (
        <BaniList 
          onSelectBani={handleSelectBani} 
          languageSetting={settings.transliteration} 
          enabledBaniIds={enabledBaniIds}
        />
      ) : (
        <Reader 
          baniId={selectedBani.id} 
          baniTitle={selectedBani.gurmukhi} 
          settings={settings} 
          isIndexOpen={isReaderIndexOpen}
          onCloseIndex={() => setIsReaderIndexOpen(false)}
          onHeaderVisibilityChange={setShowHeader}
          activeLineId={activeLineId}
          setActiveLineId={setActiveLineId}
        />
      )}

      {/* PWA Install Prompt Banner */}
      {currentView === 'home' && (
        <InstallPrompt
          deferredPrompt={deferredPrompt}
          isInstalled={isInstalled}
        />
      )}

      {/* Settings Overlay Drawer */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        updateSetting={updateSetting}
        deferredPrompt={deferredPrompt}
        isInstalled={isInstalled}
        enabledBaniIds={enabledBaniIds}
        updateEnabledBanis={updateEnabledBanis}
      />
    </>
  );
}
