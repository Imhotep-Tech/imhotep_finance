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
  const [recalculateLoading, setRecalculateLoading] = useState(false);

  // Yearly reports state
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [yearlyData, setYearlyData] = useState(null);
  const [yearlyLoading, setYearlyLoading] = useState(false);

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

  // Fetch available years for yearly reports
  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        const res = await axios.get('/api/finance-management/get-report-history-years/');
        setAvailableYears(res.data.report_history_years || []);
      } catch (err) {
        console.warn('Failed to fetch available years:', err);
        // Set current year as default if no years available
        setAvailableYears([new Date().getFullYear()]);
      }
    };
    fetchAvailableYears();
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

  // Fetch yearly report data when year is selected
  useEffect(() => {
    if (selectedYear && reportType === 'yearly') {
      const fetchYearlyData = async () => {
        setYearlyLoading(true);
        try {
          const res = await axios.get(`/api/finance-management/get-yearly-report/?year=${selectedYear}`);
          setYearlyData(res.data);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to load yearly report');
          setYearlyData(null);
        }
        setYearlyLoading(false);
      };
      fetchYearlyData();
    }
  }, [selectedYear, reportType]);

  // Fetch report data based on type
  useEffect(() => {
    const fetchData = async () => {
      if (reportType === 'historical' || reportType === 'yearly') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const endpoint = '/api/finance-management/get-monthly-report/';
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
    } else if (reportType === 'yearly') {
      return yearlyData;
    }
    return data;
  };

  const getCurrentLoading = () => {
    if (reportType === 'historical') {
      return historicalLoading;
    } else if (reportType === 'yearly') {
      return yearlyLoading;
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

  // Recalculate all reports
  const handleRecalculateReports = async () => {
    if (!window.confirm('This will recalculate all monthly reports from your first to last transaction. This may take a moment. Continue?')) {
      return;
    }
    
    setRecalculateLoading(true);
    try {
      const response = await axios.post('/api/finance-management/recalculate-reports/');
      
      // Show success message with details
      const summary = response.data.summary;
      let message = `Reports recalculated successfully!\n\n`;
      message += `📊 Total months processed: ${summary.total_months_processed}\n`;
      message += `✨ New reports created: ${summary.months_created}\n`;
      message += `🔄 Reports updated: ${summary.months_updated}\n`;
      
      if (summary.errors_count > 0) {
        message += `⚠️ Errors encountered: ${summary.errors_count}\n`;
      }
      
      message += `\n📅 Date range: ${summary.date_range.from} to ${summary.date_range.to}`;
      
      alert(message);
      
      // Refresh historical months after recalculation
      try {
        const res = await axios.get('/api/finance-management/get-report-history-months/');
        setHistoricalMonths(res.data.report_history_months || []);
      } catch (err) {
        console.warn('Failed to refresh historical months:', err);
      }
      
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn('Recalculation errors:', response.data.errors);
      }
      
    } catch (err) {
      console.error('Recalculate failed:', err);
      alert(`Failed to recalculate reports: ${err.response?.data?.error || err.message}`);
    }
    setRecalculateLoading(false);
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
    <div className="min-h-screen overflow-y-auto pb-8 bg-[var(--bg)] text-[var(--text)] transition-colors relative">
      {/* ...existing decorative elements... */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-6">
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
              
              {/* Mobile-first button layout */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  className={`chef-button px-4 sm:px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base ${
                    recalculateLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#8b5a3c] to-[#6b4423] text-white'
                  }`}
                  onClick={handleRecalculateReports}
                  disabled={recalculateLoading}
                >
                  {recalculateLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                      <span className="hidden sm:inline">Recalculating...</span>
                      <span className="sm:hidden">Loading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="hidden sm:inline">Recalculate Reports</span>
                      <span className="sm:hidden">Recalculate</span>
                    </>
                  )}
                </button>
                
                <Link
                  to="/dashboard"
                  className="chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white px-4 sm:px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-center text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </div>
            </div>

            {/* Report Type Toggle - Mobile responsive */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button
                onClick={() => setReportType('monthly')}
                className={`flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                  reportType === 'monthly'
                    ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="hidden sm:inline">📅 Current Monthly</span>
                <span className="sm:hidden">📅 Monthly</span>
              </button>
              
              <button
                onClick={() => setReportType('yearly')}
                className={`flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                  reportType === 'yearly'
                    ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="hidden sm:inline">📊 Current Yearly</span>
                <span className="sm:hidden">📊 Yearly</span>
              </button>
              
              <button
                onClick={() => setReportType('historical')}
                className={`flex-1 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                  reportType === 'historical'
                    ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="hidden sm:inline">📈 Historical</span>
                <span className="sm:hidden">📈 History</span>
              </button>
            </div>

            {/* Yearly Year Selector */}
            {reportType === 'yearly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#366c6b] focus:border-transparent text-gray-900 dark:text-gray-100"
                >
                  {availableYears.map((year, index) => (
                    <option key={index} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Historical Month Selector */}
            {reportType === 'historical' && (
              <div>
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
        ) : reportType === 'yearly' && !selectedYear ? (
          <div className="chef-card rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-[#eaf6f6] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#366c6b]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V8h14v11zm0-13H5V5h14v1z"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Select a Year</h2>
            <p className="text-gray-600 dark:text-gray-300">Choose a year from the dropdown above to view yearly reports.</p>
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
                {reportType === 'yearly' && getDisplayData()?.months_included && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Based on {getDisplayData().months_included} months of data
                  </p>
                )}
              </div>
              <div className="chef-card rounded-xl p-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">Total Income</h3>
                <p className="text-3xl font-bold text-green-800 dark:text-green-300">
                  {getDisplayData()?.total_deposit?.toFixed(2) || '0.00'} {favoriteCurrency}
                </p>
                {reportType === 'yearly' && getDisplayData()?.months_included && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    Based on {getDisplayData().months_included} months of data
                  </p>
                )}
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
