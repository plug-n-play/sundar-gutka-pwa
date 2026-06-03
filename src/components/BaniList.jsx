import { useState, useEffect } from 'react';
import { getBaniList } from '../database/db.client';
import { Search, Loader2 } from 'lucide-react';

export default function BaniList({ onSelectBani, languageSetting }) {
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

  const filteredBanis = banis.filter((bani) => {
    const query = searchQuery.toLowerCase();
    return (
      bani.gurmukhi.toLowerCase().includes(query) ||
      bani.translit.toLowerCase().includes(query)
    );
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
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No Banis found matching "{searchQuery}"
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
