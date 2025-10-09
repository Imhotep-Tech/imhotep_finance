import { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2'; // For pie charts
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Footer from '../../components/common/Footer';
import { Link } from 'react-router-dom';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const MonthlyReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteCurrency, setFavoriteCurrency] = useState(localStorage.getItem('favoriteCurrency') || 'USD');

  // Fetch monthly report data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Call the monthly report endpoint directly (no date parameters needed)
        const res = await axios.get('/api/finance-management/get-monthly-report/');
        setData(res.data);

        // Update favorite currency from API if available and different
        if (res.data.favorite_currency && res.data.favorite_currency !== favoriteCurrency) {
          setFavoriteCurrency(res.data.favorite_currency);
          localStorage.setItem('favoriteCurrency', res.data.favorite_currency);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load monthly reports');
      }
      setLoading(false);
    };

    // If no favorite currency in localStorage, fetch it separately
    if (!localStorage.getItem('favoriteCurrency')) {
      axios.get('/api/get-fav-currency/')
        .then(res => {
          const currency = res.data.favorite_currency || 'USD';
          setFavoriteCurrency(currency);
          localStorage.setItem('favoriteCurrency', currency);
        })
        .catch(err => console.warn('Failed to fetch favorite currency:', err));
    }

    fetchData();
  }, [favoriteCurrency]);

  // Prepare chart data for expenses
  const expenseChartData = {
    labels: data?.user_withdraw_on_range?.map(item => item.category) || [],
    datasets: [
      {
        data: data?.user_withdraw_on_range?.map(item => item.converted_amount) || [],
        backgroundColor: data?.user_withdraw_on_range?.map((_, index) => `hsl(${0 + (index * 15)}, 70%, 50%)`) || [],
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for income
  const incomeChartData = {
    labels: data?.user_deposit_on_range?.map(item => item.category) || [],
    datasets: [
      {
        data: data?.user_deposit_on_range?.map(item => item.converted_amount) || [],
        backgroundColor: data?.user_deposit_on_range?.map((_, index) => `hsl(${120 + (index * 15)}, 70%, 50%)`) || [],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed.toFixed(2)} ${favoriteCurrency}` } },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)] transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#366c6b] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading monthly reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)] transition-colors">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Link to="/dashboard" className="mt-4 inline-block chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen overflow-y-auto pb-8 bg-[var(--bg)] text-[var(--text)] transition-colors relative"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full filter blur-xl opacity-20 animate-float bg-[#366c6b] mix-blend-multiply dark:bg-emerald-600/40 dark:mix-blend-screen"></div>
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full filter blur-xl opacity-18 animate-float bg-[rgba(26,53,53,0.9)] dark:bg-teal-800/40" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-40 w-40 h-40 rounded-full filter blur-xl opacity-16 animate-float bg-[#2f7775] dark:bg-cyan-700/30 dark:mix-blend-screen" style={{animationDelay: '4s'}}></div>
      </div>
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-2">Monthly Reports</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-4">
                Breakdown for {data?.current_month || 'Current Month'}
              </p>
            </div>
            <Link
              to="/dashboard"
              className="chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Totals Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="chef-card rounded-xl p-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
            <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Total Expenses</h3>
            <p className="text-3xl font-bold text-red-800 dark:text-red-300">
              {data?.total_withdraw?.toFixed(2) || '0.00'} {favoriteCurrency} 
            </p>
          </div>
          <div className="chef-card rounded-xl p-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">Total Income</h3>
            <p className="text-3xl font-bold text-green-800 dark:text-green-300">
              {data?.total_deposit?.toFixed(2) || '0.00'} {favoriteCurrency}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Chart */}
          <div className="chef-card rounded-xl p-6 shadow-lg border-l-4 border-red-500">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Expense Breakdown</h3>
            {data?.user_withdraw_on_range?.length ? (
              <div className="relative h-80">
                <Pie data={expenseChartData} options={chartOptions} />
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">No expense data available.</p>
            )}
          </div>

          {/* Income Chart */}
          <div className="chef-card rounded-xl p-6 shadow-lg border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Income Breakdown</h3>
            {data?.user_deposit_on_range?.length ? (
              <div className="relative h-80">
                <Pie data={incomeChartData} options={chartOptions} />
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">No income data available.</p>
            )}
          </div>
        </div>

        {/* Detailed Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Details */}
          <div className="chef-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Expense Details</h3>
            {data?.user_withdraw_on_range?.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b border-[var(--border)]">
                <span>{item.category}</span>
                <span className="font-semibold">
                  {item.converted_amount.toFixed(2)} {favoriteCurrency} ({item.percentage}%)
                </span>
              </div>
            )) || <p className="text-gray-500 dark:text-gray-400">No details available.</p>}
          </div>

          {/* Income Details */}
          <div className="chef-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4">Income Details</h3>
            {data?.user_deposit_on_range?.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b border-[var(--border)]">
                <span>{item.category}</span>
                <span className="font-semibold">
                  {item.converted_amount.toFixed(2)} {favoriteCurrency} ({item.percentage}%)
                </span>
              </div>
            )) || <p className="text-gray-500 dark:text-gray-400">No details available.</p>}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MonthlyReports;
