import { useState, useEffect } from 'react';
import axios from 'axios';
import CurrencySelect from './CurrencySelect';
import PlaceSelect from './PlaceSelect';
import { useTranslation } from '../contexts/LanguageContext';
import {
  useNetworthBalances,
  getTotalBalanceForCurrency
} from '../utils/useNetworthBalances';

const UpdateWishModal = ({
  onClose,
  onSuccess,
  initialValues = {},
}) => {
  const { t } = useTranslation();
  const { details: networthDetails } = useNetworthBalances();

  const [step, setStep] = useState(1);
  const [price, setPrice] = useState(initialValues.price || '');
  const [currency, setCurrency] = useState(initialValues.currency || '');
  const [wishDetails, setWishDetails] = useState(initialValues.wish_details || '');
  const [link, setLink] = useState(initialValues.link || '');
  const [place, setPlace] = useState(initialValues.place || '');
  const [year, setYear] = useState(initialValues.year || new Date().getFullYear());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setPrice(initialValues.price ? String(initialValues.price) : '');
      setCurrency(initialValues.currency || '');
      setWishDetails(initialValues.wish_details || '');
      setLink(initialValues.link || '');
      setPlace(initialValues.place || '');
      setYear(initialValues.year || new Date().getFullYear());
    }
  }, [initialValues]);

  const numericPrice = parseFloat(price) || 0;
  const totalSaved = getTotalBalanceForCurrency(networthDetails, currency);
  const isAffordable = currency && numericPrice > 0 && totalSaved >= numericPrice;
  const deficit = Math.max(0, numericPrice - totalSaved);
  const progressPercent = numericPrice > 0 ? Math.min(100, Math.round((totalSaved / numericPrice) * 100)) : 0;

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  const validateStep1 = () => {
    const errors = {};
    if (!price || String(price).trim() === '') {
      errors.price = t('wishlist.modal.price') + ' is required.';
    } else if (isNaN(numericPrice) || numericPrice <= 0) {
      errors.price = t('wishlist.modal.pricePositive') || 'Price must be greater than 0.';
    } else if (String(price).includes('.') && String(price).split('.')[1].length > 2) {
      errors.price = t('wishlist.modal.priceDecimals') || 'Max 2 decimal places allowed.';
    }

    if (!currency || currency.trim() === '') {
      errors.currency = t('wishlist.modal.currencyRequired') || 'Currency is required.';
    }

    const y = parseInt(year, 10);
    if (isNaN(y) || y < 2000 || y > 2100) {
      errors.year = t('wishlist.modal.validYear') || 'Year must be between 2000 and 2100.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!wishDetails || String(wishDetails).trim() === '') {
      errors.wishDetails = t('wishlist.modal.details') + ' is required.';
    }
    if (link && link.trim() !== '') {
      const urlPattern = /^(https?:\/\/)/i;
      if (!urlPattern.test(link.trim())) {
        errors.link = t('wishlist.modal.invalidUrl') || 'Link must start with http:// or https://';
      }
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
    }
  };

  const handleBack = () => {
    setError('');
    setFieldErrors({});
    if (step > 1) {
      setStep(step - 1);
    }
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
      await axios.post(
        `/api/finance-management/wishlist/update-wish/${initialValues.id}/`,
        {
          price: numericPrice,
          currency,
          year: parseInt(year, 10),
          wish_details: wishDetails,
          link: link || '',
          place: place || '',
        }
      );
      setSuccess(t('wishlist.modal.updateSuccess') || 'Wish updated successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 700);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        t('wishlist.modal.saveFailed') ||
        'Failed to update wish'
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
        <button
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              {t('wishlist.modal.step', { current: step, total: 2 }) || `Step ${step} of 2`}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {step === 1 && (t('wishlist.modal.step1Title') || 'Target Cost & Year')}
              {step === 2 && (t('wishlist.modal.step2Title') || 'Details & Link')}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('wishlist.modal.editTitle') || 'Edit Wish'}
          </h2>
        </div>

        {/* Step Indicator */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-2 mb-2">
            {[1, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (s < step) setStep(s);
                  else if (s === 2 && validateStep1()) setStep(2);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-sm'
                    : s < step
                    ? 'bg-emerald-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 font-medium px-1">
            <span className={step >= 1 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>1. Cost & Year</span>
            <span className={step >= 2 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>2. Details & Review</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-5 animate-slide-in">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('wishlist.modal.currency')} *
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('wishlist.modal.price')} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setFieldErrors(prev => ({ ...prev, price: undefined }));
                  }}
                  required
                  className={`chef-input text-2xl font-bold tracking-tight pr-16 ${
                    fieldErrors.price ? 'border-rose-500 ring-2 ring-rose-200 dark:ring-rose-900/40' : ''
                  }`}
                  placeholder={t('wishlist.modal.pricePlaceholder')}
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 dark:text-gray-500 text-sm">
                  {currency || 'CUR'}
                </div>
              </div>
              {fieldErrors.price && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.price}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('wishlist.modal.year')} *
              </label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setFieldErrors(prev => ({ ...prev, year: undefined }));
                }}
                className="chef-input"
                required
              />
              {fieldErrors.year && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5">
                  ⚠️ {fieldErrors.year}
                </p>
              )}
            </div>

            {currency && (
              <div
                className={`p-4 rounded-2xl border transition-all duration-300 ${
                  isAffordable
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                  <span>{isAffordable ? '🎉' : '🎯'}</span>
                  <span>{isAffordable ? 'Goal Reachable!' : 'Savings Progress Tracker'}</span>
                </div>
                <div className="flex justify-between text-xs py-0.5">
                  <span className="opacity-80">Available Savings:</span>
                  <span className="font-bold">{totalSaved.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-xs py-0.5">
                  <span className="opacity-80">Target Cost:</span>
                  <span className="font-bold">{numericPrice.toFixed(2)} {currency}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden my-2">
                  <div
                    className={`h-full transition-all duration-500 ${isAffordable ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-[11px] font-semibold mt-1">
                  {isAffordable ? (
                    <span className="text-emerald-700 dark:text-emerald-300">
                      ✓ You have sufficient funds in your accounts to purchase this item!
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-300">
                      {progressPercent}% funded • Need {deficit.toFixed(2)} {currency} more to reach goal.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-slide-in">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('wishlist.modal.details')} *
              </label>
              <input
                type="text"
                value={wishDetails}
                onChange={(e) => {
                  setWishDetails(e.target.value);
                  setFieldErrors(prev => ({ ...prev, wishDetails: undefined }));
                }}
                className="chef-input"
                placeholder={t('wishlist.modal.detailsPlaceholder')}
                autoFocus
              />
              {fieldErrors.wishDetails && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5">
                  ⚠️ {fieldErrors.wishDetails}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('wishlist.modal.link')}
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setFieldErrors(prev => ({ ...prev, link: undefined }));
                }}
                className="chef-input"
                placeholder={t('wishlist.modal.linkPlaceholder')}
              />
              {fieldErrors.link && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5">
                  ⚠️ {fieldErrors.link}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                {t('wishlist.modal.place')}
              </label>
              <PlaceSelect
                value={place}
                onChange={setPlace}
                currency={currency}
              />
            </div>
          </div>
        )}

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

          {step < 2 ? (
            <button
              type="button"
              onClick={handleNext}
              className="chef-button py-2.5 px-6 text-sm text-white w-auto flex items-center gap-1.5 font-bold shadow-md hover:shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>{t('wishlist.modal.saving') || 'Saving...'}</span>
                </>
              ) : (
                <span>{t('wishlist.modal.save') || 'Save Wish'}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateWishModal;
