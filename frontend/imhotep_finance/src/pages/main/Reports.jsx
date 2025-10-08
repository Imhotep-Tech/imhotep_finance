import { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Footer from '../../components/common/Footer';
import { Link } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend);

const Reports = () => {
  const [reportType, setReportType] = useState('monthly'); // 'monthly', 'yearly', or 'historical'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteCurrency, setFavoriteCurrency] = useState(localStorage.getItem('favoriteCurrency') || 'USD');
  
  // Historical reports state
  const [historicalMonths, setHistoricalMonths] = useState([]);
  const [selectedHistoricalMonth, setSelectedHistoricalMonth] = useState('');
  const [historicalData, setHistoricalData] = useState(null);
  const [historicalLoading, setHistoricalLoading] = useState(false);

  // Fetch available historical months
  useEffect(() => {
    const fetchHistoricalMonths = async () => {
      try {
        const res = await axios.get('/api/finance-management/get-report-history-months/');
        setHistoricalMonths(res.data.report_history_months || []);
      } catch (err) {
        console.warn('Failed to fetch historical months:', err);
      }
    };
    fetchHistoricalMonths();
  }, []);

  // Fetch historical report data when month is selected
  useEffect(() => {
    if (selectedHistoricalMonth && reportType === 'historical') {
      const fetchHistoricalData = async () => {
        setHistoricalLoading(true);
        try {
          const [month, year] = selectedHistoricalMonth.split('-');
          const res = await axios.get(`/api/finance-management/get-monthly-report-history/?month=${month}&year=${year}`);
          setHistoricalData(res.data.report_data);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to load historical report');
          setHistoricalData(null);
        }
        setHistoricalLoading(false);
      };
      fetchHistoricalData();
    }
  }, [selectedHistoricalMonth, reportType]);

  // Fetch report data based on type
  useEffect(() => {
    const fetchData = async () => {
      if (reportType === 'historical') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const endpoint = reportType === 'monthly' 
          ? '/api/finance-management/get-monthly-report/' 
          : '/api/finance-management/get-yearly-report/';
        const res = await axios.get(endpoint);
        setData(res.data);

        if (res.data.favorite_currency && res.data.favorite_currency !== favoriteCurrency) {
          setFavoriteCurrency(res.data.favorite_currency);
          localStorage.setItem('favoriteCurrency', res.data.favorite_currency);
        }
      } catch (err) {
        setError(err.response?.data?.error || `Failed to load ${reportType} reports`);
      }
      setLoading(false);
    };

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
  }, [reportType, favoriteCurrency]);

  const getDisplayData = () => {
    if (reportType === 'historical') {
      return historicalData;
    }
    return data;
  };

  const getCurrentLoading = () => {
    if (reportType === 'historical') {
      return historicalLoading;
    }
    return loading;
  };

  const formatMonthYear = (month, year) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[month - 1]} ${year}`;
  };

  const expenseChartData = {
    labels: getDisplayData()?.user_withdraw_on_range?.map(item => item.category) || [],
    datasets: [
      {
        data: getDisplayData()?.user_withdraw_on_range?.map(item => item.converted_amount) || [],
        backgroundColor: getDisplayData()?.user_withdraw_on_range?.map((_, index) => `hsl(${0 + (index * 15)}, 70%, 50%)`) || [],
        borderWidth: 1,
      },
    ],
  };

  const incomeChartData = {
    labels: getDisplayData()?.user_deposit_on_range?.map(item => item.category) || [],
    datasets: [
      {
        data: getDisplayData()?.user_deposit_on_range?.map(item => item.converted_amount) || [],
        backgroundColor: getDisplayData()?.user_deposit_on_range?.map((_, index) => `hsl(${120 + (index * 15)}, 70%, 50%)`) || [],
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

  if (getCurrentLoading()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)] transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#366c6b] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading {reportType} reports...</p>
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
      {/* ...existing decorative elements... */}
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
              <h1 className="text-3xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-2">Financial Reports</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-4">
                {reportType === 'historical' && selectedHistoricalMonth 
                  ? `Breakdown for ${formatMonthYear(...selectedHistoricalMonth.split('-').map(Number))}`
                  : `Breakdown for ${getDisplayData()?.current_month || 'Current Period'}`
                }
              </p>
            </div>
            <Link
              to="/dashboard"
              className="chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Report Type Toggle */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setReportType('monthly')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                reportType === 'monthly'
                  ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              📅 Current Monthly
            </button>
            <button
              onClick={() => setReportType('yearly')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                reportType === 'yearly'
                  ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              📊 Current Yearly
            </button>
            <button
              onClick={() => setReportType('historical')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                reportType === 'historical'
                  ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              📈 Historical
            </button>
          </div>

          {/* Historical Month Selector */}
          {reportType === 'historical' && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Month & Year
              </label>
              <select
                value={selectedHistoricalMonth}
                onChange={(e) => setSelectedHistoricalMonth(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#366c6b] focus:border-transparent text-gray-900 dark:text-gray-100"
              >
                <option value="">Select a month...</option>
                {historicalMonths.map((item, index) => (
                  <option key={index} value={`${item.month}-${item.year}`}>
                    {formatMonthYear(item.month, item.year)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content based on report type */}
        {reportType === 'historical' && !selectedHistoricalMonth ? (
          <div className="chef-card rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-[#eaf6f6] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#366c6b]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V8h14v11zm0-13H5V5h14v1z"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Select a Historical Period</h2>
            <p className="text-gray-600 dark:text-gray-300">Choose a month and year from the dropdown above to view historical reports.</p>
          </div>
        ) : (
          <>
            {/* Totals Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="chef-card rounded-xl p-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Total Expenses</h3>
                <p className="text-3xl font-bold text-red-800 dark:text-red-300">
                  {getDisplayData()?.total_withdraw?.toFixed(2) || '0.00'} {favoriteCurrency}
                </p>
              </div>
              <div className="chef-card rounded-xl p-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">Total Income</h3>
                <p className="text-3xl font-bold text-green-800 dark:text-green-300">
                  {getDisplayData()?.total_deposit?.toFixed(2) || '0.00'} {favoriteCurrency}
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Expense Chart */}
              <div className="chef-card rounded-xl p-6 shadow-lg border-l-4 border-red-500">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Expense Breakdown</h3>
                {getDisplayData()?.user_withdraw_on_range?.length ? (
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
                {getDisplayData()?.user_deposit_on_range?.length ? (
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
                {getDisplayData()?.user_withdraw_on_range?.map((item, index) => (
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
                {getDisplayData()?.user_deposit_on_range?.map((item, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-[var(--border)]">
                    <span>{item.category}</span>
                    <span className="font-semibold">
                      {item.converted_amount.toFixed(2)} {favoriteCurrency} ({item.percentage}%)
                    </span>
                  </div>
                )) || <p className="text-gray-500 dark:text-gray-400">No details available.</p>}
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Reports;
