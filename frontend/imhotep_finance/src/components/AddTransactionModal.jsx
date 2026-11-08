import { useState, useEffect } from 'react';
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

const AddTransactionModal = ({
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
  const [amount, setAmount] = useState(initialValues.amount || '');
  const [currency, setCurrency] = useState(initialValues.currency || '');
  const [place, setPlace] = useState(initialValues.place || '');
  const [category, setCategory] = useState(initialValues.category || '');
  const [desc, setDesc] = useState(initialValues.desc || initialValues.trans_details || '');
  const [date, setDate] = useState(initialValues.date || new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [shaking, setShaking] = useState(false);

  // If editMode, initialize fields
  useEffect(() => {
    if (editMode && initialValues) {
      setAmount(initialValues.amount ? String(initialValues.amount) : '');
      setDesc(initialValues.desc || initialValues.trans_details || '');
      setCategory(initialValues.category || '');
      setPlace(initialValues.place || '');
      setCurrency(initialValues.currency || '');
      setDate(initialValues.date || new Date().toISOString().split('T')[0]);
      setStatus(initialValues.trans_status || initialType);
    }
  }, [editMode, initialValues, initialType]);

  // Balance calculation
  const placeName = place && place.trim() ? place.trim() : 'General';
  const availableInPlace = getBalanceForPlace(networthDetails, currency, placeName);
  const totalInAllPlaces = getTotalBalanceForCurrency(networthDetails, currency);
  const numericAmount = parseFloat(amount) || 0;
  const isExpense = status === 'withdraw';
  const isInsufficient = isExpense && currency && numericAmount > 0 && numericAmount > availableInPlace;
  const shortfall = isInsufficient ? (numericAmount - availableInPlace) : 0;
  const remainingAfterExpense = Math.max(0, availableInPlace - numericAmount);
  const projectedIncomeBalance = availableInPlace + numericAmount;

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errors = {};
    if (!amount || String(amount).trim() === '') {
      errors.amount = t('transactions.fields.amount') + ' is required.';
    } else if (isNaN(numericAmount) || numericAmount <= 0) {
      errors.amount = t('transactions.modal.amountPositive') || 'Amount must be greater than 0.';
    } else if (String(amount).includes('.') && String(amount).split('.')[1].length > 2) {
      errors.amount = t('transactions.modal.amountDecimals') || 'Max 2 decimal places allowed.';
    }

    if (!currency || currency.trim() === '') {
      errors.currency = t('transactions.modal.currencyRequired') || 'Currency is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errors = {};
    if (isExpense && isInsufficient) {
      errors.balance = t('transactions.modal.insufficientFunds', {
        place: placeName,
        balance: availableInPlace.toFixed(2),
        currency,
        shortfall: shortfall.toFixed(2)
      }) || `Insufficient funds in ${placeName}! Available: ${availableInPlace.toFixed(2)} ${currency}`;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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
      const payload = {
        amount: numericAmount,
        currency,
        trans_status: status,
        category: category || '',
        place: place || '',
        trans_details: desc || '',
        date: date || undefined,
      };

      if (editMode && initialValues.id) {
        await axios.post(
          `/api/finance-management/transaction/update-transactions/${initialValues.id}/`,
          payload
        );
        setSuccess(t('transactions.modal.updateSuccess') || 'Transaction updated successfully!');
      } else {
        await axios.post('/api/finance-management/transaction/add-transactions/', payload);
        setSuccess(t('transactions.modal.addSuccess') || 'Transaction added successfully!');
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 700);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (editMode ? t('transactions.modal.updateFailed') : t('transactions.modal.addFailed')) ||
        'Operation failed.'
      );
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative border border-gray-100 dark:border-gray-800 transition-transform duration-300 ${shaking ? 'animate-shake' : ''}`}
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
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
              {t('transactions.modal.step', { current: step, total: 3 }) || `Step ${step} of 3`}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {step === 1 && (t('transactions.modal.step1Title') || 'Amount & Type')}
              {step === 2 && (t('transactions.modal.step2Title') || 'Currency & Account')}
              {step === 3 && (t('transactions.modal.step3Title') || 'Category & Details')}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editMode ? t('transactions.editTransaction') : t('transactions.addTransaction')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {step === 1 && (t('transactions.modal.step1Desc') || 'How much and is it income or expense?')}
            {step === 2 && (t('transactions.modal.step2Desc') || 'Where is the money coming from or going to?')}
            {step === 3 && (t('transactions.modal.step3Desc') || 'Tag it and add any extra notes')}
          </p>
        </div>

        {/* Interactive Step Progress Indicator */}
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
                    ? 'bg-gradient-to-r from-primary-500 to-amber-500 shadow-sm'
                    : s < step
                    ? 'bg-emerald-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                title={`Go to step ${s}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 font-medium px-1">
            <span className={step >= 1 ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}>1. Amount</span>
            <span className={step >= 2 ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}>2. Account</span>
            <span className={step >= 3 ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}>3. Review</span>
          </div>
        </div>

        {/* Step 1: Type, Amount & Currency */}
        {step === 1 && (
          <div className="space-y-5 animate-slide-in">
            {/* Income / Expense Switcher */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('transactions.fields.type')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => !editMode && setStatus('deposit')}
                  disabled={editMode}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 font-bold transition-all duration-200 ${
                    status === 'deposit'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-md scale-[1.02]'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-200 text-gray-600 dark:text-gray-300'
                  } ${editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-xl">💰</span>
                  <span>{t('transactions.types.income')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => !editMode && setStatus('withdraw')}
                  disabled={editMode}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 font-bold transition-all duration-200 ${
                    status === 'withdraw'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-md scale-[1.02]'
                      : 'border-gray-200 dark:border-gray-700 hover:border-rose-200 text-gray-600 dark:text-gray-300'
                  } ${editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-xl">💳</span>
                  <span>{t('transactions.types.expense')}</span>
                </button>
              </div>
            </div>

            {/* Currency Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('transactions.fields.currency')} *
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

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('transactions.fields.amount')} *
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
                  placeholder={t('transactions.fields.amountPlaceholder')}
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
                {amount && (
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300 transition-colors ml-auto"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Balance Preview Banner */}
            {currency && (
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  Total in all accounts:
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {totalInAllPlaces.toFixed(2)} {currency}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Account / Place & Category */}
        {step === 2 && (
          <div className="space-y-5 animate-slide-in">
            {/* Account / Place */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('transactions.fields.place')}
              </label>
              <PlaceSelect
                value={place}
                onChange={(val) => {
                  setPlace(val);
                  setFieldErrors(prev => ({ ...prev, balance: undefined }));
                }}
                currency={currency}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Where the money is withdrawn from or deposited to (e.g., Cash, Bank, General).
              </p>
            </div>

            {/* Live Balance Validation & Insight Card */}
            {currency && (
              <div
                className={`p-4 rounded-2xl border transition-all duration-300 ${
                  isExpense
                    ? isInsufficient
                      ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 shadow-sm'
                      : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 shadow-sm'
                    : 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-300 dark:border-teal-900 text-teal-800 dark:text-teal-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">
                    {isExpense ? (isInsufficient ? '🚨' : '✅') : '📈'}
                  </span>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-sm mb-1">
                      {isExpense
                        ? (isInsufficient ? 'Insufficient Funds Alert' : 'Funds Available')
                        : 'Income Impact'}
                    </div>

                    <div className="flex justify-between py-0.5">
                      <span className="opacity-80">Available in {placeName}:</span>
                      <span className="font-bold">{availableInPlace.toFixed(2)} {currency}</span>
                    </div>

                    <div className="flex justify-between py-0.5">
                      <span className="opacity-80">Transaction Amount:</span>
                      <span className="font-bold">{numericAmount.toFixed(2)} {currency}</span>
                    </div>

                    <div className="border-t border-current/20 my-1.5 pt-1.5 flex justify-between font-bold">
                      {isExpense ? (
                        isInsufficient ? (
                          <>
                            <span className="text-rose-700 dark:text-rose-300">Deficit shortfall:</span>
                            <span className="text-rose-700 dark:text-rose-300">-{shortfall.toFixed(2)} {currency}</span>
                          </>
                        ) : (
                          <>
                            <span>Remaining balance:</span>
                            <span>{remainingAfterExpense.toFixed(2)} {currency}</span>
                          </>
                        )
                      ) : (
                        <>
                          <span>New expected balance:</span>
                          <span>{projectedIncomeBalance.toFixed(2)} {currency}</span>
                        </>
                      )}
                    </div>

                    {isExpense && isInsufficient && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-100/70 dark:bg-rose-900/50 text-[11px] leading-relaxed">
                        {totalInAllPlaces >= numericAmount ? (
                          <>💡 You have <strong>{totalInAllPlaces.toFixed(2)} {currency}</strong> across all accounts. Try selecting a different account (e.g. Bank) or transfer funds before withdrawing.</>
                        ) : (
                          <>⚠️ Total balance across all accounts ({totalInAllPlaces.toFixed(2)} {currency}) is less than this expense.</>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Category Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('transactions.fields.category')}
              </label>
              <CategorySelect
                value={category}
                onChange={setCategory}
                status={status}
              />
            </div>
          </div>
        )}

        {/* Step 3: Date, Description & Final Review */}
        {step === 3 && (
          <div className="space-y-5 animate-slide-in">
            {/* Date Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('transactions.fields.date')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="chef-input"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('transactions.fields.description')}
              </label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="chef-input"
                placeholder={t('transactions.fields.descriptionPlaceholder')}
              />
            </div>

            {/* Final Live Review Summary Card */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('transactions.modal.reviewTitle') || 'Review Transaction'}
              </label>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-800/40 border border-gray-200 dark:border-gray-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      status === 'deposit'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                    }`}
                  >
                    <span>{status === 'deposit' ? '⬇️ Income' : '⬆️ Expense'}</span>
                  </span>
                  <div className="text-xl font-black text-gray-900 dark:text-gray-100">
                    {status === 'deposit' ? '+' : '-'} {numericAmount.toFixed(2)} {currency}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Account</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{placeName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Category</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{category || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Date</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Note</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200 truncate block">
                      {desc || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Error & Success Alerts */}
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

        {/* Modal Action Buttons Footer */}
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
                background: 'linear-gradient(135deg, #ed7143 0%, #e85a2b 100%)',
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

export default AddTransactionModal;
