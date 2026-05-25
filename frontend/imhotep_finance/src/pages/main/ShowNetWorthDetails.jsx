import { useEffect, useState } from 'react';
import axios from 'axios';
import Footer from '../../components/common/Footer';

const ShowNetWorthDetails = () => {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/finance-management/get-networth-details/')
      .then(res => {
        let data = res.data.networth_details;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          // data is a dict of { "PlaceName": [{ currency: "USD", amount: 100 }] }
          setDetails(data);
        } else {
          setDetails({});
        }
        setLoading(false);
      })
      .catch(() => {
        setDetails([]);
        setLoading(false);
      });
  }, []);

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
        <div className="chef-card rounded-3xl p-6 shadow-2xl backdrop-blur-2xl mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-2 text-center">
            Net Worth Details
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm">Breakdown by currency & place</p>
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
                      className="rounded-2xl p-6 shadow-md bg-gradient-to-br from-[#51adac] to-[#428a89] text-white flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300"
                    >
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
      <Footer />
    </div>
  );
};

export default ShowNetWorthDetails;
