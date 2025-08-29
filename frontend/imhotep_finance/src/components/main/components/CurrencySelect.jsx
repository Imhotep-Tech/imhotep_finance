import { useState, useEffect } from 'react';
import axios from 'axios';
import { currencies } from '../../../utils/currencies';

const CurrencySelect = ({ value, onChange, required = false, className = '' }) => {
  const [search, setSearch] = useState('');
  const [favoriteCurrency, setFavoriteCurrency] = useState('');
  const [favoriteLoaded, setFavoriteLoaded] = useState(false);
  const filtered = currencies.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  // fetch favorite currency once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/get-fav-currency/');
        console.log("Fav Currency"+res.data.favorite_currency)
        if (!mounted) return;
        const fav = res.data.favorite_currency || '';
        setFavoriteCurrency(fav);
        // only set fav if no value already provided
        if (fav && (!value || value === '')) {
          onChange?.(fav);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setFavoriteLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []); // eslint-disable-line

  // auto-select first filtered currency when search changes,
  // but only after favorite currency loading finished to avoid overriding it with USD
  useEffect(() => {
    if (!favoriteLoaded) return;
    if (filtered.length > 0 && (!value || value === '' || !filtered.includes(value))) {
      onChange?.(filtered[0]);
    }
  }, [search, favoriteLoaded]); // intentionally run after favorite load and when search changes

  return (
    <div>
      <input
        type="text"
        className={`chef-input mb-2 ${className}`}
        placeholder="Search currency..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search currency"
      />
      <select
        className={`chef-input ${className}`}
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        required={required}
      >
        {filtered.length === 0 && <option value="">No currencies found</option>}
        {filtered.map(cur => (
          <option key={cur} value={cur}>{cur}</option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelect;
