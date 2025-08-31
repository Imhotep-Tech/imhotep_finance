import { useState, useEffect } from 'react';
import axios from 'axios';
import Footer from '../common/Footer';
import AddScheduledTransactionModal from './components/AddScheduledTransactionModal';

const ShowScheduledTransactions = () => {
  const [scheduledTrans, setScheduledTrans] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, transaction: null });
  const [statusLoading, setStatusLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState({});
  const [refetchFlag, setRefetchFlag] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const fetchScheduledTrans = async () => {
      setLoading(true);
      setError('');
      setActionError('');
      try {
        const params = { page };
        const res = await axios.get('/api/finance-management/scheduled-trans/get-scheduled-trans/', { params });
        setScheduledTrans(res.data.scheduled_transactions || []);
        setPagination(res.data.pagination || {});
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Failed to fetch scheduled transactions'
        );
        setScheduledTrans([]);
        setPagination({});
      }
      setLoading(false);
    };
    fetchScheduledTrans();
  }, [page, showAddModal, editModal.open, refetchFlag]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleEdit = (tx) => {
    setEditModal({ open: true, transaction: tx });
  };

  const handleDelete = async (tx) => {
    setActionError('');
    if (!window.confirm('Are you sure you want to delete this scheduled transaction?')) return;
    setDeleteLoading(prev => ({ ...prev, [tx.id]: true }));
    try {
      await axios.delete(`/api/finance-management/scheduled-trans/delete-scheduled-trans/${tx.id}/`);
      setScheduledTrans(scheduledTrans.filter(t => t.id !== tx.id));
    } catch (err) {
      if (err.response?.status === 404) {
        setActionError('Scheduled transaction not found (may already be deleted).');
      } else {
        setActionError(
          err.response?.data?.error ||
          'Failed to delete scheduled transaction'
        );
      }
    }
    setDeleteLoading(prev => ({ ...prev, [tx.id]: false }));
  };

  const handleStatusToggle = async (tx) => {
    setActionError('');
    setStatusLoading(prev => ({ ...prev, [tx.id]: true }));
    try {
      await axios.post(`/api/finance-management/scheduled-trans/update-scheduled-trans-status/${tx.id}/`);
      setRefetchFlag(flag => !flag);
    } catch (err) {
      setActionError(
        err.response?.data?.error ||
        'Failed to update scheduled transaction status'
      );
    }
    setStatusLoading(prev => ({ ...prev, [tx.id]: false }));
  };

  const TypeBadge = ({ type }) => (
    type === 'deposit' || type === 'Deposit' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Income
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Expense
      </span>
    )
  );

  const CategoryTag = ({ type, category }) => {
    if (!category) return <span className="text-gray-400 italic text-xs">No category</span>;
    return (
      <span className={`category-tag inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
        ${type === 'deposit' || type === 'Deposit'
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200'}`}>
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {category}
      </span>
    );
  };

  const AmountCell = ({ type, amount, currency }) => (
    <span className={`font-semibold ${type === 'deposit' || type === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
      {type === 'deposit' || type === 'Deposit' ? '+' : '-'}
      {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
    </span>
  );

  const getEditModalProps = (tx) => ({
    initialType: tx.scheduled_trans_status.toLowerCase(),
    initialValues: {
      day_of_month: tx.day_of_month,
      amount: tx.amount,
      currency: tx.currency,
      category: tx.category,
      scheduled_trans_details: tx.scheduled_trans_details,
      status: tx.status,
      id: tx.id,
    },
    onClose: () => setEditModal({ open: false, transaction: null }),
    onSuccess: () => setEditModal({ open: false, transaction: null }),
    editMode: true,
  });

  return (
    <div
      className="min-h-screen overflow-y-auto pb-8 bg-chef-pattern"
      style={{
        background: 'linear-gradient(135deg, #eaf6f6 0%, #d6efee 50%, #1a3535 100%)',
      }}
    >
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl border border-white/30 bg-white/90 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-chef text-gray-800 mb-2">Scheduled Transactions</h1>
              <p className="text-lg text-gray-600 font-medium leading-relaxed mb-4">
                View and manage your recurring transactions
              </p>
            </div>
            <button
              className="chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => setShowAddModal(true)}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 5v14m7-7H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add Scheduled
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {actionError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {actionError}
            </div>
          )}
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading scheduled transactions...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : scheduledTrans.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No scheduled transactions found.</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Day</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Amount</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Currency</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Category</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Description</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledTrans.map(tx => (
                      <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900 font-medium">
                          {tx.day_of_month}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <TypeBadge type={tx.scheduled_trans_status} />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <AmountCell type={tx.scheduled_trans_status} amount={tx.amount} currency={tx.currency} />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 font-medium">
                          {tx.currency}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <CategoryTag type={tx.scheduled_trans_status} category={tx.category} />
                        </td>
                        <td className="px-4 py-2 text-gray-700 max-w-xs">
                          <div className="truncate">
                            {tx.scheduled_trans_details ? tx.scheduled_trans_details : <span className="text-gray-400 italic">No description</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              className="chef-button-secondary px-2 py-1 text-xs"
                              onClick={() => handleEdit(tx)}
                            >
                              Edit
                            </button>
                            <button
                              className="chef-button-secondary px-2 py-1 text-xs text-red-600"
                              onClick={() => handleDelete(tx)}
                              disabled={!!deleteLoading[tx.id]}
                            >
                              {deleteLoading[tx.id] ? (
                                <svg className="w-4 h-4 animate-spin text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none"/>
                                </svg>
                              ) : (
                                'Delete'
                              )}
                            </button>
                            <button
                              className={`chef-button-secondary px-3 py-1 flex items-center gap-2 ${tx.status ? 'bg-green-100 text-green-700' : ''}`}
                              onClick={() => handleStatusToggle(tx)}
                              disabled={!!statusLoading[tx.id]}
                            >
                              {statusLoading[tx.id] ? (
                                <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none"/>
                                </svg>
                              ) : tx.status ? (
                                <>
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Active
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 5v14m7-7H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Inactive
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-4">
                {scheduledTrans.map(tx => (
                  <div
                    key={tx.id}
                    className={`scheduled-card border rounded-xl p-4 ${tx.scheduled_trans_status === 'deposit' || tx.scheduled_trans_status === 'Deposit'
                      ? 'bg-green-50 border-l-4 border-green-400'
                      : 'bg-red-50 border-l-4 border-red-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center
                          ${tx.scheduled_trans_status === 'deposit' || tx.scheduled_trans_status === 'Deposit'
                            ? 'bg-green-100'
                            : 'bg-red-100'
                          }`}>
                          {tx.scheduled_trans_status === 'deposit' || tx.scheduled_trans_status === 'Deposit' ? (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                        </div>
                        <span className={`font-medium ${tx.scheduled_trans_status === 'deposit' || tx.scheduled_trans_status === 'Deposit' ? 'text-green-800' : 'text-red-800'}`}>
                          {tx.scheduled_trans_status === 'deposit' || tx.scheduled_trans_status === 'Deposit' ? 'Income' : 'Expense'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${tx.scheduled_trans_status === 'deposit' || tx.scheduled_trans_status === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.scheduled_trans_status === 'deposit' || tx.scheduled_trans_status === 'Deposit' ? '+' : '-'}
                          {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency}
                        </div>
                        <div className="text-sm text-gray-500">Day {tx.day_of_month}</div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <CategoryTag type={tx.scheduled_trans_status} category={tx.category} />
                    </div>
                    {tx.scheduled_trans_details && (
                      <div className="mb-2">
                        <p className="text-gray-700 text-sm">{tx.scheduled_trans_details}</p>
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        className="chef-button-secondary px-2 py-1 text-xs"
                        onClick={() => handleEdit(tx)}
                      >
                        Edit
                      </button>
                      <button
                        className="chef-button-secondary px-2 py-1 text-xs text-red-600"
                        onClick={() => handleDelete(tx)}
                        disabled={!!deleteLoading[tx.id]}
                      >
                        {deleteLoading[tx.id] ? (
                          <svg className="w-4 h-4 animate-spin text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none"/>
                          </svg>
                        ) : (
                          'Delete'
                        )}
                      </button>
                      <button
                        className={`chef-button-secondary px-3 py-1 flex items-center gap-2 ${tx.status ? 'bg-green-100 text-green-700' : ''}`}
                        onClick={() => handleStatusToggle(tx)}
                        disabled={!!statusLoading[tx.id]}
                      >
                        {statusLoading[tx.id] ? (
                          <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none"/>
                          </svg>
                        ) : tx.status ? (
                          <>
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Active
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M12 5v14m7-7H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Inactive
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {pagination.num_pages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              <button
                className="chef-button-secondary px-3 py-1"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Prev
              </button>
              <button
                className="chef-button-secondary px-3 py-1"
                disabled={page >= pagination.num_pages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
      {showAddModal && (
        <AddScheduledTransactionModal
          initialType="deposit"
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}
      {editModal.open && (
        <AddScheduledTransactionModal
          {...getEditModalProps(editModal.transaction)}
        />
      )}
      <Footer />
    </div>
  );
};

export default ShowScheduledTransactions;
