import { useState, useEffect } from 'react';
import axios from 'axios';
import { currencies } from '../../../utils/currencies';

const AddTransactionModal = ({ onClose, onSuccess }) => {
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState('');
  const [date, setDate] = useState('');
  const [currencySearch, setCurrencySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtered currencies for dropdown search
  const filteredCurrencies = currencies.filter(c =>
    c.toLowerCase().includes(currencySearch.toLowerCase())
  );

  // Auto-select first filtered currency when search changes
  useEffect(() => {
    if (filteredCurrencies.length > 0) {
      setCurrency(filteredCurrencies[0]);
    } else {
      setCurrency('');
    }
  }, [currencySearch]);

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
      await axios.post('/api/finance-management/add-transactions/', {
        amount,
        currency,
        trans_status: type === 'income' ? 'Deposit' : 'Withdraw',
        category,
        trans_details: desc,
        date: date || undefined,
      });
      setSuccess('Transaction added successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to add transaction.'
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
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Add Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                className={`chef-button-secondary px-4 py-2 rounded ${type === 'income' ? 'bg-green-100 text-green-700 font-bold' : ''}`}
                onClick={() => setType('income')}
              >
                Income
              </button>
              <button
                type="button"
                className={`chef-button-secondary px-4 py-2 rounded ${type === 'expense' ? 'bg-red-100 text-red-700 font-bold' : ''}`}
                onClick={() => setType('expense')}
              >
                Expense
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
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
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="chef-input"
              placeholder="Category (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="chef-input"
              placeholder="Description (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
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
                background: type === 'income'
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
              }}
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
  );
};

export default AddTransactionModal;
