import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import Footer from '../../components/common/Footer';
import Logo from '../../assets/Logo.jpeg';
import AddTransactionModal from '../../components/AddTransactionModal';
import NetWorthCard from '../../components/NetWorthCard';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [networth, setNetworth] = useState('0');
  const [favoriteCurrency, setFavoriteCurrency] = useState('');
  const [score, setScore] = useState(null);
  const [scoreTxt, setScoreTxt] = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialType, setInitialType] = useState('deposit'); // new state
  const navigate = useNavigate();

  // Fetch networth data
  useEffect(() => {
    const fetchNetworth = async () => {
      try {
        const response = await axios.get('/api/finance-management/get-networth/');
        setNetworth(response.data.networth || '0');
        if (response.data.favorite_currency) {
          setFavoriteCurrency(response.data.favorite_currency);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setNetworth('0');
        } else {
          console.warn('Networth fetch error:', err);
          setNetworth('0');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchNetworth();
  }, []);

  // Fetch favorite currency data
  useEffect(() => {
    const fetchFavoriteCurrency = async () => {
      try {
        const response = await axios.get('/api/get-fav-currency/');
        setFavoriteCurrency(response.data.favorite_currency || 'USD');
      } catch (err) {
        if (err.response?.status === 404) {
          setFavoriteCurrency('USD');
        } else {
          console.warn('Favorite currency fetch error:', err);
          setFavoriteCurrency('USD');
        }
      }
    };
    fetchFavoriteCurrency();
  }, []);

  // Fetch target score data
  useEffect(() => {
    const fetchTargetScore = async () => {
      try {
        const response = await axios.get('/api/finance-management/target/get-score/');
        if (response.data.score_txt) {
          setScore(response.data.score);
          setScoreTxt(response.data.score_txt);
          setTarget(response.data.target);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setScore(null);
          setScoreTxt('');
          setTarget('');
        } else {
          console.warn('Target score fetch error:', err);
          setScore(null);
          setScoreTxt('');
          setTarget('');
        }
      }
    };
    fetchTargetScore();
  }, []);

  // Update last login timestamp when dashboard loads
  useEffect(() => {
    const updateLastLogin = async () => {
      try {
        await axios.post('/api/update-last-login/');
      } catch (err) {
        console.warn('Failed to update last login:', err);
      }
    };
    updateLastLogin();
  }, []);

  // Call backend apply-scheduled-trans once per day (uses localStorage to avoid repeated calls)
  useEffect(() => {
    const runApplyIfNeeded = async () => {
        try {
          const key = 'lastApplyScheduledDate';
          const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          const last = localStorage.getItem(key);
          if (last === today) return;

          await axios.post('/api/finance-management/scheduled-trans/apply-scheduled-trans/');

          // mark as done for today
          localStorage.setItem(key, today);
        } catch (err) {
          console.warn('apply_scheduled_trans failed', err);
        }
      };
      runApplyIfNeeded();
  }, []);

  // UI helpers
  const scoreClass = score > 0
    ? 'score-positive'
    : score < 0
      ? 'score-negative'
      : 'score-neutral';

  return (
    <div
      className="min-h-screen overflow-y-auto pb-8 bg-[var(--bg)] text-[var(--text)] transition-colors relative"
    >
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full filter blur-xl opacity-20 animate-float bg-[#366c6b] mix-blend-multiply dark:bg-emerald-600/40 dark:mix-blend-screen"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full filter blur-xl opacity-18 animate-float bg-[rgba(26,53,53,0.9)] dark:bg-teal-800/40" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full filter blur-xl opacity-16 animate-float bg-[#2f7775] dark:bg-cyan-700/30 dark:mix-blend-screen" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="inline-flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#366c6b] to-[#244746] rounded-full shadow-lg border-4 border-white flex items-center justify-center mr-4">
                <img src={Logo} alt="Logo" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <div className="font-extrabold text-2xl sm:text-3xl bg-clip-text text-transparent font-chef tracking-wide"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #366c6b 0%, #1a3535 100%)',
                    letterSpacing: '0.04em',
                    lineHeight: '1.1',
                  }}>
                  Imhotep Finance
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your finances efficiently</p>
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-2">
            Welcome, {user?.first_name || user?.username}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
            Here's your financial overview
          </p>
        </div>

        {/* Net Worth Section */}
        <div onClick={() => navigate('/show_networth_details')} style={{ cursor: 'pointer' }}>
          <NetWorthCard
            networth={networth}
            favoriteCurrency={favoriteCurrency}
            loading={loading}
            mode="dashboard"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            className="rounded-xl p-6 metric-card hover:shadow-lg transition-all duration-300 group flex items-center space-x-4 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            onClick={() => {
              setInitialType('deposit');
              setShowAddModal(true);
            }}
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-700 transition-colors">
              <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Add Income</h3>
              <p className="text-gray-600 dark:text-gray-300">Record your earnings and financial growth</p>
            </div>
          </button>
          <button
          className="rounded-xl p-6 metric-card hover:shadow-lg transition-all duration-300 group flex items-center space-x-4 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          onClick={() => {
            setInitialType('withdraw');
            setShowAddModal(true);
          }}
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-700 transition-colors">
            {/* Minus sign */}
            <svg className="w-8 h-8 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24">
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Add Expense</h3>
            <p className="text-gray-600 dark:text-gray-300">Track your spending and manage budget</p>
          </div>
        </button>
        </div>

        {/* Monthly Target Score Section */}
        {scoreTxt && (
          <div className={`${scoreClass} rounded-2xl p-8 text-white shadow-lg`}
            style={{
              background: score > 0
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : score < 0
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            }}>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  {score > 0 ? (
                    <path d="M12 17l-5 3 1.9-6.1L3 9.2l6.2-.5L12 3l2.8 5.7 6.2.5-5.9 4.7L17 20z"/>
                  ) : score < 0 ? (
                    <path d="M3 17h18v2H3zm9-14l-7 7h4v6h6v-6h4z"/>
                  ) : (
                    <circle cx="12" cy="12" r="10"/>
                  )}
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Monthly Target Status</h2>
              <p className="text-lg text-white/90 mb-4">{scoreTxt}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-white/80 text-sm">Target Amount</p>
                  <p className="text-2xl font-bold">{target} {favoriteCurrency}</p>
                </div>
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-white/80 text-sm">Current Score</p>
                  <p className="text-2xl font-bold">{score > 0 ? '+' : ''}{score?.toFixed(0)} {favoriteCurrency}</p>
                </div>
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-white/80 text-sm">Status</p>
                  <p className="text-xl font-bold">
                    {score > 0 ? 'Above Target' : score < 0 ? 'Below Target' : 'On Target'}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <a href="/show-target-history" className="inline-flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 backdrop-blur-sm">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                  View Target History
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="/show_trans" className="metric-card rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v7H3zM7 9h2v11H7zM11 5h2v15h-2zM15 11h2v9h-2zM19 7h2v13h-2z"/></svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Transactions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">View All</p>
            </div>
          </a>
          <a href="/show_scheduled_trans" className="metric-card rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-300" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V8h14v11zm0-13H5V5h14v1z"/></svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Scheduled</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Recurring</p>
            </div>
          </a>
          <a href="/show_networth_details" className="metric-card rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l1.5 4.5h4.5l-3.75 2.75L15 14l-3-2.25L9 14l1.75-4.75L7 6.5h4.5z"/></svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Net Worth</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Details</p>
            </div>
          </a>
          <a href="/reports" className="metric-card rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Monthly & Yearly</p>
            </div>
          </a>
          <a href="/profile"  className="metric-card rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Manage Target</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Goals</p>
            </div>
          </a>
        </div>

        {/* Getting Started Section (if no target set) */}
        {!scoreTxt && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#eaf6f6] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#366c6b]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l1.5 4.5h4.5l-3.75 2.75L15 14l-3-2.25L9 14l1.75-4.75L7 6.5h4.5z"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started with Your Financial Journey</h2>
              <p className="text-gray-600 mb-6">Start tracking your finances by adding your first transaction or setting a monthly target.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <button onClick={() => setShowAddModal(true)} className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <svg className="w-6 h-6 text-green-600 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="font-medium text-green-700">Add Income</span>
                </button>
                <button onClick={() => setShowAddModal(true)} className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                  <svg className="w-6 h-6 text-red-600 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="font-medium text-red-700">Add Expense</span>
                </button>
                <a href="/profile" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <svg className="w-6 h-6 text-purple-600 mb-2" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
                  <span className="font-medium text-purple-700">Set Target</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal
          initialType={initialType}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            // Optionally, refetch dashboard data
            window.location.reload();
          }}
        />
      )}

      <Footer />
    </div>
  );
};

export default Dashboard;