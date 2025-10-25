import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CurrencySelect from './CurrencySelect';
import CategorySelect from './CategorySelect';

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
  const [category, setCategory] = useState(initialValues.category || '');
  const [details, setDetails] = useState(initialValues.scheduled_trans_details || '');
  const [isActive, setIsActive] = useState(initialValues.status !== undefined ? initialValues.status : true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
      // let parent refresh its data, then close this modal
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (editMode ? 'Failed to update scheduled transaction.' : 'Failed to add scheduled transaction.')
      );
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-start sm:items-center justify-center min-h-screen p-4">
        <div
          className="rounded-2xl shadow-2xl max-w-md w-full p-6 relative chef-card mx-auto my-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
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
            {editMode ? 'Edit Scheduled Transaction' : 'Add Scheduled Transaction'}
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Day of Month</label>
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Amount</label>
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Currency</label>

              <CurrencySelect
                value={currency}
                onChange={setCurrency}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Category</label>
              <CategorySelect
                value={category}
                onChange={setCategory}
                status={status}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Description</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                className="chef-input resize-none"
                rows="3"
                placeholder="Description (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Status</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  className={`chef-button-secondary px-4 py-2 rounded transition-all duration-200 ${isActive ? 'bg-green-100 text-green-700 font-bold ring-2 ring-green-300 dark:ring-green-700 shadow-sm scale-[1.02]' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} dark:text-gray-100 dark:bg-gray-800`}
                  onClick={() => setIsActive(true)}
                  aria-pressed={isActive}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`chef-button-secondary px-4 py-2 rounded transition-all duration-200 ${!isActive ? 'bg-gray-100 text-gray-700 font-bold ring-2 ring-gray-300 dark:ring-gray-600 shadow-sm scale-[1.02]' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} dark:text-gray-100 dark:bg-gray-800`}
                  onClick={() => setIsActive(false)}
                  aria-pressed={!isActive}
                >
                  Inactive
                </button>
              </div>
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

export default AddScheduledTransactionModal;
