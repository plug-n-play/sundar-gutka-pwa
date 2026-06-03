import React from 'react';
import { X } from 'lucide-react';

export default function SettingsPanel({ isOpen, onClose, settings, updateSetting }) {
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
        </div>
      </div>
    </div>
  );
}
