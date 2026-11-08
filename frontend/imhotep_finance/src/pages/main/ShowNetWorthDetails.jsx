import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../../components/common/Footer';
import { currencies as allCurrencies } from '../../utils/currencies';
import MoveMoneyModal from '../../components/MoveMoneyModal';
import ConvertCurrencyModal from '../../components/ConvertCurrencyModal';

const ShowNetWorthDetails = () => {
  const navigate = useNavigate();
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('place'); // 'place' or 'currency'

  const getCurrencyGroupedDetails = () => {
    const currencyGroups = {};
    Object.entries(details).forEach(([place, currencies]) => {
      currencies.forEach((item) => {
        const cur = item.currency;
        const amt = Number(item.amount || 0);
        if (!currencyGroups[cur]) {
          currencyGroups[cur] = {
            total: 0,
            places: []
          };
        }
        currencyGroups[cur].total += amt;
        currencyGroups[cur].places.push({
          place,
          amount: amt
        });
      });
    });

    Object.keys(currencyGroups).forEach((cur) => {
      const group = currencyGroups[cur];
      group.places = group.places.map((p) => {
        const pct = group.total > 0 ? (p.amount / group.total) * 100 : 0;
        return {
          ...p,
          percentage: pct
        };
      });
      group.places.sort((a, b) => b.amount - a.amount);
    });

    return Object.entries(currencyGroups);
  };

  // Modal states
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
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
              onClick={() => setShowConvertModal(true)}
              className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg transition-all hover:scale-105 duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Convert Currencies
            </button>
            <button
              onClick={() => setShowMoveModal(true)}
              className="flex items-center px-5 py-2.5 bg-[#366c6b] hover:bg-[#2f5c5b] dark:bg-[#51adac] dark:hover:bg-[#428f8d] text-white font-semibold rounded-2xl shadow-lg transition-all hover:scale-105 duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Move Money
            </button>
          </div>
      </div>

        {/* Toggle View Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800/60 p-1.5 rounded-2xl max-w-xs sm:max-w-sm mx-auto mb-6 border border-gray-250/20 dark:border-gray-850">
          <button
            onClick={() => setViewType('place')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              viewType === 'place'
                ? 'bg-white dark:bg-gray-800 text-[#366c6b] dark:text-teal-400 shadow-md scale-[1.02]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            By Place
          </button>
          <button
            onClick={() => setViewType('currency')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              viewType === 'currency'
                ? 'bg-white dark:bg-gray-800 text-[#366c6b] dark:text-teal-400 shadow-md scale-[1.02]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            By Currency
          </button>
        </div>

        {loading ? (
          <div className="text-center text-lg text-gray-600 dark:text-gray-400">Loading...</div>
        ) : Object.keys(details).length === 0 ? (
          <div className="text-center text-lg text-gray-600 dark:text-gray-400">No net worth details found.</div>
        ) : viewType === 'place' ? (
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
        ) : (
          <div className="space-y-8">
            {getCurrencyGroupedDetails().map(([currency, data], idx) => (
              <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-2xl font-bold font-chef text-gray-800 dark:text-gray-100 flex items-center">
                    <span className="bg-[#366c6b] text-white px-3 py-1 rounded-xl text-lg mr-2 font-sans">{currency}</span>
                    Total Allocation
                  </h2>
                  <span className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">
                    {data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="space-y-5">
                  {data.places.map((p, pIdx) => (
                    <div 
                      key={pIdx} 
                      className="space-y-2 cursor-pointer group"
                      onClick={() => navigate(`/show_trans?place=${encodeURIComponent(p.place)}`)}
                    >
                      <div className="flex justify-between text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                        <span className="group-hover:text-[#366c6b] dark:group-hover:text-teal-400 transition-colors flex items-center">
                          <svg className="w-4 h-4 mr-1.5 text-gray-400 group-hover:text-[#366c6b] dark:group-hover:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {p.place}
                        </span>
                        <span className="font-mono">
                          {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            {p.percentage.toFixed(1)}%
                          </span>
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-[#51adac] to-[#428a89] h-full rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${p.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Move Money Interactive Modal */}
      {showMoveModal && (
        <MoveMoneyModal
          onClose={() => setShowMoveModal(false)}
          onSuccess={() => {
            setShowMoveModal(false);
            fetchDetails();
          }}
          details={details}
        />
      )}

      {/* Convert Currency Interactive Modal */}
      {showConvertModal && (
        <ConvertCurrencyModal
          onClose={() => setShowConvertModal(false)}
          onSuccess={() => {
            setShowConvertModal(false);
            fetchDetails();
          }}
          details={details}
          allCurrencies={allCurrencies}
          exchangeRates={exchangeRates}
        />
      )}

      <Footer />

    </div>
  );
};

export default ShowNetWorthDetails;
