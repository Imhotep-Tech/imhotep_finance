import { useState } from 'react';
import axios from 'axios';
import CurrencySelect from './CurrencySelect';

const AddWishModal = ({
  onClose,
  onSuccess,
  initialYear = new Date().getFullYear(),
}) => {
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('');
  const [wishDetails, setWishDetails] = useState('');
  const [link, setLink] = useState('');
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (!price || !currency) {
      setError('Price and currency are required.');
      setLoading(false);
      return;
    }
    try {
      await axios.post('/api/finance-management/wishlist/add-wish/', {
        price,
        currency,
        year,
        wish_details: wishDetails,
        link,
      });
      setSuccess('Wish added successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to add wish.'
      );
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex items-start sm:items-center justify-center min-h-screen p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative chef-card mx-auto my-8"
          style={{
            border: '1px solid rgba(54,108,107,0.14)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(242,251,250,0.9))',
            maxHeight: 'calc(100vh - 4rem)',
            overflowY: 'auto',
          }}
        >
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
            Add Wish
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                className="chef-input"
                placeholder="Enter price"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>

              {/*
                Replaced the separate search + select with the reusable CurrencySelect component.
                It will fetch favorite currency and auto-select first filtered currency when searching.
              */}
              <CurrencySelect
                value={currency}
                onChange={setCurrency}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="chef-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Wish Details</label>
              <input
                type="text"
                value={wishDetails}
                onChange={e => setWishDetails(e.target.value)}
                className="chef-input"
                placeholder="Details (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Link</label>
              <input
                type="url"
                value={link}
                onChange={e => setLink(e.target.value)}
                className="chef-input"
                placeholder="Link (optional)"
              />
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
                className="chef-button text-white bg-blue-600"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Add'}
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
    </div>
  );
};

export default AddWishModal;