import { useState, useEffect } from 'react';
import axios from 'axios';
import { currencies } from '../../../utils/currencies';

const AddScheduledTransactionModal = ({
  onClose,
  onSuccess,
  initialType = 'deposit',
  initialValues = {},
  editMode = false,
}) => {
  const [status, setStatus] = useState(initialType);
  const [dayOfMonth, setDayOfMonth] = useState(initialValues.day_of_month || '');
  const [amount, setAmount] = useState(initialValues.amount || '');
  const [currency, setCurrency] = useState(initialValues.currency || '');
  const [currencySearch, setCurrencySearch] = useState('');
  const [category, setCategory] = useState(initialValues.category || '');
  const [details, setDetails] = useState(initialValues.scheduled_trans_details || '');
  const [isActive, setIsActive] = useState(initialValues.status !== undefined ? initialValues.status : true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [favoriteCurrency, setFavoriteCurrency] = useState('');

  useEffect(() => {
    const fetchFavoriteCurrency = async () => {
      try {
        const res = await axios.get('/api/finance-management/get-networth/');
        setFavoriteCurrency(res.data.favorite_currency || '');
      } catch {
        setFavoriteCurrency('');
      }
    };
    fetchFavoriteCurrency();
  }, []);

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

  const filteredCurrencies = currencies.filter(c =>
    c.toLowerCase().includes(currencySearch.toLowerCase())
  );

  useEffect(() => {
    if (filteredCurrencies.length > 0) {
      setCurrency(filteredCurrencies[0]);
    } else {
      setCurrency('');
    }
  }, [currencySearch]);

  useEffect(() => {
    if (editMode && initialValues) {
      setAmount(initialValues.amount || '');
      setCurrency(initialValues.currency || '');
      setCategory(initialValues.category || '');
      setDetails(initialValues.scheduled_trans_details || '');
      setDayOfMonth(initialValues.day_of_month || '');
      setIsActive(initialValues.status !== undefined ? initialValues.status : true);
      setStatus(initialValues.scheduled_trans_status || initialType);
    }
  }, [editMode, initialValues, initialType]);

  useEffect(() => {
    if (favoriteCurrency && !currency) {
      setCurrency(favoriteCurrency);
    }
  }, [favoriteCurrency, currency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (!amount || !currency || !dayOfMonth) {
      setError('Amount, currency, and day of month are required.');
      setLoading(false);
      return;
    }
    try {
      const data = {
        scheduled_trans_status: status,
        day_of_month: dayOfMonth,
        amount,
        currency,
        category,
        scheduled_trans_details: details,
        status: isActive,
      };
      if (editMode && initialValues.id) {
        await axios.post(
          `/api/finance-management/scheduled-trans/update-scheduled-trans/${initialValues.id}/`,
          data
        );
        setSuccess('Scheduled transaction updated successfully!');
      } else {
        await axios.post('/api/finance-management/scheduled-trans/add-scheduled-trans/', data);
        setSuccess('Scheduled transaction added successfully!');
      }
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (editMode ? 'Failed to update scheduled transaction.' : 'Failed to add scheduled transaction.')
      );
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative chef-card"
        style={{
          border: '1px solid rgba(54,108,107,0.14)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(242,251,250,0.9))',
        }}>
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          {editMode ? 'Edit Scheduled Transaction' : 'Add Scheduled Transaction'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                className={`chef-button-secondary px-4 py-2 rounded ${status === 'deposit' ? 'bg-green-100 text-green-700 font-bold' : ''}`}
                onClick={() => setStatus('deposit')}
              >
                Income
              </button>
              <button
                type="button"
                className={`chef-button-secondary px-4 py-2 rounded ${status === 'withdraw' ? 'bg-red-100 text-red-700 font-bold' : ''}`}
                onClick={() => setStatus('withdraw')}
              >
                Expense
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Day of Month</label>
            <select
              value={dayOfMonth}
              onChange={e => setDayOfMonth(e.target.value)}
              required
              className="chef-input"
            >
              <option value="" disabled>Select day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="chef-input"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
            <input
              type="text"
              className="chef-input mb-2"
              placeholder="Search currency..."
              value={currencySearch}
              onChange={e => setCurrencySearch(e.target.value)}
            />
            <select
              className="chef-input"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              required
            >
              {filteredCurrencies.length === 0 && (
                <option value="">No currencies found</option>
              )}
              {filteredCurrencies.map(cur => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <div className="flex gap-2">
              <select
                className="chef-input"
                value={category}
                onChange={e => setCategory(e.target.value)}
                disabled={categoriesLoading || categoriesList.length === 0}
              >
                <option value="">Select category</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="chef-input"
                placeholder="Category (optional)"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              className="chef-input resize-none"
              rows="3"
              placeholder="Description (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <div className="flex gap-4">
              <button
                type="button"
                className={`chef-button-secondary px-4 py-2 rounded ${isActive ? 'bg-green-100 text-green-700 font-bold' : ''}`}
                onClick={() => setIsActive(true)}
              >
                Active
              </button>
              <button
                type="button"
                className={`chef-button-secondary px-4 py-2 rounded ${!isActive ? 'bg-gray-100 text-gray-700 font-bold' : ''}`}
                onClick={() => setIsActive(false)}
              >
                Inactive
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="chef-button-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="chef-button text-white"
              style={{
                background: status === 'deposit'
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
              }}
              disabled={loading}
            >
              {loading ? (editMode ? 'Saving...' : 'Saving...') : (editMode ? 'Save' : 'Add')}
            </button>
          </div>
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{success}</div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddScheduledTransactionModal;
