import { useState } from 'react';
import axios from 'axios';

const ConvertCurrencyModal = ({
  onClose,
  onSuccess,
  details,
  allCurrencies,
  exchangeRates,
}) => {
  const [step, setStep] = useState(1);
  const places = Object.keys(details || {});

  const [place, setPlace] = useState(places[0] || '');
  const [sourceCurrency, setSourceCurrency] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('');
  const [convertAmount, setConvertAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const placeCurrencies = (details[place] || []).map(item => item.currency);
  const activeSourceCurrency = sourceCurrency || (placeCurrencies[0] || '');
  const currentAvailable = Number((details[place] || []).find(item => item.currency === activeSourceCurrency)?.amount || 0);

  const numericAmount = parseFloat(convertAmount) || 0;
  const isInsufficient = numericAmount > currentAvailable;

  const updateDefaultRate = (src, tgt, currentAmt = convertAmount) => {
    if (src && tgt && exchangeRates) {
      const srcRate = exchangeRates[src];
      const tgtRate = exchangeRates[tgt];
      if (srcRate && tgtRate) {
        const rate = (tgtRate / srcRate).toFixed(6);
        setExchangeRate(rate);
        const parsed = parseFloat(currentAmt);
        if (!isNaN(parsed) && parsed > 0) {
          setTargetAmount((parsed * parseFloat(rate)).toFixed(2));
        }
        return;
      }
    }
  };

  const handleAmountChange = (val) => {
    setConvertAmount(val);
    setErrorMsg('');
    const parsed = parseFloat(val);
    const rate = parseFloat(exchangeRate);
    if (!isNaN(parsed) && !isNaN(rate) && rate > 0) {
      setTargetAmount((parsed * rate).toFixed(2));
    }
  };

  const handleRateChange = (val) => {
    setExchangeRate(val);
    setErrorMsg('');
    const parsedAmt = parseFloat(convertAmount);
    const parsedRate = parseFloat(val);
    if (!isNaN(parsedAmt) && !isNaN(parsedRate) && parsedRate > 0) {
      setTargetAmount((parsedAmt * parsedRate).toFixed(2));
    }
  };

  const handleTargetAmountChange = (val) => {
    setTargetAmount(val);
    setErrorMsg('');
    const parsedTarget = parseFloat(val);
    const parsedAmt = parseFloat(convertAmount);
    if (!isNaN(parsedTarget) && !isNaN(parsedAmt) && parsedAmt > 0) {
      setExchangeRate((parsedTarget / parsedAmt).toFixed(6));
    }
  };

  const handleQuickAdd = (value) => {
    const current = parseFloat(convertAmount) || 0;
    const nextVal = Math.min(currentAvailable, current + value);
    handleAmountChange(nextVal.toFixed(2));
  };

  const handleMax = () => {
    handleAmountChange(currentAvailable.toFixed(2));
  };

  const validateStep1 = () => {
    setErrorMsg('');
    if (!place) {
      setErrorMsg('Please select an account place.');
      return false;
    }
    if (!activeSourceCurrency) {
      setErrorMsg('Please select a source currency.');
      return false;
    }
    if (!convertAmount || numericAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return false;
    }
    if (isInsufficient) {
      setErrorMsg(`Insufficient funds. Maximum available is ${currentAvailable.toFixed(2)} ${activeSourceCurrency}.`);
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setErrorMsg('');
    if (!targetCurrency) {
      setErrorMsg('Please select a target currency.');
      return false;
    }
    if (targetCurrency === activeSourceCurrency) {
      setErrorMsg('Source and target currencies must be different.');
      return false;
    }
    const rate = parseFloat(exchangeRate);
    if (!exchangeRate || isNaN(rate) || rate <= 0) {
      setErrorMsg('Please enter a valid exchange rate.');
      return false;
    }
    const tgtAmt = parseFloat(targetAmount);
    if (!targetAmount || isNaN(tgtAmt) || tgtAmt <= 0) {
      setErrorMsg('Please enter a valid target amount.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      if (!targetCurrency) {
        const fallbackTarget = allCurrencies.find(c => c !== activeSourceCurrency) || '';
        if (fallbackTarget) {
          setTargetCurrency(fallbackTarget);
          updateDefaultRate(activeSourceCurrency, fallbackTarget);
        }
      }
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      await axios.post('/api/finance-management/convert-currency/', {
        place,
        source_currency: activeSourceCurrency,
        target_currency: targetCurrency,
        amount: numericAmount,
        target_amount: parseFloat(targetAmount),
      });
      onSuccess();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'An error occurred during currency conversion.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full">
              Step {step} of 3
            </span>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-chef mt-1">
              Convert Currency
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-6 pt-4 flex gap-2">
          {['1. Account & Amount', '2. Target & Rate', '3. Review'].map((label, idx) => {
            const s = idx + 1;
            const isActive = s === step;
            const isDone = s < step;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (s < step) setStep(s);
                  else if (s === 2 && validateStep1()) setStep(2);
                  else if (s === 3 && validateStep1() && validateStep2()) setStep(3);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 text-sm text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-800 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* STEP 1: Place, Source Currency & Amount */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                  Account Place
                </label>
                <div className="flex flex-wrap gap-2">
                  {places.map((p) => {
                    const isSelected = place === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPlace(p);
                          setSourceCurrency('');
                          setErrorMsg('');
                        }}
                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-500'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {place && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                    Currency to Convert
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {placeCurrencies.map((c) => {
                      const isSelected = activeSourceCurrency === c;
                      const bal = (details[place] || []).find(item => item.currency === c)?.amount || 0;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSourceCurrency(c);
                            updateDefaultRate(c, targetCurrency);
                            setErrorMsg('');
                          }}
                          className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-500'
                          }`}
                        >
                          {c} ({bal.toFixed(2)})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Amount to Convert
                  </label>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    Available: {currentAvailable.toFixed(2)} {activeSourceCurrency}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={convertAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    required
                    className="w-full text-2xl font-bold px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    {activeSourceCurrency}
                  </span>
                </div>

                {/* Quick Chips */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {[50, 100, 500, 1000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAdd(val)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                      +{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleMax}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    MAX
                  </button>
                </div>

                {isInsufficient && (
                  <div className="mt-2 text-xs text-red-500 font-semibold">
                    ⚠️ Amount exceeds available balance by {(numericAmount - currentAvailable).toFixed(2)} {activeSourceCurrency}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Target Currency & Exchange Rate */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                  Target Currency
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {allCurrencies
                    .filter((c) => c !== activeSourceCurrency)
                    .map((c) => {
                      const isSelected = targetCurrency === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setTargetCurrency(c);
                            updateDefaultRate(activeSourceCurrency, c);
                            setErrorMsg('');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-500'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                    Exchange Rate
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="1.000000"
                    value={exchangeRate}
                    onChange={(e) => handleRateChange(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    1 {activeSourceCurrency} = ? {targetCurrency}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => handleTargetAmountChange(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Receiving in {targetCurrency}
                  </span>
                </div>
              </div>

              {/* Live Calculator Box */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/60">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[11px] font-bold uppercase text-blue-700 dark:text-blue-300">
                    Live Conversion Calculator
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {numericAmount.toFixed(2)} {activeSourceCurrency} × {parseFloat(exchangeRate || 0).toFixed(4)} ={' '}
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {parseFloat(targetAmount || 0).toFixed(2)} {targetCurrency}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/60 space-y-4">
                <div className="text-center font-bold text-sm text-gray-600 dark:text-gray-300">
                  Account: <span className="text-gray-900 dark:text-gray-100">{place}</span>
                </div>

                <div className="flex items-center justify-around py-3 bg-white dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Converting</span>
                    <p className="text-lg font-black text-red-500">
                      -{numericAmount.toFixed(2)} {activeSourceCurrency}
                    </p>
                  </div>
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Receiving</span>
                    <p className="text-lg font-black text-emerald-500">
                      +{parseFloat(targetAmount).toFixed(2)} {targetCurrency}
                    </p>
                  </div>
                </div>

                <div className="text-center text-xs text-gray-500 border-t border-gray-200/50 dark:border-gray-700/50 pt-3">
                  Applied Rate: <span className="font-bold text-gray-700 dark:text-gray-300">1 {activeSourceCurrency} = {parseFloat(exchangeRate).toFixed(4)} {targetCurrency}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold shadow"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold disabled:opacity-50 shadow"
              >
                {submitting ? 'Converting...' : 'Confirm Conversion'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConvertCurrencyModal;
