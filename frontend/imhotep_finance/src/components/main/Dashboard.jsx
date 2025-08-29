import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import Footer from '../common/Footer';
import Logo from '../../assets/Logo.jpeg';
import AddTransactionModal from './components/AddTransactionModal';
import NetWorthCard from './components/NetWorthCard';
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

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [networthRes, favRes] = await Promise.all([
          axios.get('/api/finance-management/get-networth/'),
          axios.get('/api/get-fav-currency/')
        ]);
        setNetworth(networthRes.data.networth || '0');
        setFavoriteCurrency(networthRes.data.favorite_currency || favRes.data.favorite_currency || '');

        // Monthly target score
        if (networthRes.data.score_txt) {
          setScore(networthRes.data.score);
          setScoreTxt(networthRes.data.score_txt);
          setTarget(networthRes.data.target);
        } else {
          setScore(null);
          setScoreTxt('');
          setTarget('');
        }
      } catch (err) {
        setNetworth('0');
        setFavoriteCurrency('');
        setScore(null);
        setScoreTxt('');
        setTarget('');
      }
      setLoading(false);
    };
    fetchData();
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
      className="min-h-screen overflow-y-auto pb-8 bg-chef-pattern"
      style={{
        background: 'linear-gradient(135deg, #eaf6f6 0%, #d6efee 50%, #1a3535 100%)',
      }}
    >
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ backgroundColor: '#366c6b' }}></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full mix-blend-multiply filter blur-xl opacity-18 animate-float" style={{ backgroundColor: 'rgba(26,53,53,0.9)', animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full mix-blend-multiply filter blur-xl opacity-16 animate-float" style={{ backgroundColor: '#2f7775', animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl border border-white/30 bg-white/90">
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
                <p className="text-gray-500 text-sm">Manage your finances efficiently</p>
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-chef text-gray-800 mb-2">
            Welcome, {user?.first_name || user?.username}!
          </h1>
          <p className="text-lg text-gray-600 font-medium leading-relaxed">
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
            className="rounded-xl p-6 metric-card hover:shadow-lg transition-all duration-300 group flex items-center space-x-4 w-full"
            onClick={() => {
              setInitialType('deposit');
              setShowAddModal(true);
            }}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Add Income</h3>
              <p className="text-gray-600">Record your earnings and financial growth</p>
            </div>
          </button>
          <button
            className="rounded-xl p-6 metric-card hover:shadow-lg transition-all duration-300 group flex items-center space-x-4 w-full"
            onClick={() => {
              setInitialType('withdraw');
              setShowAddModal(true);
            }}
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Add Expense</h3>
              <p className="text-gray-600">Track your spending and manage budget</p>
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
                  <p className="text-2xl font-bold">{score > 0 ? '+' : ''}{score?.toFixed(2)} {favoriteCurrency}</p>
                </div>
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-white/80 text-sm">Status</p>
                  <p className="text-xl font-bold">
                    {score > 0 ? 'Above Target' : score < 0 ? 'Below Target' : 'On Target'}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <a href="/show_scores_history" className="inline-flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 backdrop-blur-sm">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                  View Target History
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="/show_trans" className="metric-card rounded-xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v7H3zM7 9h2v11H7zM11 5h2v15h-2zM15 11h2v9h-2zM19 7h2v13h-2z"/></svg>
              </div>
              <h3 className="font-semibold text-gray-900">Transactions</h3>
              <p className="text-sm text-gray-600 mt-1">View All</p>
            </div>
          </a>
          <a href="/show_scheduled_trans" className="metric-card rounded-xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V8h14v11zm0-13H5V5h14v1z"/></svg>
              </div>
              <h3 className="font-semibold text-gray-900">Scheduled</h3>
              <p className="text-sm text-gray-600 mt-1">Recurring</p>
            </div>
          </a>
          <a href="/show_networth_details" className="metric-card rounded-xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-14c3.314 0 6 2.686 6 6s-2.686 6-6 6-6-2.686-6-6 2.686-6 6-6z"/></svg>
              </div>
              <h3 className="font-semibold text-gray-900">Net Worth</h3>
              <p className="text-sm text-gray-600 mt-1">Details</p>
            </div>
          </a>
          <a href="/settings/set_target" className="metric-card rounded-xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.93V17h-2v-.07A8.001 8.001 0 014.07 13H7v-2H4.07A8.001 8.001 0 0111 4.07V7h2V4.07A8.001 8.001 0 0119.93 11H17v2h2.93A8.001 8.001 0 0113 19.93z"/></svg>
              </div>
              <h3 className="font-semibold text-gray-900">Set Target</h3>
              <p className="text-sm text-gray-600 mt-1">Goals</p>
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
                <a href="/settings/set_target" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
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