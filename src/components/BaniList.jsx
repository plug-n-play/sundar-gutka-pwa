import { useState, useEffect } from 'react';
import { getBaniList, DEFAULT_BANI_IDS } from '../database/db.client';
import { Search, Loader2 } from 'lucide-react';

export default function BaniList({ onSelectBani, languageSetting, enabledBaniIds }) {
  const [banis, setBanis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [prevLanguageSetting, setPrevLanguageSetting] = useState(null);

  if (languageSetting !== prevLanguageSetting) {
    setPrevLanguageSetting(languageSetting);
    setLoading(true);
  }

  useEffect(() => {
    getBaniList(languageSetting)
      .then((list) => {
        setBanis(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading Bani list:", err);
        setLoading(false);
      });
  }, [languageSetting]);

  const filteredBanis = banis
    .filter((bani) => {
      const isBaniVisible = enabledBaniIds && enabledBaniIds.includes(bani.id);
      if (!isBaniVisible) return false;

      const query = searchQuery.toLowerCase();
      return (
        bani.gurmukhi.toLowerCase().includes(query) ||
        bani.translit.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const idxA = DEFAULT_BANI_IDS.indexOf(a.id);
      const idxB = DEFAULT_BANI_IDS.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.id - b.id;
    });

  return (
    <div className="home-container">
      <div className="search-bar-wrapper">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder="Search Bani (e.g. Japji, Jaap)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="db-loading-banner">
          <Loader2 className="loading-spinner" size={20} />
          <span>Initializing database & loading prayers...</span>
        </div>
      ) : filteredBanis.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          {searchQuery ? (
            `No Banis found matching "${searchQuery}"`
          ) : (
            <div>
              <p style={{ marginBottom: '12px' }}>No prayers are currently enabled.</p>
              <p style={{ fontSize: '13px' }}>Go to Settings (<span style={{ color: 'var(--accent-gold)' }}>⚙</span>) &gt; Customize Prayer List to choose which prayers appear here.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bani-grid">
          {filteredBanis.map((bani) => (
            <div
              key={bani.id}
              className="bani-card"
              onClick={() => onSelectBani(bani.id, bani.gurmukhi, bani.translit)}
            >
              <div className="bani-title-gurbani">{bani.gurmukhi}</div>
              <div className="bani-title-translit">{bani.translit}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
