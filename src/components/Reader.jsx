import { useState, useEffect, useMemo } from 'react';
import { getShabad, getBaniIndex } from '../database/db.client';
import { Loader2, X } from 'lucide-react';

export default function Reader({ baniId, settings, isIndexOpen, onCloseIndex }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prevBaniId, setPrevBaniId] = useState(null);
  const [prevBaniLength, setPrevBaniLength] = useState(null);

  if (baniId !== prevBaniId || settings.baniLength !== prevBaniLength) {
    setPrevBaniId(baniId);
    setPrevBaniLength(settings.baniLength);
    setLoading(true);
  }

  useEffect(() => {
    getShabad(baniId, settings.baniLength)
      .then((data) => {
        setLines(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading Shabad lines:", err);
        setLoading(false);
      });
  }, [baniId, settings.baniLength]);

  const indexItems = useMemo(() => {
    return getBaniIndex(baniId, lines);
  }, [baniId, lines]);

  // Scroll to matched hash on initial load
  useEffect(() => {
    if (!loading && lines.length > 0 && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      const matched = indexItems.find(item => item.hash === hash);
      if (matched && matched.lineId) {
        setTimeout(() => {
          const element = document.getElementById(`line-${matched.lineId}`);
          if (element) {
            element.scrollIntoView({ block: 'start' });
          }
        }, 100);
      }
    }
  }, [loading, lines, indexItems]);

  const handleScrollToLine = (lineId, hash) => {
    const element = document.getElementById(`line-${lineId}`);
    if (element) {
      element.scrollIntoView({ block: 'start' });
    }

    if (hash) {
      const currentState = window.history.state;
      window.history.replaceState(currentState, '', `${window.location.pathname}#${hash}`);
    }

    if (onCloseIndex) {
      onCloseIndex();
    }
  };

  // Format Gurbani lines with Larivaar and Vishraam styling
  const formatGurmukhi = (text, vishraamJsonString) => {
    if (!text) return "";
    
    let words = text.split(" ");
    let vishraamPositions = {};

    // Parse vishraam positions
    if (settings.vishraam && vishraamJsonString) {
      try {
        const vishraamJson = JSON.parse(vishraamJsonString);
        const source = settings.vishraamSource || 'sttm';
        if (vishraamJson && vishraamJson[source] && vishraamJson[source].length > 0) {
          vishraamJson[source].forEach((pos) => {
            vishraamPositions[pos.p] = pos.t; // pos.p = word index, pos.t = vishraam type ('v' or 'y')
          });
        }
      } catch (e) {
        console.warn("Error parsing vishraam JSON:", e);
      }
    }

    const formattedWords = words.map((word, index) => {
      let styles = [];

      // Apply Vishraam highlight styling
      if (settings.vishraam && vishraamPositions[index]) {
        const isLong = vishraamPositions[index] === 'v';
        if (settings.vishraamOption === 'GRADIENT') {
          const color = isLong ? 'rgba(211, 84, 0, 0.4)' : 'rgba(22, 160, 133, 0.4)';
          styles.push(`border-radius: 5px; background: linear-gradient(to right, rgba(0,0,0,0) 20%, ${color} 100%)`);
        } else {
          // COLORED
          const color = isLong ? '#d35400' : '#16a085';
          styles.push(`color: ${color}`);
        }
      }

      // Apply Larivaar Assist styling (alternate opacity for even/odd words)
      if (settings.larivaar && settings.larivaarAssist && index % 2 !== 0) {
        styles.push('opacity: 0.65');
      }

      if (styles.length > 0) {
        return `<span style="${styles.join('; ')}">${word}</span>`;
      }
      return word;
    });

    // Join words: zero-width space for Larivaar, regular space otherwise
    const joinChar = settings.larivaar ? '&#8203;' : ' ';
    return formattedWords.join(joinChar);
  };

  const getTransliterationText = (translitJsonString) => {
    if (!translitJsonString || settings.transliteration === 'none') return null;
    try {
      const json = JSON.parse(translitJsonString);
      switch (settings.transliteration) {
        case 'ENGLISH': return json.en;
        case 'HINDI': return json.hi;
        case 'SHAHMUKHI': return json.ur;
        case 'IPA': return json.ipa;
        default: return null;
      }
    } catch {
      return null;
    }
  };

  const getTranslationText = (transJsonString) => {
    if (!transJsonString || settings.translation === 'none') return null;
    try {
      const json = JSON.parse(transJsonString);
      switch (settings.translation) {
        case 'ENGLISH': return json.en?.bdb || json.en?.sn || null;
        case 'PUNJABI': return json.pu?.bdb || json.pu?.sn || null;
        case 'SPANISH': return json.es?.bdb || json.es?.sn || null;
        default: return null;
      }
    } catch {
      return null;
    }
  };

  return (
    <div className="reader-container">
      {indexItems.length > 0 && (
        <>
          <div 
            className={`reader-sidebar-backdrop ${isIndexOpen ? 'open' : ''}`}
            onClick={onCloseIndex}
          />
          <div className={`reader-sidebar-drawer ${isIndexOpen ? 'open' : ''}`}>
            <div className="reader-sidebar-header">
              <h3>Bani Index / ਤਤਕਰਾ</h3>
              <button className="reader-sidebar-close-btn" onClick={onCloseIndex} aria-label="Close Index">
                <X size={20} />
              </button>
            </div>
            <div className="reader-sidebar-content">
              {indexItems.map((item, idx) => (
                <button
                  key={idx}
                  className="reader-sidebar-item"
                  onClick={() => handleScrollToLine(item.lineId, item.hash)}
                >
                  {item.gurmukhi ? (
                    <div className="reader-sidebar-item-flex">
                      <span className="reader-sidebar-item-num">{item.label}</span>
                      <span 
                        className="reader-sidebar-item-gurbani"
                        style={{ 
                          fontFamily: settings.fontFace === 'AnmolLipiSG' ? 'AnmolLipiSG' : (settings.fontFace === 'Arial' ? 'Arial' : 'GurbaniAkharTrue'),
                        }}
                      >
                        {item.gurmukhi}
                      </span>
                    </div>
                  ) : (
                    <span className="reader-sidebar-item-label">{item.label}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px', color: 'var(--text-muted)' }}>
          <Loader2 className="loading-spinner" size={32} style={{ marginBottom: '12px' }} />
          <span>Loading prayers...</span>
        </div>
      ) : (
        <div 
          className="reader-scroll-content"
          style={{ '--gurbani-size': `${settings.fontSize}px` }}
        >
          {lines.map((line) => {
            const translit = getTransliterationText(line.Transliterations);
            const translation = getTranslationText(line.Translations);
            const formattedGurmukhi = formatGurmukhi(line.Gurmukhi, line.Visraam);
            const isHeader = line.header === 1;

            return (
              <div 
                key={line.ID} 
                id={`line-${line.ID}`}
                className={`shabad-line ${isHeader ? 'header-section' : ''}`}
              >
                <div 
                  className="shabad-text-gurbani"
                  style={{ fontFamily: settings.fontFace === 'AnmolLipiSG' ? 'AnmolLipiSG' : (settings.fontFace === 'Arial' ? 'Arial' : 'GurbaniAkharTrue') }}
                  dangerouslySetInnerHTML={{ __html: formattedGurmukhi }}
                />
                
                {translit && (
                  <div className="shabad-text-translit">
                    {translit}
                  </div>
                )}
                
                {translation && (
                  <div className="shabad-text-translation">
                    {translation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
