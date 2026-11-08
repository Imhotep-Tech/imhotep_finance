import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CurrencySelect from './CurrencySelect';
import CategorySelect from './CategorySelect';
import PlaceSelect from './PlaceSelect';
import { useTranslation } from '../contexts/LanguageContext';
import {
  useNetworthBalances,
  getBalanceForPlace,
  getTotalBalanceForCurrency
} from '../utils/useNetworthBalances';

const AddScheduledTransactionModal = ({
  onClose,
  onSuccess,
  initialType = 'deposit',
  initialValues = {},
  editMode = false,
}) => {
  const { t } = useTranslation();
  const { details: networthDetails } = useNetworthBalances();

  const [step, setStep] = useState(1);
  const [status, setStatus] = useState(initialType);
  const [dayOfMonth, setDayOfMonth] = useState(initialValues.day_of_month || '1');
  const [amount, setAmount] = useState(initialValues.amount || '');
  const [currency, setCurrency] = useState(initialValues.currency || '');
  const [category, setCategory] = useState(initialValues.category || '');
  const [place, setPlace] = useState(initialValues.place || '');
  const [details, setDetails] = useState(initialValues.scheduled_trans_details || '');
  const [isActive, setIsActive] = useState(initialValues.status !== undefined ? initialValues.status : true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [shaking, setShaking] = useState(false);
  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (editMode && initialValues) {
      setAmount(initialValues.amount ? String(initialValues.amount) : '');
      setCurrency(initialValues.currency || '');
      setCategory(initialValues.category || '');
      setPlace(initialValues.place || '');
      setDetails(initialValues.scheduled_trans_details || '');
      setDayOfMonth(initialValues.day_of_month ? String(initialValues.day_of_month) : '1');
      setIsActive(initialValues.status !== undefined ? initialValues.status : true);
      setStatus(initialValues.scheduled_trans_status || initialType);
    }
  }, [editMode, initialValues, initialType]);

  const placeName = place && place.trim() ? place.trim() : 'General';
  const availableInPlace = getBalanceForPlace(networthDetails, currency, placeName);
  const totalInAllPlaces = getTotalBalanceForCurrency(networthDetails, currency);
  const numericAmount = parseFloat(amount) || 0;
  const isExpense = status === 'withdraw';
  const isBelowCurrentBalance = isExpense && currency && numericAmount > 0 && availableInPlace < numericAmount;

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  const validateStep1 = () => {
    const errors = {};
    if (!amount || String(amount).trim() === '') {
      errors.amount = t('scheduled.modal.amount') + ' is required.';
    } else if (isNaN(numericAmount) || numericAmount <= 0) {
      errors.amount = t('scheduled.modal.amountPositive') || 'Amount must be greater than 0.';
    } else if (String(amount).includes('.') && String(amount).split('.')[1].length > 2) {
      errors.amount = t('scheduled.modal.amountDecimals') || 'Max 2 decimal places allowed.';
    }

    if (!currency || currency.trim() === '') {
      errors.currency = t('scheduled.modal.currencyRequired') || 'Currency is required.';
    }

    const day = parseInt(dayOfMonth, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      errors.dayOfMonth = t('scheduled.modal.dayRangeError') || 'Day of month must be between 1 and 31.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!validateStep1()) {
        triggerShake();
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) {
        triggerShake();
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setFieldErrors({});
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleQuickAdd = (addVal) => {
    const current = parseFloat(amount) || 0;
    const nextVal = (current + addVal).toFixed(2);
    setAmount(String(parseFloat(nextVal)));
    setFieldErrors(prev => ({ ...prev, amount: undefined }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep1() || !validateStep2()) {
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = {
        scheduled_trans_status: status,
        day_of_month: parseInt(dayOfMonth, 10),
        amount: numericAmount,
        currency,
        category: category || '',
        place: place || '',
        scheduled_trans_details: details || '',
        status: isActive,
      };

      if (editMode && initialValues.id) {
        await axios.post(
          `/api/finance-management/scheduled-trans/update-scheduled-trans/${initialValues.id}/`,
          data
        );
        setSuccess(t('scheduled.modal.updateSuccess') || 'Scheduled transaction updated successfully!');
      } else {
        await axios.post('/api/finance-management/scheduled-trans/add-scheduled-trans/', data);
        setSuccess(t('scheduled.modal.addSuccess') || 'Scheduled transaction added successfully!');
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 700);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (editMode ? t('scheduled.modal.updateFailed') : t('scheduled.modal.addFailed')) ||
        'Failed to save scheduled transaction.'
      );
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative border border-gray-100 dark:border-gray-800 transition-transform duration-300 ${shaking ? 'animate-shake' : ''}`}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Close Button */}
        <button
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {t('scheduled.modal.step', { current: step, total: 3 }) || `Step ${step} of 3`}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {step === 1 && (t('scheduled.modal.step1Title') || 'Amount & Schedule')}
              {step === 2 && (t('scheduled.modal.step2Title') || 'Account & Category')}
              {step === 3 && (t('scheduled.modal.reviewTitle') || 'Review Scheduled Transaction')}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editMode ? t('scheduled.editScheduled') : t('scheduled.addScheduled')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {step === 1 && (t('scheduled.modal.step1Desc') || 'Type, recurring amount, currency, and day of month')}
            {step === 2 && (t('scheduled.modal.step2Desc') || 'Where it executes, category, and optional description')}
            {step === 3 && 'Double check your automated recurring transaction'}
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (s < step) setStep(s);
                  else if (s === 2 && validateStep1()) setStep(2);
                  else if (s === 3 && validateStep1() && validateStep2()) setStep(3);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm'
                    : s < step
                    ? 'bg-emerald-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 font-medium px-1">
            <span className={step >= 1 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>1. Schedule</span>
            <span className={step >= 2 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>2. Account</span>
            <span className={step >= 3 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>3. Review</span>
          </div>
        </div>

        {/* Step 1: Type, Recurring Amount, Currency, Day of Month */}
        {step === 1 && (
          <div className="space-y-5 animate-slide-in">
            {/* Type toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('scheduled.modal.type') || 'Recurring Type'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('deposit')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 font-bold transition-all duration-200 ${
                    status === 'deposit'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-md scale-[1.02]'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-200 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <span className="text-xl">💰</span>
                  <span>{t('scheduled.modal.income')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('withdraw')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 font-bold transition-all duration-200 ${
                    status === 'withdraw'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-md scale-[1.02]'
                      : 'border-gray-200 dark:border-gray-700 hover:border-rose-200 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <span className="text-xl">💳</span>
                  <span>{t('scheduled.modal.expense')}</span>
                </button>
              </div>
            </div>

            {/* Currency Select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('scheduled.modal.currency')} *
              </label>
              <CurrencySelect
                value={currency}
                onChange={(val) => {
                  setCurrency(val);
                  setFieldErrors(prev => ({ ...prev, currency: undefined }));
                }}
                required
              />
              {fieldErrors.currency && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.currency}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('scheduled.modal.amount')} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setFieldErrors(prev => ({ ...prev, amount: undefined }));
                  }}
                  required
                  className={`chef-input text-2xl font-bold tracking-tight pr-16 ${
                    fieldErrors.amount ? 'border-rose-500 ring-2 ring-rose-200 dark:ring-rose-900/40' : ''
                  }`}
                  placeholder={t('scheduled.modal.amountPlaceholder')}
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 dark:text-gray-500 text-sm">
                  {currency || 'CUR'}
                </div>
              </div>
              {fieldErrors.amount && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1 font-medium">
                  <span>⚠️</span> {fieldErrors.amount}
                </p>
              )}

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 mt-2.5">
                {[10, 50, 100, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAdd(val)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Day of Month */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('scheduled.modal.dayOfMonth')} (1 - 31) *
              </label>
              <select
                value={dayOfMonth}
                onChange={(e) => {
                  setDayOfMonth(e.target.value);
                  setFieldErrors(prev => ({ ...prev, dayOfMonth: undefined }));
                }}
                className="chef-input"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d} of each month
                  </option>
                ))}
              </select>
              {parseInt(dayOfMonth, 10) >= 29 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl">
                  {t('scheduled.modal.monthEndNotice') || 'Note: For shorter months (e.g. February), execution occurs on the last day of that month.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Account, Category, Active Toggle & Notes */}
        {step === 2 && (
          <div className="space-y-5 animate-slide-in">
            {/* Account / Place */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('scheduled.modal.place')}
              </label>
              <PlaceSelect
                value={place}
                onChange={setPlace}
                currency={currency}
              />
            </div>

            {/* Account balance preview & advisory */}
            {currency && (
              <div
                className={`p-4 rounded-2xl border transition-all duration-300 text-xs ${
                  isExpense
                    ? isBelowCurrentBalance
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-200'
                      : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
                    : 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-900 text-blue-800 dark:text-blue-200'
                }`}
              >
                <div className="font-bold text-sm mb-1">
                  {isExpense
                    ? (isBelowCurrentBalance ? '⚠️ Balance Alert for Recurring Charge' : '✓ Account Funded')
                    : '📅 Recurring Income'}
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="opacity-80">Current balance in {placeName}:</span>
                  <span className="font-bold">{availableInPlace.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="opacity-80">Monthly execution amount:</span>
                  <span className="font-bold">{numericAmount.toFixed(2)} {currency}</span>
                </div>
                {isExpense && isBelowCurrentBalance && (
                  <p className="mt-2 text-[11px] leading-relaxed">
                    Current balance is less than this recurring charge. Be sure to deposit funds to {placeName} before day {dayOfMonth} to prevent transaction failure.
                  </p>
                )}
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('scheduled.modal.category')}
              </label>
              <CategorySelect
                value={category}
                onChange={setCategory}
                status={status}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('scheduled.modal.description')}
              </label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="chef-input"
                placeholder={t('scheduled.modal.descriptionOptional')}
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div>
                <div className="font-bold text-xs text-gray-900 dark:text-gray-100">
                  {t('scheduled.modal.active') || 'Active Status'}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  {isActive ? 'Will trigger automatically each month' : 'Paused (will not execute until enabled)'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-5 animate-slide-in">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800/80 dark:to-gray-800/40 border border-blue-200 dark:border-gray-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    status === 'deposit'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                  }`}
                >
                  <span>{status === 'deposit' ? '⬇️ Recurring Income' : '⬆️ Recurring Expense'}</span>
                </span>
                <div className="text-xl font-black text-gray-900 dark:text-gray-100">
                  {numericAmount.toFixed(2)} {currency} / mo
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-blue-200 dark:border-gray-700">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Execution Day</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Day {dayOfMonth} of month</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Account</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{placeName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Category</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{category || 'General'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className={`font-semibold ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Errors / Success Alerts */}
        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <span>🚨</span>
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <span>✅</span>
            <span className="flex-1 font-medium">{success}</span>
          </div>
        )}

        {/* Buttons Footer */}
        <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          {step > 1 ? (
            <button
              type="button"
              className="chef-button-secondary py-2.5 px-5 text-sm dark:text-gray-100 dark:bg-gray-800 w-auto flex items-center gap-1.5"
              onClick={handleBack}
              disabled={loading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>{t('common.actions.back') || 'Back'}</span>
            </button>
          ) : (
            <button
              type="button"
              className="chef-button-secondary py-2.5 px-5 text-sm dark:text-gray-100 dark:bg-gray-800 w-auto"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.actions.cancel') || 'Cancel'}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="chef-button py-2.5 px-6 text-sm text-white w-auto flex items-center gap-1.5 font-bold shadow-md hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              }}
            >
              <span>{t('common.actions.next') || 'Next'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="chef-button py-2.5 px-7 text-sm text-white w-auto flex items-center gap-2 font-bold shadow-md hover:shadow-lg"
              style={{
                background: status === 'deposit'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>{t('common.actions.saving') || 'Saving...'}</span>
                </>
              ) : (
                <span>{editMode ? (t('common.actions.save') || 'Save') : (t('common.actions.add') || 'Add')}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddScheduledTransactionModal;
