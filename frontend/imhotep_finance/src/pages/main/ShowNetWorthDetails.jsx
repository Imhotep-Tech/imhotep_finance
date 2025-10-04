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
        // Normalize: if dict, convert to array of {currency, amount}
        if (Array.isArray(data)) {
          setDetails(data);
        } else if (data && typeof data === 'object') {
          setDetails(
            Object.entries(data).map(([currency, amount]) => ({
              currency,
              amount
            }))
          );
        } else {
          setDetails([]);
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
      className="min-h-screen bg-chef-pattern"
      style={{
        background: 'linear-gradient(135deg, #eaf6f6 0%, #d6efee 50%, #1a3535 100%)',
      }}
    >
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="chef-card rounded-3xl p-6 shadow-2xl backdrop-blur-2xl border border-white/30 bg-white/90 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-chef text-gray-800 mb-2 text-center">
            Net Worth Details
          </h1>
          <p className="text-gray-500 text-center text-sm">Breakdown by currency</p>
        </div>
        {loading ? (
          <div className="text-center text-lg text-gray-600">Loading...</div>
        ) : details.length === 0 ? (
          <div className="text-center text-lg text-gray-600">No net worth details found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {details.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-6 shadow-lg bg-gradient-to-br from-[#51adac] to-[#428a89] text-white flex flex-col items-center justify-center"
              >
                <div className="text-lg font-semibold mb-2">{item.currency}</div>
                <div className="text-3xl font-bold mb-1">
                  {Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-white/80 text-sm">Total Amount</div>
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
