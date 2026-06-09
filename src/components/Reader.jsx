import { useState, useEffect, useMemo, useRef } from 'react';
import { getShabad, getBaniIndex, getPreloadedShabad } from '../database/db.client';
import { Loader2, X } from 'lucide-react';

export default function Reader({ baniId, settings, isIndexOpen, onCloseIndex, onHeaderVisibilityChange, activeLineId, setActiveLineId }) {
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [lines, setLines] = useState(() => {
    if (settings.baniLength === 'MEDIUM') {
      const preloaded = getPreloadedShabad(baniId);
      if (preloaded) return preloaded;
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (settings.baniLength === 'MEDIUM') {
      const preloaded = getPreloadedShabad(baniId);
      if (preloaded) return false;
    }
    return true;
  });
  const [prevBaniId, setPrevBaniId] = useState(baniId);
  const [prevBaniLength, setPrevBaniLength] = useState(settings.baniLength);
  const [exclusiveLine, setExclusiveLine] = useState(null);
  const lastTapRef = useRef(0);
  const lastExclusiveLineIdRef = useRef(null);

  const handleLineClick = (e, line) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      setExclusiveLine(line);
      setActiveLineId(null);
    } else {
      setActiveLineId((prev) => (prev === line.ID ? null : line.ID));
    }
    lastTapRef.current = now;
  };

  const closeExclusive = () => {
    if (window.history.state && window.history.state.exclusive) {
      window.history.back();
    } else {
      setExclusiveLine(null);
    }
  };

  // Prevent background scrolling when exclusive view is open
  useEffect(() => {
    if (exclusiveLine) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [exclusiveLine]);

  // Track last seen exclusive line to highlight it on exit
  useEffect(() => {
    if (exclusiveLine) {
      lastExclusiveLineIdRef.current = exclusiveLine.ID;
    } else if (lastExclusiveLineIdRef.current) {
      const exitLineId = lastExclusiveLineIdRef.current;
      setActiveLineId(exitLineId);
      lastExclusiveLineIdRef.current = null;
      
      // Delay slightly to ensure standard view has fully updated
      setTimeout(() => {
        const element = document.getElementById(`line-${exitLineId}`);
        if (element) {
          element.scrollIntoView({ block: 'center' });
        }
      }, 50);
    }
  }, [exclusiveLine, setActiveLineId]);

  // Handle popstate history integration for exclusive view
  useEffect(() => {
    if (!exclusiveLine) return;

    const currentState = window.history.state || {};
    if (!currentState.exclusive) {
      window.history.pushState({ ...currentState, exclusive: true, exclusiveLineId: exclusiveLine.ID }, '');
    } else {
      window.history.replaceState({ ...currentState, exclusiveLineId: exclusiveLine.ID }, '');
    }

    const handlePopState = (e) => {
      const state = e.state || {};
      if (!state.exclusive) {
        setExclusiveLine(null);
      } else if (state.exclusiveLineId && state.exclusiveLineId !== exclusiveLine.ID) {
        const matched = lines.find(l => l.ID === state.exclusiveLineId);
        if (matched) {
          setExclusiveLine(matched);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [exclusiveLine, lines]);

  // Handle keyboard keys (Escape, ArrowLeft, ArrowRight) in exclusive view
  useEffect(() => {
    if (!exclusiveLine) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeExclusive();
      } else if (e.key === 'ArrowRight') {
        const currentIndex = lines.findIndex(l => l.ID === exclusiveLine.ID);
        if (currentIndex < lines.length - 1) {
          setExclusiveLine(lines[currentIndex + 1]);
        }
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = lines.findIndex(l => l.ID === exclusiveLine.ID);
        if (currentIndex > 0) {
          setExclusiveLine(lines[currentIndex - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [exclusiveLine, lines]);

  const [fontsLoaded, setFontsLoaded] = useState(() => {
    if (typeof document === 'undefined' || !document.fonts) return true;
    return document.fonts.check('12px GurbaniAkharTrue');
  });

  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return;

    const handleFontsLoaded = () => {
      setFontsLoaded(document.fonts.check('12px GurbaniAkharTrue'));
    };

    handleFontsLoaded();

    document.fonts.addEventListener('loadingdone', handleFontsLoaded);
    return () => {
      document.fonts.removeEventListener('loadingdone', handleFontsLoaded);
    };
  }, []);

  const useUnicode = settings.fontFace === 'Arial' || !fontsLoaded;

  if (baniId !== prevBaniId || settings.baniLength !== prevBaniLength) {
    setPrevBaniId(baniId);
    setPrevBaniLength(settings.baniLength);
    lastExclusiveLineIdRef.current = null;
    if (exclusiveLine) setExclusiveLine(null);

    if (settings.baniLength === 'MEDIUM') {
      const preloaded = getPreloadedShabad(baniId);
      if (preloaded) {
        setLines(preloaded);
        setLoading(false);
        setIsFullyLoaded(false);
      } else {
        setLines([]);
        setLoading(true);
        setIsFullyLoaded(false);
      }
    } else {
      setLines([]);
      setLoading(true);
      setIsFullyLoaded(false);
    }
  }

  const lastScrollTopRef = useRef(0);

  // Handle header auto-hide/show based on window scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // Ignore elastic bounce-back scrolling on iOS
      if (scrollTop < 0) return;

      const lastScrollTop = lastScrollTopRef.current;
      const threshold = 15; // Threshold in pixels before toggling

      if (Math.abs(scrollTop - lastScrollTop) > threshold) {
        if (scrollTop > lastScrollTop && scrollTop > 80) {
          // Scrolling down past header -> hide header
          onHeaderVisibilityChange(false);
        } else if (scrollTop < lastScrollTop) {
          // Scrolling up -> show header
          onHeaderVisibilityChange(true);
        }
        lastScrollTopRef.current = scrollTop;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Reset state on load
    onHeaderVisibilityChange(true);
    lastScrollTopRef.current = window.scrollY || document.documentElement.scrollTop;

    return () => {
      window.removeEventListener('scroll', handleScroll);
      onHeaderVisibilityChange(true);
    };
  }, [baniId, onHeaderVisibilityChange]);

  useEffect(() => {
    let active = true;
    getShabad(baniId, settings.baniLength)
      .then((data) => {
        if (active) {
          setLines(data);
          setLoading(false);
          setIsFullyLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Error loading Shabad lines:", err);
        if (active) {
          setLoading(false);
          setIsFullyLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [baniId, settings.baniLength]);

  const indexItems = useMemo(() => {
    return getBaniIndex(baniId, lines);
  }, [baniId, lines]);

  // Scroll to matched hash on initial load
  useEffect(() => {
    if (isFullyLoaded && lines.length > 0 && window.location.hash) {
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
  }, [isFullyLoaded, lines, indexItems]);

  // Scroll standard view to keep in sync with exclusive line
  useEffect(() => {
    if (exclusiveLine) {
      const element = document.getElementById(`line-${exclusiveLine.ID}`);
      if (element) {
        element.scrollIntoView({ block: 'center' });
      }
    }
  }, [exclusiveLine]);

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
  const formatGurmukhi = (text, vishraamVal) => {
    if (!text) return "";

    let words = text.split(" ");
    let vishraamPositions = {};

    // Parse vishraam positions
    if (settings.vishraam && vishraamVal) {
      try {
        const vishraamJson = typeof vishraamVal === 'string' ? JSON.parse(vishraamVal) : vishraamVal;
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

  const getTransliterationText = (translitVal) => {
    if (!translitVal || settings.transliteration === 'none') return null;
    try {
      const json = typeof translitVal === 'string' ? JSON.parse(translitVal) : translitVal;
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

  const getTranslationText = (transVal) => {
    if (!transVal || settings.translation === 'none') return null;
    try {
      const json = typeof transVal === 'string' ? JSON.parse(transVal) : transVal;
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
                        {(() => {
                          const matchedLine = lines.find(l => l.ID === item.lineId);
                          return matchedLine ? ((useUnicode && matchedLine.GurmukhiUni) ? matchedLine.GurmukhiUni : matchedLine.Gurmukhi) : item.gurmukhi;
                        })()}
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
        <>
          {exclusiveLine && (
            <div className="exclusive-view-overlay">
              {/* Close button */}
              <button
                className="exclusive-view-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  closeExclusive();
                }}
                aria-label="Close exclusive view"
              >
                <X size={20} />
              </button>

              {/* Left Hit Zone (Previous Line) */}
              <div
                className="exclusive-nav-zone left-zone"
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = lines.findIndex(l => l.ID === exclusiveLine.ID);
                  if (currentIndex > 0) {
                    setExclusiveLine(lines[currentIndex - 1]);
                  }
                }}
                title="Previous line"
              />

              {/* Right Hit Zone (Next Line) */}
              <div
                className="exclusive-nav-zone right-zone"
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = lines.findIndex(l => l.ID === exclusiveLine.ID);
                  if (currentIndex < lines.length - 1) {
                    setExclusiveLine(lines[currentIndex + 1]);
                  }
                }}
                title="Next line"
              />

              <div className="exclusive-view-content" style={{ '--gurbani-size': `${settings.fontSize}px` }}>
                {(() => {
                  const translit = getTransliterationText(exclusiveLine.Transliterations);
                  const translation = getTranslationText(exclusiveLine.Translations);
                  const gText = (useUnicode && exclusiveLine.GurmukhiUni) ? exclusiveLine.GurmukhiUni : exclusiveLine.Gurmukhi;
                  const formattedGurmukhi = formatGurmukhi(gText, exclusiveLine.Visraam);
                  const isHeader = exclusiveLine.header === 1;

                  return (
                    <div className={`shabad-line active-highlight ${isHeader ? 'header-section' : ''}`} style={{ cursor: 'default' }}>
                      <div
                        className="shabad-text-gurbani exclusive-large"
                        style={{ fontFamily: settings.fontFace === 'AnmolLipiSG' ? 'AnmolLipiSG' : (settings.fontFace === 'Arial' ? 'Arial' : 'GurbaniAkharTrue') }}
                        dangerouslySetInnerHTML={{ __html: formattedGurmukhi }}
                      />
                      {translit && (
                        <div className="shabad-text-translit exclusive-large">
                          {translit}
                        </div>
                      )}
                      {translation && (
                        <div className="shabad-text-translation exclusive-large">
                          {translation}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <div
            className="reader-scroll-content"
            style={{ '--gurbani-size': `${settings.fontSize}px` }}
          >
            {lines.map((line) => {
              const translit = getTransliterationText(line.Transliterations);
              const translation = getTranslationText(line.Translations);
              const gText = (useUnicode && line.GurmukhiUni) ? line.GurmukhiUni : line.Gurmukhi;
              const formattedGurmukhi = formatGurmukhi(gText, line.Visraam);
              const isHeader = line.header === 1;

              return (
                <div
                  key={line.ID}
                  id={`line-${line.ID}`}
                  className={`shabad-line ${isHeader ? 'header-section' : ''} ${activeLineId === line.ID ? 'active-highlight' : ''}`}
                  onClick={(e) => handleLineClick(e, line)}
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

            {!isFullyLoaded && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px 48px 16px', color: 'var(--accent-gold)', gap: '10px', fontSize: '15px', fontWeight: '500' }}>
                <Loader2 className="loading-spinner" size={20} />
                <span>Loading remaining lines...</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
