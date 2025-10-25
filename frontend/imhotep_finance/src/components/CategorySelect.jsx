import { useState, useEffect } from 'react';
import axios from 'axios';

const CategorySelect = ({ value, onChange, status, required = false, className = '' }) => {
  const [search, setSearch] = useState('');
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await axios.get(`/api/finance-management/get-category/?status=${status}`);
        setCategoriesList(res.data.category || []);
      } catch {
        setCategoriesList([]);
      }
      setCategoriesLoading(false);
    };
    fetchCategories();
  }, [status]);

  const filtered = categoriesList.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // Auto-select first filtered category when search changes and current value is not in filtered list
    if (filtered.length > 0 && value && !filtered.includes(value)) {
      onChange?.(filtered[0]);
    }
  }, [search, filtered, value, onChange]);

  return (
    <div className="flex gap-2">
      <select
        className={`chef-input ${className}`}
        value={filtered.includes(value) ? value : ''}
        onChange={e => {
          const selectedValue = e.target.value;
          onChange?.(selectedValue);
          if (selectedValue) {
            setSearch('');
          }
        }}
        disabled={categoriesLoading || filtered.length === 0}
      >
        <option value="">Select category</option>
        {filtered.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <input
        type="text"
        value={search || value}
        onChange={e => {
          const val = e.target.value;
          setSearch(val);
          onChange?.(val);
        }}
        className={`chef-input ${className}`}
        placeholder="Type to filter or add new"
        disabled={categoriesLoading}
      />
    </div>
  );
};

export default CategorySelect;
