import { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Footer from '../../components/common/Footer';
import { Link } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend);

const Reports = () => {
  const [reportType, setReportType] = useState('monthly'); // 'monthly' or 'yearly'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteCurrency, setFavoriteCurrency] = useState(localStorage.getItem('favoriteCurrency') || 'USD');

  // Fetch report data based on type
  useEffect(() => {
    const fetchData = async () => {
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
      <div className="min-h-screen flex items-center justify-center bg-chef-pattern">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#366c6b] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading {reportType} reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-chef-pattern">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link to="/dashboard" className="mt-4 inline-block chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen overflow-y-auto pb-8 bg-chef-pattern"
      style={{
        background: 'linear-gradient(135deg, #eaf6f6 0%, #d6efee 50%, #1a3535 100%)',
      }}
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl border border-white/30 bg-white/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-chef text-gray-800 mb-2">Financial Reports</h1>
              <p className="text-lg text-gray-600 font-medium leading-relaxed mb-4">
                Breakdown for {data?.current_month || 'Current Period'}
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
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              📅 Monthly Report
            </button>
            <button
              onClick={() => setReportType('yearly')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                reportType === 'yearly'
                  ? 'bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              📊 Yearly Report
            </button>
          </div>
        </div>

        {/* Totals Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="chef-card rounded-xl p-6 bg-red-50 border-l-4 border-red-500">
            <h3 className="text-xl font-semibold text-red-600 mb-4">Total Expenses</h3>
            <p className="text-3xl font-bold text-red-800">
              {data?.total_withdraw?.toFixed(2) || '0.00'} {favoriteCurrency}
            </p>
          </div>
          <div className="chef-card rounded-xl p-6 bg-green-50 border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-green-600 mb-4">Total Income</h3>
            <p className="text-3xl font-bold text-green-800">
              {data?.total_deposit?.toFixed(2) || '0.00'} {favoriteCurrency}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Chart */}
          <div className="chef-card rounded-xl p-6 shadow-lg border-l-4 border-red-500">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Expense Breakdown</h3>
            {data?.user_withdraw_on_range?.length ? (
              <div className="relative h-80">
                <Pie data={expenseChartData} options={chartOptions} />
              </div>
            ) : (
              <p className="text-gray-500 text-center">No expense data available.</p>
            )}
          </div>

          {/* Income Chart */}
          <div className="chef-card rounded-xl p-6 shadow-lg border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Income Breakdown</h3>
            {data?.user_deposit_on_range?.length ? (
              <div className="relative h-80">
                <Pie data={incomeChartData} options={chartOptions} />
              </div>
            ) : (
              <p className="text-gray-500 text-center">No income data available.</p>
            )}
          </div>
        </div>

        {/* Detailed Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Details */}
          <div className="chef-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Expense Details</h3>
            {data?.user_withdraw_on_range?.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b">
                <span>{item.category}</span>
                <span className="font-semibold">
                  {item.converted_amount.toFixed(2)} {favoriteCurrency} ({item.percentage}%)
                </span>
              </div>
            )) || <p className="text-gray-500">No details available.</p>}
          </div>

          {/* Income Details */}
          <div className="chef-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-600 mb-4">Income Details</h3>
            {data?.user_deposit_on_range?.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b">
                <span>{item.category}</span>
                <span className="font-semibold">
                  {item.converted_amount.toFixed(2)} {favoriteCurrency} ({item.percentage}%)
                </span>
              </div>
            )) || <p className="text-gray-500">No details available.</p>}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Reports;
