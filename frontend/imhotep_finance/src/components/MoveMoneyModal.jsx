import { useState } from 'react';
import axios from 'axios';

const MoveMoneyModal = ({ onClose, onSuccess, details }) => {
  const [step, setStep] = useState(1);
  const places = Object.keys(details || {});

  const [sourcePlace, setSourcePlace] = useState(places[0] || '');
  const [currency, setCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [targetPlace, setTargetPlace] = useState('');
  const [targetPlaceInput, setTargetPlaceInput] = useState('');
  const [isCustomTarget, setIsCustomTarget] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableCurrencies = (details[sourcePlace] || []).map(item => item.currency);
  const activeCurrency = currency || (availableCurrencies[0] || '');
  const currentSourceBalance = Number((details[sourcePlace] || []).find(item => item.currency === activeCurrency)?.amount || 0);

  const effectiveTargetPlace = isCustomTarget ? targetPlaceInput.trim() : targetPlace;
  const currentTargetBalance = Number((details[effectiveTargetPlace] || []).find(item => item.currency === activeCurrency)?.amount || 0);

  const numericAmount = parseFloat(amount) || 0;
  const remainingSourceBalance = Math.max(0, currentSourceBalance - numericAmount);
  const projectedTargetBalance = currentTargetBalance + numericAmount;
  const isInsufficient = numericAmount > currentSourceBalance;

  const validateStep1 = () => {
    setErrorMsg('');
    if (!sourcePlace) {
      setErrorMsg('Please select a source account.');
      return false;
    }
    if (!activeCurrency) {
      setErrorMsg('Please select a currency.');
      return false;
    }
    if (!amount || numericAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return false;
    }
    if (isInsufficient) {
      setErrorMsg(`Insufficient funds in ${sourcePlace}. Maximum available is ${currentSourceBalance.toFixed(2)} ${activeCurrency}.`);
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setErrorMsg('');
    if (!effectiveTargetPlace) {
      setErrorMsg('Please select or specify a destination account.');
      return false;
    }
    if (sourcePlace.toLowerCase().trim() === effectiveTargetPlace.toLowerCase().trim()) {
      setErrorMsg('Source and destination accounts must be different.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleQuickAdd = (value) => {
    const current = parseFloat(amount) || 0;
    const nextVal = Math.min(currentSourceBalance, current + value);
    setAmount(nextVal.toFixed(2));
    setErrorMsg('');
  };

  const handleMax = () => {
    setAmount(currentSourceBalance.toFixed(2));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      await axios.post('/api/finance-management/move-money/', {
        source_place: sourcePlace,
        target_place: effectiveTargetPlace,
        amount: numericAmount,
        currency: activeCurrency,
      });
      onSuccess();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'An error occurred during transfer.'
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#366c6b] dark:text-[#51adac] bg-[#366c6b]/10 dark:bg-[#51adac]/20 px-2.5 py-1 rounded-full">
              Step {step} of 3
            </span>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-chef mt-1">
              Move Money
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
          {['1. Source & Amount', '2. Destination', '3. Review'].map((label, idx) => {
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
                    ? 'bg-[#366c6b] text-white shadow'
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
          {/* STEP 1: Source Account, Currency & Amount */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                  Source Account
                </label>
                <div className="flex flex-wrap gap-2">
                  {places.map((p) => {
                    const isSelected = sourcePlace === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setSourcePlace(p);
                          setCurrency('');
                          setErrorMsg('');
                        }}
                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          isSelected
                            ? 'bg-[#366c6b] text-white border-[#366c6b] shadow-md'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#366c6b]'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {sourcePlace && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                    Currency in {sourcePlace}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableCurrencies.map((c) => {
                      const isSelected = activeCurrency === c;
                      const bal = (details[sourcePlace] || []).find(item => item.currency === c)?.amount || 0;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCurrency(c);
                            setErrorMsg('');
                          }}
                          className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            isSelected
                              ? 'bg-[#366c6b] text-white border-[#366c6b] shadow-md'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#366c6b]'
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
                    Amount
                  </label>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Available: {currentSourceBalance.toFixed(2)} {activeCurrency}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setErrorMsg('');
                    }}
                    required
                    className="w-full text-2xl font-bold px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                    {activeCurrency}
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
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#366c6b] text-white hover:bg-[#2c5857] transition"
                  >
                    MAX
                  </button>
                </div>

                {isInsufficient && (
                  <div className="mt-2 text-xs text-red-500 font-semibold">
                    ⚠️ Amount exceeds available balance by {(numericAmount - currentSourceBalance).toFixed(2)} {activeCurrency}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Target Account */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                  Destination Account
                </label>
                <div className="flex flex-wrap gap-2">
                  {places
                    .filter((p) => p !== sourcePlace)
                    .map((p) => {
                      const isSelected = !isCustomTarget && targetPlace === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setIsCustomTarget(false);
                            setTargetPlace(p);
                            setErrorMsg('');
                          }}
                          className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            isSelected
                              ? 'bg-[#366c6b] text-white border-[#366c6b] shadow-md'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#366c6b]'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTarget(true);
                      setTargetPlace('');
                      setErrorMsg('');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                      isCustomTarget
                        ? 'bg-[#366c6b] text-white border-[#366c6b] shadow-md'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#366c6b]'
                    }`}
                  >
                    + Create New Place...
                  </button>
                </div>

                {isCustomTarget && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="e.g., Savings Vault, Safe Deposit..."
                      value={targetPlaceInput}
                      onChange={(e) => {
                        setTargetPlaceInput(e.target.value);
                        setErrorMsg('');
                      }}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Projected Balance Diff */}
              {effectiveTargetPlace && (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Projected Balance Changes
                  </h4>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{sourcePlace} (Source):</span>
                    <span className="font-bold text-red-500">
                      {currentSourceBalance.toFixed(2)} → {remainingSourceBalance.toFixed(2)} {activeCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-gray-200/60 dark:border-gray-700/60 pt-2">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">{effectiveTargetPlace} (Destination):</span>
                    <span className="font-bold text-emerald-500">
                      {currentTargetBalance.toFixed(2)} → {projectedTargetBalance.toFixed(2)} {activeCurrency}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#366c6b]/5 dark:bg-[#366c6b]/10 border border-[#366c6b]/20 space-y-4">
                <div className="flex items-center justify-around py-2">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">From</span>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{sourcePlace}</p>
                  </div>
                  <svg className="w-6 h-6 text-[#366c6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">To</span>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{effectiveTargetPlace}</p>
                  </div>
                </div>

                <div className="text-center py-2 bg-white dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Amount</span>
                  <p className="text-2xl font-black text-[#366c6b] dark:text-[#51adac]">
                    {numericAmount.toFixed(2)} {activeCurrency}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-center border-t border-gray-200/50 dark:border-gray-700/50 pt-3">
                  <div>
                    <span className="text-gray-500 block">{sourcePlace} After</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {remainingSourceBalance.toFixed(2)} {activeCurrency}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{effectiveTargetPlace} After</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {projectedTargetBalance.toFixed(2)} {activeCurrency}
                    </span>
                  </div>
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
                className="flex-1 px-4 py-2.5 bg-[#366c6b] dark:bg-[#51adac] text-white rounded-xl hover:bg-[#2c5857] dark:hover:bg-[#439190] transition-colors font-semibold shadow"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-[#366c6b] dark:bg-[#51adac] text-white rounded-xl hover:bg-[#2c5857] dark:hover:bg-[#439190] transition-colors font-semibold disabled:opacity-50 shadow"
              >
                {submitting ? 'Moving Funds...' : 'Confirm Transfer'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MoveMoneyModal;
