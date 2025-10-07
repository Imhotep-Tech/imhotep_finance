import { useState, useEffect } from 'react';
import axios from 'axios';
import CurrencySelect from './CurrencySelect';

const UpdateWishModal = ({
  onClose,
  onSuccess,
  initialValues = {},
}) => {
  const [price, setPrice] = useState(initialValues.price || '');
  const [currency, setCurrency] = useState(initialValues.currency || '');
  const [wishDetails, setWishDetails] = useState(initialValues.wish_details || '');
  const [link, setLink] = useState(initialValues.link || '');
  const [year, setYear] = useState(initialValues.year || new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (initialValues) {
      setPrice(initialValues.price || '');
      setCurrency(initialValues.currency || '');
      setWishDetails(initialValues.wish_details || '');
      setLink(initialValues.link || '');
      setYear(initialValues.year || new Date().getFullYear());
    }
  }, [initialValues]);

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
      await axios.post(
        `/api/finance-management/wishlist/update-wish/${initialValues.id}/`,
        {
          price,
          currency,
          year,
          wish_details: wishDetails,
          link,
        }
      );
      setSuccess('Wish updated successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to update wish.'
      );
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex items-start sm:items-center justify-center min-h-screen p-4">
        <div
          className="rounded-2xl shadow-2xl max-w-md w-full p-6 relative chef-card mx-auto my-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          style={{
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
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            Edit Wish
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Price</label>
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Currency</label>

              {/* Use shared CurrencySelect so the opened wish currency is preserved */}
              <CurrencySelect
                value={currency}
                onChange={setCurrency}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Year</label>
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Wish Details</label>
              <input
                type="text"
                value={wishDetails}
                onChange={e => setWishDetails(e.target.value)}
                className="chef-input"
                placeholder="Details (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Link</label>
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
                className="chef-button-secondary dark:text-gray-100 dark:bg-gray-800"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
            {success && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded text-green-700 dark:text-green-300 text-sm">{success}</div>
            )}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded text-red-700 dark:text-red-300 text-sm">{error}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateWishModal;
