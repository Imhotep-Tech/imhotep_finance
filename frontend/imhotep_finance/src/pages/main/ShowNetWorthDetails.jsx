import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../../components/common/Footer';
import { currencies as allCurrencies } from '../../utils/currencies';

const ShowNetWorthDetails = () => {
  const navigate = useNavigate();
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);

  // Move Money Modal states
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [sourcePlace, setSourcePlace] = useState('');
  const [targetPlace, setTargetPlace] = useState('');
  const [targetPlaceInput, setTargetPlaceInput] = useState('');
  const [isCustomTarget, setIsCustomTarget] = useState(false);
  const [currency, setCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Convert Currency Modal states
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertPlace, setConvertPlace] = useState('');
  const [sourceCurrency, setSourceCurrency] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('');
  const [convertAmount, setConvertAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [convertErrorMsg, setConvertErrorMsg] = useState('');
  const [convertSubmitting, setConvertSubmitting] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(null);

  const fetchDetails = () => {
    axios.get('/api/finance-management/get-networth-details/')
      .then(res => {
        let data = res.data.networth_details;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setDetails(data);
        } else {
          setDetails({});
        }
        setLoading(false);
      })
      .catch(() => {
        setDetails({});
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDetails();
    axios.get('/api/finance-management/get-exchange-rates/')
      .then(res => setExchangeRates(res.data))
      .catch(() => console.error("Failed to load exchange rates"));
  }, []);

  const handleMoveSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const finalTarget = isCustomTarget ? targetPlaceInput.trim() : targetPlace;
    if (!sourcePlace || !currency || !finalTarget || !amount) {
      setErrorMsg('All fields are required.');
      return;
    }
    
    if (sourcePlace.toLowerCase().trim() === finalTarget.toLowerCase().trim()) {
      setErrorMsg('Source and target places must be different.');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Amount must be greater than zero.');
      return;
    }
    
    const maxAvailable = (details[sourcePlace] || []).find(item => item.currency === currency)?.amount || 0;
    if (parsedAmount > maxAvailable) {
      setErrorMsg(`Insufficient funds in ${sourcePlace}. Maximum available is ${maxAvailable} ${currency}.`);
      return;
    }
    
    setSubmitting(true);
    axios.post('/api/finance-management/move-money/', {
      source_place: sourcePlace,
      target_place: finalTarget,
      amount: parsedAmount,
      currency
    })
      .then(() => {
        setShowMoveModal(false);
        fetchDetails();
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.error || err.response?.data?.detail || 'An error occurred during transfer.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const updateDefaultRate = (src, tgt) => {
    if (src && tgt && exchangeRates) {
      const srcRate = exchangeRates[src];
      const tgtRate = exchangeRates[tgt];
      if (srcRate && tgtRate) {
        const rate = (tgtRate / srcRate).toFixed(6);
        setExchangeRate(rate);
        const parsedAmount = parseFloat(convertAmount);
        if (!isNaN(parsedAmount)) {
          setTargetAmount((parsedAmount * parseFloat(rate)).toFixed(2));
        }
        return;
      }
    }
    setExchangeRate('');
    setTargetAmount('');
  };

  const handleConvertAmountChange = (val) => {
    setConvertAmount(val);
    const parsedVal = parseFloat(val);
    const parsedRate = parseFloat(exchangeRate);
    if (!isNaN(parsedVal) && !isNaN(parsedRate) && parsedRate > 0) {
      setTargetAmount((parsedVal * parsedRate).toFixed(2));
    } else {
      setTargetAmount('');
    }
  };

  const handleExchangeRateChange = (val) => {
    setExchangeRate(val);
    const parsedAmount = parseFloat(convertAmount);
    const parsedRate = parseFloat(val);
    if (!isNaN(parsedAmount) && !isNaN(parsedRate) && parsedRate > 0) {
      setTargetAmount((parsedAmount * parsedRate).toFixed(2));
    }
  };

  const handleTargetAmountChange = (val) => {
    setTargetAmount(val);
    const parsedTarget = parseFloat(val);
    const parsedAmount = parseFloat(convertAmount);
    if (!isNaN(parsedTarget) && !isNaN(parsedAmount) && parsedAmount > 0) {
      setExchangeRate((parsedTarget / parsedAmount).toFixed(6));
    }
  };

  const handleConvertSubmit = (e) => {
    e.preventDefault();
    setConvertErrorMsg('');
    
    if (!convertPlace || !sourceCurrency || !targetCurrency || !convertAmount || !targetAmount) {
      setConvertErrorMsg('All fields are required.');
      return;
    }
    
    if (sourceCurrency === targetCurrency) {
      setConvertErrorMsg('Source and target currencies must be different.');
      return;
    }
    
    const parsedAmount = parseFloat(convertAmount);
    const parsedTargetAmount = parseFloat(targetAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) {
      setConvertErrorMsg('Amounts must be greater than zero.');
      return;
    }
    
    const maxAvailable = (details[convertPlace] || []).find(item => item.currency === sourceCurrency)?.amount || 0;
    if (parsedAmount > maxAvailable) {
      setConvertErrorMsg(`Insufficient funds. Maximum available is ${maxAvailable} ${sourceCurrency}.`);
      return;
    }
    
    setConvertSubmitting(true);
    axios.post('/api/finance-management/convert-currency/', {
      place: convertPlace,
      source_currency: sourceCurrency,
      target_currency: targetCurrency,
      amount: parsedAmount,
      target_amount: parsedTargetAmount
    })
      .then(() => {
        setShowConvertModal(false);
        fetchDetails();
      })
      .catch((err) => {
        setConvertErrorMsg(err.response?.data?.error || err.response?.data?.detail || 'An error occurred during conversion.');
      })
      .finally(() => {
        setConvertSubmitting(false);
      });
  };

  const handleDeleteNetWorth = (place, currency) => {
    if (window.confirm(`Are you sure you want to delete the ${currency} net worth record at ${place}?`)) {
      axios.delete('/api/finance-management/delete-networth/', {
        data: { place, currency }
      })
        .then(() => {
          fetchDetails();
        })
        .catch((err) => {
          alert(err.response?.data?.error || err.response?.data?.detail || 'An error occurred while deleting the net worth record.');
        });
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors relative"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full filter blur-xl opacity-20 animate-float bg-[#366c6b] mix-blend-multiply dark:bg-emerald-600/40 dark:mix-blend-screen"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full filter blur-xl opacity-18 animate-float bg-[rgba(26,53,53,0.9)] dark:bg-teal-800/40" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full filter blur-xl opacity-16 animate-float bg-[#2f7775] dark:bg-cyan-700/30 dark:mix-blend-screen" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="chef-card rounded-3xl p-6 shadow-2xl backdrop-blur-2xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-2">
              Net Worth Details
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Breakdown by currency & place</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setConvertPlace('');
                setSourceCurrency('');
                setTargetCurrency('');
                setConvertAmount('');
                setTargetAmount('');
                setExchangeRate('');
                setConvertErrorMsg('');
                setShowConvertModal(true);
              }}
              className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg transition-all hover:scale-105 duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Convert Currencies
            </button>
            <button
              onClick={() => {
              setSourcePlace('');
              setTargetPlace('');
              setTargetPlaceInput('');
              setIsCustomTarget(false);
              setCurrency('');
              setAmount('');
              setErrorMsg('');
              setShowMoveModal(true);
            }}
            className="flex items-center px-5 py-2.5 bg-[#366c6b] hover:bg-[#2f5c5b] dark:bg-[#51adac] dark:hover:bg-[#428f8d] text-white font-semibold rounded-2xl shadow-lg transition-all hover:scale-105 duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Move Money
          </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-lg text-gray-600 dark:text-gray-400">Loading...</div>
        ) : Object.keys(details).length === 0 ? (
          <div className="text-center text-lg text-gray-600 dark:text-gray-400">No net worth details found.</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(details).map(([place, currencies], idx) => (
              <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-[#366c6b] dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {place}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {currencies.map((item, cIdx) => (
                    <div
                      key={cIdx}
                      onClick={() => navigate(`/show_trans?place=${encodeURIComponent(place)}`)}
                      style={{ cursor: 'pointer' }}
                      className="relative rounded-2xl p-6 shadow-md bg-gradient-to-br from-[#51adac] to-[#428a89] text-white flex flex-col items-center justify-center hover:scale-[1.03] transition-transform duration-300"
                    >
                      {Number(item.amount || 0) === 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNetWorth(place, item.currency);
                          }}
                          className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-red-600 text-white rounded-full transition-colors duration-200 flex items-center justify-center"
                          title="Delete Net Worth"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <div className="text-lg font-semibold mb-2 bg-black/10 px-4 py-1 rounded-full">{item.currency}</div>
                      <div className="text-3xl font-bold mb-1">
                        {Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-white/80 text-sm">Total Amount</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Move Money Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 font-chef">Move Money</h3>
              <button
                onClick={() => setShowMoveModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleMoveSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-xl">
                  {errorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Source Place</label>
                <select
                  value={sourcePlace}
                  onChange={(e) => {
                    setSourcePlace(e.target.value);
                    setCurrency('');
                    setAmount('');
                  }}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                >
                  <option value="">Select source place...</option>
                  {Object.keys(details).map((place) => (
                    <option key={place} value={place}>{place}</option>
                  ))}
                </select>
              </div>

              {sourcePlace && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value);
                      setAmount('');
                    }}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                  >
                    <option value="">Select currency...</option>
                    {(details[sourcePlace] || []).map((item) => (
                      <option key={item.currency} value={item.currency}>{item.currency}</option>
                    ))}
                  </select>
                  {currency && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Available balance: {Number((details[sourcePlace] || []).find(item => item.currency === currency)?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Place</label>
                <div className="space-y-2">
                  <select
                    value={isCustomTarget ? "CUSTOM" : targetPlace}
                    onChange={(e) => {
                      if (e.target.value === "CUSTOM") {
                        setIsCustomTarget(true);
                        setTargetPlace('');
                      } else {
                        setIsCustomTarget(false);
                        setTargetPlace(e.target.value);
                      }
                    }}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                  >
                    <option value="">Select target place...</option>
                    {Object.keys(details)
                      .filter(place => place !== sourcePlace)
                      .map((place) => (
                        <option key={place} value={place}>{place}</option>
                      ))}
                    <option value="CUSTOM">+ Create New Place...</option>
                  </select>
                  
                  {isCustomTarget && (
                    <input
                      type="text"
                      placeholder="Enter new place name..."
                      value={targetPlaceInput}
                      onChange={(e) => setTargetPlaceInput(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-[#366c6b] dark:bg-[#51adac] text-white rounded-xl hover:bg-[#2c5857] dark:hover:bg-[#439190] transition-colors font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Moving...' : 'Move'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Currency Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 font-chef">Convert Currency</h3>
              <button
                onClick={() => setShowConvertModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleConvertSubmit} className="p-6 space-y-4">
              {convertErrorMsg && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-xl">
                  {convertErrorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Place</label>
                <select
                  value={convertPlace}
                  onChange={(e) => {
                    setConvertPlace(e.target.value);
                    setSourceCurrency('');
                    setTargetCurrency('');
                    setExchangeRate('');
                    setTargetAmount('');
                  }}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                >
                  <option value="">Select place...</option>
                  {Object.keys(details).map((place) => (
                    <option key={place} value={place}>{place}</option>
                  ))}
                </select>
              </div>

              {convertPlace && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Current Currency</label>
                    <select
                      value={sourceCurrency}
                      onChange={(e) => {
                        setSourceCurrency(e.target.value);
                        updateDefaultRate(e.target.value, targetCurrency);
                      }}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                    >
                      <option value="">From...</option>
                      {(details[convertPlace] || []).map((item) => (
                        <option key={item.currency} value={item.currency}>{item.currency}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Currency</label>
                    <select
                      value={targetCurrency}
                      onChange={(e) => {
                        setTargetCurrency(e.target.value);
                        updateDefaultRate(sourceCurrency, e.target.value);
                      }}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                    >
                      <option value="">To...</option>
                      {allCurrencies.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              {sourceCurrency && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Available balance: {Number((details[convertPlace] || []).find(item => item.currency === sourceCurrency)?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sourceCurrency}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Rate</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={exchangeRate}
                  onChange={(e) => handleExchangeRateChange(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Amount ({sourceCurrency || '...'})</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={convertAmount}
                    onChange={(e) => handleConvertAmountChange(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Amount ({targetCurrency || '...'})</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => handleTargetAmountChange(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[#366c6b] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convertSubmitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold disabled:opacity-50"
                >
                  {convertSubmitting ? 'Converting...' : 'Convert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />

    </div>
  );
};

export default ShowNetWorthDetails;
