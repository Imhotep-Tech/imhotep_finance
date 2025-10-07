import { useState, useEffect } from 'react';
import axios from 'axios';
import CurrencySelect from './CurrencySelect';

const AddTransactionModal = ({
  onClose,
  onSuccess,
  initialType = 'deposit',
  initialValues = {},
  editMode = false,
}) => {
  const [status, setStatus] = useState(initialType);
  const [amount, setAmount] = useState(initialValues.amount || '');
  const [desc, setDesc] = useState(initialValues.desc || '');
  const [category, setCategory] = useState(initialValues.category || '');
  const [currency, setCurrency] = useState(initialValues.currency || '');
  const [date, setDate] = useState(initialValues.date || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Fetch categories when status changes
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

  // If editMode, update fields when initialValues change
  useEffect(() => {
    if (editMode && initialValues) {
      setAmount(initialValues.amount || '');
      setDesc(initialValues.desc || '');
      setCategory(initialValues.category || '');
      setCurrency(initialValues.currency || '');
      setDate(initialValues.date || '');
      setStatus(initialValues.trans_status || initialType);
    }
  }, [editMode, initialValues, initialType]);

  const handleCategorySelect = (e) => {
    setCategory(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (!amount || !currency) {
      setError('Amount and currency are required.');
      setLoading(false);
      return;
    }
    try {
      if (editMode && initialValues.id) {
        await axios.post(
          `/api/finance-management/transaction/update-transactions/${initialValues.id}/`,
          {
            amount,
            currency,
            trans_status: status,
            category,
            trans_details: desc,
            date: date || undefined,
          }
        );
        setSuccess('Transaction updated successfully!');
      } else {
        await axios.post('/api/finance-management/transaction/add-transactions/', {
          amount,
          currency,
          trans_status: status,
          category,
          trans_details: desc,
          date: date || undefined,
        });
        setSuccess('Transaction added successfully!');
      }
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (editMode ? 'Failed to update transaction.' : 'Failed to add transaction.')
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
            {editMode ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Type</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  className={`chef-button-secondary px-4 py-2 rounded transition-all duration-200 dark:text-gray-100 dark:bg-gray-800 ${status === 'deposit' ? 'bg-green-100 text-green-700 font-bold ring-2 ring-green-300 dark:ring-green-700 shadow-sm scale-[1.02]' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => setStatus('deposit')}
                  aria-pressed={status === 'deposit'}
                >
                  Income
                </button>
                <button
                  type="button"
                  className={`chef-button-secondary px-4 py-2 rounded transition-all duration-200 dark:text-gray-100 dark:bg-gray-800 ${status === 'withdraw' ? 'bg-red-100 text-red-700 font-bold ring-2 ring-red-300 dark:ring-red-700 shadow-sm scale-[1.02]' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => setStatus('withdraw')}
                  aria-pressed={status === 'withdraw'}
                >
                  Expense
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="chef-input"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Currency</label>

              <CurrencySelect
                value={currency}
                onChange={setCurrency}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Category</label>
              <div className="flex gap-2">
                <select
                  className="chef-input"
                  value={category}
                  onChange={handleCategorySelect}
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Description</label>
              <input
                type="text"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="chef-input"
                placeholder="Description (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="chef-input"
                placeholder="Date (optional)"
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

export default AddTransactionModal;
