import { useState, useEffect } from 'react';
import { Settings, ChevronLeft, Sun, Moon } from 'lucide-react';
import BaniList from './components/BaniList';
import Reader from './components/Reader';
import SettingsPanel from './components/SettingsPanel';
import InstallPrompt from './components/InstallPrompt';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  fontFace: 'GurbaniAkharTrue',
  fontSize: 32,
  baniLength: 'MEDIUM',
  translation: 'ENGLISH',
  transliteration: 'ENGLISH',
  larivaar: false,
  larivaarAssist: false,
  vishraam: true,
  vishraamOption: 'COLORED',
  vishraamSource: 'sttm'
};

export default function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'reader'
  const [selectedBani, setSelectedBani] = useState({ id: null, gurmukhi: '', translit: '' });
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
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  });

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
    setSelectedBani({ id, gurmukhi, translit });
    setCurrentView('reader');
  };

  const handleGoHome = () => {
    setCurrentView('home');
    setSelectedBani({ id: null, gurmukhi: '', translit: '' });
  };

  const toggleTheme = () => {
    updateSetting('theme', settings.theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Header */}
      <header className={`app-header ${currentView === 'home' ? 'home-header' : ''}`}>
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
            <div className="logo-container">
              <button className="icon-btn" onClick={handleGoHome} aria-label="Go Home">
                <ChevronLeft size={24} />
              </button>
              <span className="logo-text">{selectedBani.translit}</span>
            </div>

            <div className="header-actions">
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
        />
      ) : (
        <Reader 
          baniId={selectedBani.id} 
          baniTitle={selectedBani.gurmukhi} 
          settings={settings} 
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
      />
    </>
  );
}
