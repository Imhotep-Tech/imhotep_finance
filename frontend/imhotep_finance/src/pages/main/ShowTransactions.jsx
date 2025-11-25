import { useState, useEffect } from 'react';
import axios from 'axios';
import Footer from '../../components/common/Footer';
import Pagination from '../../components/common/Pagination';
import AddTransactionModal from '../../components/AddTransactionModal';
import ImportTransactionsModal from '../../components/ImportTransactionsModal';
import CategorySelect from '../../components/CategorySelect';

const ShowTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, transaction: null });
  const [recalculateNetworthLoading, setRecalculateNetworthLoading] = useState(false);
  
  // New filter states
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailsSearch, setDetailsSearch] = useState('');

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (categoryFilter) params.category = categoryFilter;
        if (statusFilter) params.trans_status = statusFilter;
        if (detailsSearch) params.details_search = detailsSearch;
        params.page = page;
        
        const res = await axios.get('/api/finance-management/transaction/get-transactions/', { params });
        setTransactions(res.data.transactions || []);
        setPagination(res.data.pagination || {});
        setDateRange(res.data.date_range || {});
      } catch (err) {
        setError('Failed to fetch transactions');
        setTransactions([]);
        setPagination({});
      }
      setLoading(false);
    };
    fetchTransactions();
  }, [startDate, endDate, page, showAddModal, showImportModal, editModal.open, categoryFilter, statusFilter, detailsSearch]);

  const handleDateChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleClearFilters = () => {
    setCategoryFilter('');
    setStatusFilter('');
    setDetailsSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Export transactions as CSV
  const handleExportCSV = async () => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await axios.get('/api/finance-management/transaction/export-csv/', {
        params,
        responseType: 'blob', // Important for file download
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response header (backend sets this)
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'transactions.csv'; // fallback filename
      
      if (contentDisposition) {
        // Try different patterns to extract filename
        let filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (!filenameMatch) {
          filenameMatch = contentDisposition.match(/filename=([^;]+)/);
        }
        if (filenameMatch) {
          filename = filenameMatch[1].trim();
        }
      } else {
        // Create filename based on date range if header is not available
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        if (startDate && endDate) {
          filename = `transactions_${startDate}_to_${endDate}.csv`;
        } else if (startDate) {
          filename = `transactions_${startDate}_to_${dateStr}.csv`;
        } else if (endDate) {
          filename = `transactions_${dateStr}_to_${endDate}.csv`;
        } else {
          filename = `transactions_${dateStr}.csv`;
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export transactions. Please try again.');
    }
  };

  // Edit transaction
  const handleEdit = (tx) => {
    setEditModal({ open: true, transaction: tx });
  };

  // Delete transaction
  const handleDelete = async (tx) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await axios.delete(`/api/finance-management/transaction/delete-transactions/${tx.id}/`);
      setTransactions(transactions.filter(t => t.id !== tx.id));
    } catch (err) {
      alert('Failed to delete transaction');
    }
  };

  // Recalculate networth
  const handleRecalculateNetworth = async () => {
    if (!window.confirm('This will recalculate your networth from all transactions. This may take a moment. Continue?')) {
      return;
    }
    
    setRecalculateNetworthLoading(true);
    try {
      const response = await axios.post('/api/finance-management/recalculate-networth/');
      
      // Show success message with details
      const details = response.data.details;
      let message = `Networth recalculated successfully!\n\n`;
      message += `💰 Currencies processed: ${details.currencies_processed}\n`;
      message += `📊 Networth records created: ${details.networth_records_created}\n`;
      message += `💵 Updated total networth: ${response.data.updated_networth}\n\n`;
      
      if (details.currency_breakdown && Object.keys(details.currency_breakdown).length > 0) {
        message += `Currency breakdown:\n`;
        for (const [currency, amount] of Object.entries(details.currency_breakdown)) {
          message += `• ${currency}: ${amount.toFixed(2)}\n`;
        }
      }
      
      alert(message);
      
    } catch (err) {
      console.error('Recalculate networth failed:', err);
      alert(`Failed to recalculate networth: ${err.response?.data?.error || err.message}`);
    }
    setRecalculateNetworthLoading(false);
  };

  // Helper for type badge
  const TypeBadge = ({ type }) => (
    type === 'deposit' || type === 'Deposit' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 ring-1 ring-inset ring-green-300 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-700">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Income
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 ring-1 ring-inset ring-red-300 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-700">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Expense
      </span>
    )
  );

  // Helper for category tag
  const CategoryTag = ({ type, category }) => {
    if (!category) return <span className="text-gray-400 italic text-xs">No category</span>;
    return (
      <span className={`category-tag inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
        ${type === 'deposit' || type === 'Deposit'
          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'}`}>
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {category}
      </span>
    );
  };

  // Helper for amount
  const AmountCell = ({ type, amount, currency }) => (
    <span className={`font-semibold ${type === 'deposit' || type === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
      {type === 'deposit' || type === 'Deposit' ? '+' : '-'}
      {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
    </span>
  );

  // Prepare props for edit modal
  const getEditModalProps = (tx) => ({
    initialType: tx.trans_status.toLowerCase(),
    initialValues: {
      amount: tx.amount,
      currency: tx.currency,
      category: tx.category,
      desc: tx.trans_details,
      date: tx.date,
      id: tx.id,
    },
    onClose: () => setEditModal({ open: false, transaction: null }),
    onSuccess: () => setEditModal({ open: false, transaction: null }),
    editMode: true,
  });

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
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-2">Transactions</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-4">
                  View and filter your transaction history
                </p>
              </div>
            </div>
            
            {/* Mobile-first button layout - Updated with Import button */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <button
                className="chef-button bg-gradient-to-r from-[#4a7c7a] to-[#366c6b] text-white px-4 sm:px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                onClick={handleExportCSV}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>

              <button
                className="chef-button bg-gradient-to-r from-[#5a6c7a] to-[#3a4c5a] text-white px-4 sm:px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                onClick={() => setShowImportModal(true)}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </button>
              
              <button
                className={`chef-button px-4 sm:px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base ${
                  recalculateNetworthLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#7c6a4a] to-[#5d4e37] text-white'
                }`}
                onClick={handleRecalculateNetworth}
                disabled={recalculateNetworthLoading}
              >
                {recalculateNetworthLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    <span className="hidden sm:inline">Recalculating...</span>
                    <span className="sm:hidden">Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="hidden sm:inline">Recalculate Networth</span>
                    <span className="sm:hidden">Recalculate</span>
                  </>
                )}
              </button>
              
              <button
                className="chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white px-4 sm:px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                onClick={() => setShowAddModal(true)}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5v14m7-7H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="hidden sm:inline">Add Transaction</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
          
          {/* Filters Section - Mobile First */}
          <div className="space-y-4 mt-6">
            {/* Date Range Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={handleDateChange(setStartDate)}
                  className="chef-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={handleDateChange(setEndDate)}
                  className="chef-input w-full"
                />
              </div>
            </div>

            {/* Transaction Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Transaction Type</label>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value)}
                className="chef-input w-full"
              >
                <option value="">All Types</option>
                <option value="deposit">Income</option>
                <option value="withdraw">Expense</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Category</label>
              <CategorySelect
                value={categoryFilter}
                onChange={handleFilterChange(setCategoryFilter)}
                status={statusFilter || 'ANY'}
              />
            </div>

            {/* Details Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Search Description</label>
              <input
                type="text"
                value={detailsSearch}
                onChange={(e) => handleFilterChange(setDetailsSearch)(e.target.value)}
                className="chef-input w-full"
                placeholder="Search in descriptions..."
              />
            </div>

            {/* Clear Filters Button */}
            {(categoryFilter || statusFilter || detailsSearch || startDate || endDate) && (
              <div className="flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="chef-button-secondary px-4 py-2 rounded-xl text-sm dark:text-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Filters
                </button>
              </div>
            )}

            {/* Date Range Display */}
            {dateRange.start_date && dateRange.end_date && (
              <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-medium">Showing: </span>
                <span className="font-semibold">{dateRange.start_date}</span>
                <span className="mx-2">to</span>
                <span className="font-semibold">{dateRange.end_date}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">Loading transactions...</div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400 py-8">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">No transactions found.</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Date</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Type</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Currency</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Category</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Description</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 hover:dark:bg-gray-800/60 transaction-row">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {tx.date}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <TypeBadge type={tx.trans_status} />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <AmountCell type={tx.trans_status} amount={tx.amount} currency={tx.currency} />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium">
                          {tx.currency}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <CategoryTag type={tx.trans_status} category={tx.category} />
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-300 max-w-xs">
                          <div className="truncate">
                            {tx.trans_details ? tx.trans_details : <span className="text-gray-400 dark:text-gray-500 italic">No description</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              className="chef-button-secondary px-2 py-1 text-xs dark:text-gray-100 dark:bg-gray-800"
                              onClick={() => handleEdit(tx)}
                            >
                              Edit
                            </button>
                            <button
                              className="chef-button-secondary px-2 py-1 text-xs text-red-600 dark:text-gray-100 dark:bg-gray-800"
                              onClick={() => handleDelete(tx)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    className={`transaction-card border rounded-xl p-4 ${tx.trans_status === 'deposit' || tx.trans_status === 'Deposit'
                      ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center
                          ${tx.trans_status === 'deposit' || tx.trans_status === 'Deposit'
                            ? 'bg-green-100 dark:bg-green-800'
                            : 'bg-red-100 dark:bg-red-800'
                          }`}>
                          {tx.trans_status === 'deposit' || tx.trans_status === 'Deposit' ? (
                            <svg className="w-5 h-5 text-green-600 dark:text-green-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-600 dark:text-red-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </div>
                        <span className={`font-medium ${tx.trans_status === 'deposit' || tx.trans_status === 'Deposit' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                          {tx.trans_status === 'deposit' || tx.trans_status === 'Deposit' ? 'Income' : 'Expense'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${tx.trans_status === 'deposit' || tx.trans_status === 'Deposit' ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
                          {tx.trans_status === 'deposit' || tx.trans_status === 'Deposit' ? '+' : '-'}
                          {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{tx.date}</div>
                      </div>
                    </div>
                    {/* Category Section */}
                    <div className="mb-2">
                      <CategoryTag type={tx.trans_status} category={tx.category} />
                    </div>
                    {/* Description Section */}
                    {tx.trans_details && (
                      <div className="mb-2">
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{tx.trans_details}</p>
                      </div>
                    )}
                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                      <button
                        className="chef-button-secondary px-2 py-1 text-xs dark:text-gray-100 dark:bg-gray-800"
                        onClick={() => handleEdit(tx)}
                      >
                        Edit
                      </button>
                      <button
                        className="chef-button-secondary px-2 py-1 text-xs text-red-600 dark:text-gray-100 dark:bg-gray-800"
                        onClick={() => handleDelete(tx)}
                      >
                        Delete
                      </button>
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
      
      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal
          initialType="deposit"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}
      
      {/* Import Transactions Modal */}
      {showImportModal && (
        <ImportTransactionsModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => setShowImportModal(false)}
        />
      )}
      
      {/* Edit Transaction Modal */}
      {editModal.open && (
        <AddTransactionModal
          {...getEditModalProps(editModal.transaction)}
        />
      )}
      <Footer />
    </div>
  );
};

export default ShowTransactions;
