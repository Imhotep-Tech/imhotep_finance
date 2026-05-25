import { useState, useEffect } from 'react';
import axios from 'axios';

const PlaceSelect = ({ value, onChange, currency, required = false, className = '', disabled = false }) => {
  const [search, setSearch] = useState('');
  const [placesList, setPlacesList] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);

  useEffect(() => {
    const fetchPlaces = async () => {
      setPlacesLoading(true);
      try {
        const query = currency ? `?currency=${currency}` : '';
        const res = await axios.get(`/api/finance-management/get-places/${query}`);
        setPlacesList(res.data.places || []);
      } catch {
        setPlacesList([]);
      }
      setPlacesLoading(false);
    };
    fetchPlaces();
  }, [currency]);

  const filtered = placesList.filter(p =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // Auto-select first filtered place when search changes and current value is not in filtered list
    if (filtered.length > 0 && value && !filtered.includes(value)) {
      onChange?.(filtered[0]);
    }
  }, [search, filtered, value, onChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <select
        className={`chef-input flex-1 w-full ${className}`}
        value={filtered.includes(value) ? value : ''}
        onChange={e => {
          const selectedValue = e.target.value;
          onChange?.(selectedValue);
          if (selectedValue) {
            setSearch('');
          }
        }}
        disabled={disabled || placesLoading || filtered.length === 0}
      >
        <option value="">Select place</option>
        {filtered.map(place => (
          <option key={place} value={place}>{place}</option>
        ))}
      </select>
      <input
        type="text"
        value={search || value || ''}
        onChange={e => {
          const val = e.target.value;
          setSearch(val);
          onChange?.(val);
        }}
        className={`chef-input flex-1 w-full ${className}`}
        placeholder="Type to filter or add new"
        disabled={disabled || placesLoading}
      />
    </div>
  );
};

export default PlaceSelect;
