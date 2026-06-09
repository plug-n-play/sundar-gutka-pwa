import { useState } from 'react';
import { X, Download, AlertCircle, Search, Loader2 } from 'lucide-react';

export default function SettingsPanel({
  isOpen,
  onClose,
  settings,
  updateSetting,
  deferredPrompt,
  isInstalled,
  enabledBaniIds,
  updateEnabledBanis
}) {
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showBaniSelector, setShowBaniSelector] = useState(false);
  const [allBanis, setAllBanis] = useState([]);
  const [loadingBanis, setLoadingBanis] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');

  const [isIos] = useState(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent);
    const isMacTouch = !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh/.test(userAgent));
    return isIphoneOrIpad || isMacTouch;
  });

  const openBaniSelector = () => {
    setShowBaniSelector(true);
    if (allBanis.length === 0) {
      setLoadingBanis(true);
      fetch('/data/banis.json')
        .then((res) => res.json())
        .then((data) => {
          const formatted = data.map((row) => {
            let translitVal = "";
            try {
              const json = typeof row.Transliterations === 'string'
                ? JSON.parse(row.Transliterations)
                : row.Transliterations;
              if (json) {
                translitVal = json.en;
              }
            } catch {
              translitVal = row.Transliterations;
            }
            return {
              id: row.ID,
              gurmukhi: row.Gurmukhi,
              translit: translitVal || ""
            };
          });
          setAllBanis(formatted);
          setLoadingBanis(false);
        })
        .catch((err) => {
          console.error("Failed to load Banis for selector:", err);
          setLoadingBanis(false);
        });
    }
  };

  const handleToggleBani = (id) => {
    if (enabledBaniIds.includes(id)) {
      updateEnabledBanis(enabledBaniIds.filter((item) => item !== id));
    } else {
      updateEnabledBanis([...enabledBaniIds, id]);
      // Silently fetch and cache the newly enabled Bani JSON in background
      fetch(`/data/banis/${id}.json`).catch((err) => {
        console.warn(`Failed to pre-cache activated Bani ${id}:`, err);
      });
    }
  };

  const handleSelectAll = () => {
    const allIds = allBanis.map((b) => b.id);
    updateEnabledBanis(allIds);
    // Silently fetch and cache all Banis in background
    allIds.forEach((id) => {
      fetch(`/data/banis/${id}.json`).catch(() => { });
    });
  };

  const handleClearAll = () => {
    updateEnabledBanis([]);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to settings install prompt: ${outcome}`);
    }
  };

  const optionalBanis = allBanis;
  const filteredOptionalBanis = optionalBanis.filter((b) => {
    const q = selectorSearch.toLowerCase();
    return (
      b.gurmukhi.toLowerCase().includes(q) ||
      b.translit.toLowerCase().includes(q)
    );
  });

  const sortedOptionalBanis = [...filteredOptionalBanis].sort((a, b) => {
    const aChecked = enabledBaniIds.includes(a.id);
    const bChecked = enabledBaniIds.includes(b.id);
    if (aChecked && !bChecked) return -1;
    if (!aChecked && bChecked) return 1;
    return 0;
  });
  return (
    <div className={`settings-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3 className="settings-title">Display Settings</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          {/* Custom Prayer List Option */}
          <div className="settings-group">
            <label className="settings-label">Prayers</label>
            <button className="settings-btn-primary" onClick={openBaniSelector}>
              Customize Prayer List
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Select which optional prayers appear on the home screen.
            </span>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
          {/* Theme */}
          <div className="settings-group">
            <label className="settings-label">Theme</label>
            <select
              className="settings-select"
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </select>
          </div>

          {/* Font Face */}
          <div className="settings-group">
            <label className="settings-label">Gurbani Font</label>
            <select
              className="settings-select"
              value={settings.fontFace}
              onChange={(e) => updateSetting('fontFace', e.target.value)}
            >
              <option value="GurbaniAkharTrue">Gurbani Akhar (Standard)</option>
              <option value="GurbaniAkharThickTrue">Gurbani Akhar (Thick)</option>
              <option value="GurbaniAkharHeavyTrue">Gurbani Akhar (Heavy)</option>
              <option value="AnmolLipiSG">Anmol Lipi</option>
              <option value="Arial">Arial Unicode</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="settings-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="settings-label">Font Size</label>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                {settings.fontSize}px
              </span>
            </div>
            <div className="font-size-slider-wrapper">
              <input
                type="range"
                className="font-size-slider"
                min="18"
                max="64"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Bani Length */}
          <div className="settings-group">
            <label className="settings-label">Bani Length</label>
            <select
              className="settings-select"
              value={settings.baniLength}
              onChange={(e) => updateSetting('baniLength', e.target.value)}
            >
              <option value="SHORT">Short (SGPC Standard)</option>
              <option value="MEDIUM">Medium (Standard)</option>
              <option value="LONG">Long (Damdami Taksal)</option>
              <option value="EXTRA_LONG">Extra Long (Buddha Dal)</option>
            </select>
          </div>

          {/* Translations Toggle */}
          <div className="settings-toggle-row">
            <div className="toggle-label-container">
              <span className="toggle-main-label">Translations</span>
              <span className="toggle-sub-label">Show prayer translation</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.translation !== 'none'}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  updateSetting('translation', isChecked ? 'ENGLISH' : 'none');
                }}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Translations Select */}
          {settings.translation !== 'none' && (
            <div className="settings-group">
              <label className="settings-label">Translation Language</label>
              <select
                className="settings-select"
                value={settings.translation}
                onChange={(e) => updateSetting('translation', e.target.value)}
              >
                <option value="ENGLISH">English</option>
                <option value="PUNJABI">Punjabi</option>
                <option value="SPANISH">Spanish</option>
              </select>
            </div>
          )}

          {/* Transliterations Toggle */}
          <div className="settings-toggle-row">
            <div className="toggle-label-container">
              <span className="toggle-main-label">Transliterations</span>
              <span className="toggle-sub-label">Pronunciation guide</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.transliteration !== 'none'}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  updateSetting('transliteration', isChecked ? 'ENGLISH' : 'none');
                }}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Transliterations Select */}
          {settings.transliteration !== 'none' && (
            <div className="settings-group">
              <label className="settings-label">Transliteration Language</label>
              <select
                className="settings-select"
                value={settings.transliteration}
                onChange={(e) => updateSetting('transliteration', e.target.value)}
              >
                <option value="ENGLISH">English</option>
                <option value="HINDI">Hindi</option>
                <option value="SHAHMUKHI">Shahmukhi</option>
                <option value="IPA">IPA Phonetic</option>
              </select>
            </div>
          )}

          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

          {/* Larivaar Toggle */}
          <div className="settings-toggle-row">
            <div className="toggle-label-container">
              <span className="toggle-main-label">Larivaar</span>
              <span className="toggle-sub-label">Continuous text script</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.larivaar}
                onChange={(e) => updateSetting('larivaar', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Larivaar Assist */}
          {settings.larivaar && (
            <div className="settings-toggle-row">
              <div className="toggle-label-container">
                <span className="toggle-main-label">Larivaar Assist</span>
                <span className="toggle-sub-label">Alternate word transparency</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.larivaarAssist}
                  onChange={(e) => updateSetting('larivaarAssist', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          )}

          {/* Vishraam Toggle */}
          <div className="settings-toggle-row">
            <div className="toggle-label-container">
              <span className="toggle-main-label">Show Vishraams</span>
              <span className="toggle-sub-label">Highlights for pauses</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.vishraam}
                onChange={(e) => updateSetting('vishraam', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Vishraam Option */}
          {settings.vishraam && (
            <div className="settings-group">
              <label className="settings-label">Vishraam Option</label>
              <select
                className="settings-select"
                value={settings.vishraamOption}
                onChange={(e) => updateSetting('vishraamOption', e.target.value)}
              >
                <option value="COLORED">Colored Text</option>
                <option value="GRADIENT">Gradient Background</option>
              </select>
            </div>
          )}

          {/* Vishraam Source */}
          {settings.vishraam && (
            <div className="settings-group">
              <label className="settings-label">Vishraam Source</label>
              <select
                className="settings-select"
                value={settings.vishraamSource}
                onChange={(e) => updateSetting('vishraamSource', e.target.value)}
              >
                <option value="sttm">SikhiToTheMax (default)</option>
                <option value="igurbani">iGurbani</option>
              </select>
            </div>
          )}

          {!!(isInstalled || deferredPrompt || isIos) && (
            <>
              <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

              {/* PWA App Status / Action */}
              <div className="settings-group">
                <label className="settings-label">Application</label>
                {isInstalled ? (
                  <div className="pwa-status-installed">
                    <span className="status-dot-green"></span>
                    <span>Installed (Offline Ready)</span>
                  </div>
                ) : deferredPrompt ? (
                  <button className="settings-btn-primary" onClick={handleInstallClick}>
                    <Download size={14} style={{ marginRight: '6px' }} />
                    Install App (Offline Access)
                  </button>
                ) : isIos ? (
                  <button className="settings-btn-primary" onClick={() => setShowIosGuide(true)}>
                    How to Install PWA
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      {/* iOS Safari Guide Overlay inside Settings */}
      {showIosGuide && (
        <div className="ios-guide-overlay" onClick={() => setShowIosGuide(false)} style={{ zIndex: 200 }}>
          <div className="ios-guide-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="ios-guide-header">
              <h3>Install Sundar Gutka</h3>
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
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M12 15V3m0 0L8 7m4-4l4 4" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="ios-step-item">
                  <div className="ios-step-number">2</div>
                  <div className="ios-step-desc">
                    Scroll down and select <strong>Add to Home Screen</strong>.
                    <div className="ios-step-subdesc">
                      You may need to scroll past your contacts or options.
                    </div>
                  </div>
                  <div className="ios-step-visual">
                    <span className="ios-visual-icon plus-icon-bg">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <div className="ios-guide-footer-note">
                <AlertCircle size={14} className="note-icon" />
                <span>Note: PWA installation is only supported in Safari on iOS.</span>
              </div>

              <button className="ios-guide-close-btn" onClick={() => setShowIosGuide(false)}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Prayers Selector Modal */}
      {showBaniSelector && (
        <div className="bani-selector-overlay" onClick={() => setShowBaniSelector(false)}>
          <div className="bani-selector-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="bani-selector-header">
              <div className="bani-selector-header-top">
                <h3>Customize Prayer List</h3>
                <button className="icon-btn" onClick={() => setShowBaniSelector(false)} aria-label="Close Selector">
                  <X size={20} />
                </button>
              </div>
              <p className="bani-selector-info">
                Select which prayers appear on your home screen. Core prayers are checked by default.
              </p>

              <div className="bani-selector-controls">
                <div className="selector-search-wrapper">
                  <Search className="selector-search-icon" size={16} />
                  <input
                    type="text"
                    className="selector-search-input"
                    placeholder="Search prayers..."
                    value={selectorSearch}
                    onChange={(e) => setSelectorSearch(e.target.value)}
                  />
                  {selectorSearch && (
                    <button className="search-clear-btn" onClick={() => setSelectorSearch('')}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="selector-quick-actions">
                  <button className="selector-action-btn" onClick={handleSelectAll}>Select All</button>
                  <button className="selector-action-btn" onClick={handleClearAll}>Clear All</button>
                </div>
              </div>
            </div>

            <div className="bani-selector-body">
              {loadingBanis ? (
                <div className="selector-loading">
                  <Loader2 className="loading-spinner" size={24} />
                  <span>Loading prayers...</span>
                </div>
              ) : filteredOptionalBanis.length === 0 ? (
                <div className="selector-empty">
                  No prayers found matching "{selectorSearch}"
                </div>
              ) : (
                <div className="selector-grid">
                  {sortedOptionalBanis.map((b) => {
                    const isChecked = enabledBaniIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className={`selector-card ${isChecked ? 'selected' : ''}`}
                      >
                        <div className="selector-checkbox-wrapper">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleBani(b.id)}
                          />
                          <span className="custom-checkbox"></span>
                        </div>
                        <div className="selector-card-details">
                          <span className="selector-card-gurbani">{b.gurmukhi}</span>
                          <span className="selector-card-translit">{b.translit}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bani-selector-footer">
              <div className="selector-selected-count">
                {enabledBaniIds.length} prayer{enabledBaniIds.length !== 1 ? 's' : ''} enabled
              </div>
              <button className="selector-save-btn" onClick={() => setShowBaniSelector(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
