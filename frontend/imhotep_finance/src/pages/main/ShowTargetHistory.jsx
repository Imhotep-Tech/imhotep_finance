import { useState, useEffect } from 'react';
import axios from 'axios';
import Footer from '../../components/common/Footer';
import Pagination from '../../components/common/Pagination';
import { Link } from 'react-router-dom';

const ShowTargetHistory = () => {
  const [targets, setTargets] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  // Fetch target history
  useEffect(() => {
    const fetchTargetHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { page };
        const res = await axios.get('/api/finance-management/target/get-score-history/', { params });
        setTargets(res.data.targets || []);
        setPagination(res.data.pagination || {});
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Failed to fetch target history'
        );
        setTargets([]);
        setPagination({});
      }
      setLoading(false);
    };
    fetchTargetHistory();
  }, [page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Helper for status badge
  const StatusBadge = ({ score }) => {
    if (score > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17l-5 3 1.9-6.1L3 9.2l6.2-.5L12 3l2.8 5.7 6.2.5-5.9 4.7L17 20z"/>
          </svg>
          Above Target
        </span>
      );
    } else if (score < 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 17h18v2H3zm9-14l-7 7h4v6h6v-6h4z"/>
          </svg>
          Below Target
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
          </svg>
          On Target
        </span>
      );
    }
  };

  // Helper for score display
  const ScoreCell = ({ score }) => (
    <span className={`font-semibold ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
      {score > 0 ? '+' : ''}{Number(score).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );

  return (
    <div
      className="min-h-screen overflow-y-auto pb-8 bg-[var(--bg)] text-[var(--text)] transition-colors relative"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full filter blur-xl opacity-20 animate-float bg-[#366c6b] mix-blend-multiply dark:bg-emerald-600/40 dark:mix-blend-screen"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full filter blur-xl opacity-18 animate-float bg-[rgba(26,53,53,0.9)] dark:bg-teal-800/40" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full filter blur-xl opacity-16 animate-float bg-[#2f7775] dark:bg-cyan-700/30 dark:mix-blend-screen" style={{animationDelay: '4s'}}></div>
      </div>
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-2">Target History</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-4">
                View your monthly target performance over time
              </p>
            </div>
            <Link
              to="/dashboard"
              className="chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading target history...</div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400 py-8">{error}</div>
          ) : targets.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">No target history found.</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Month/Year</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Target</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Score</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.map(target => (
                      <tr key={target.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 hover:dark:bg-gray-800/60">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100 font-medium">
                          {target.month}/{target.year}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {Number(target.target).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <ScoreCell score={target.score} />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <StatusBadge score={target.score} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {targets.map(target => (
                  <div
                    key={target.id}
                    className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-900/60 hover:bg-gray-100 hover:dark:bg-gray-800 transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {target.month}/{target.year}
                      </div>
                      <StatusBadge score={target.score} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Target</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {Number(target.target).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
                        <ScoreCell score={target.score} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* New Pagination Component */}
          <Pagination
            currentPage={page}
            totalPages={pagination.num_pages || 1}
            onPageChange={handlePageChange}
            showInfo={true}
            totalItems={pagination.total_count}
            itemsPerPage={pagination.per_page || 10}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ShowTargetHistory;
