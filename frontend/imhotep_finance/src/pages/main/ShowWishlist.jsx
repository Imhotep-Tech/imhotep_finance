import { useState, useEffect } from 'react';
import axios from 'axios';
import Footer from '../../components/common/Footer';
import Pagination from '../../components/common/Pagination';
import AddWishModal from '../../components/AddWishModal';
import UpdateWishModal from '../../components/UpdateWishModal';
import { useTranslation } from '../../contexts/LanguageContext';

const ShowWishlist = () => {
  const { t } = useTranslation();
  const [wishlist, setWishlist] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, wish: null });
  const [statusLoading, setStatusLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState({});
  const [refetchFlag, setRefetchFlag] = useState(false);
  const [actionError, setActionError] = useState(''); // for backend errors

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      setError('');
      setActionError('');
      try {
        const params = { year, page };
        const res = await axios.get('/api/finance-management/wishlist/get-wishlist/', { params });
        setWishlist(res.data.wishlist || []);
        setPagination(res.data.pagination || {});
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Failed to fetch wishlist'
        );
        setWishlist([]);
        setPagination({});
      }
      setLoading(false);
    };
    fetchWishlist();
  }, [year, page, showAddModal, refetchFlag]);

  const handleYearChange = (e) => {
    setYear(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const AmountCell = ({ price, currency }) => (
    <span className="font-semibold text-blue-600 dark:text-blue-300">
      {Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
    </span>
  );

  // Edit wish handler
  const handleEdit = (wish) => {
    setEditModal({ open: true, wish });
  };

  // Delete wish handler
  const handleDelete = async (wish) => {
    setActionError('');
    if (!window.confirm(t('wishlist.alerts.deleteConfirm'))) return;
    setDeleteLoading(prev => ({ ...prev, [wish.id]: true }));
    try {
      await axios.delete(`/api/finance-management/wishlist/delete-wish/${wish.id}/`);
      setWishlist(wishlist.filter(w => w.id !== wish.id));
    } catch (err) {
      setActionError(
        err.response?.data?.error ||
        'Failed to delete wish'
      );
    }
    setDeleteLoading(prev => ({ ...prev, [wish.id]: false }));
  };

  // Status toggle handler (toggle both ways)
  const handleStatusToggle = async (wish) => {
    setActionError('');
    
    // Show warning when unmarking a completed wish
    if (wish.status === true) {
      const confirmMessage = t('wishlist.alerts.unmarkConfirm');
      
      if (!window.confirm(confirmMessage)) return;
    }
    
    setStatusLoading(prev => ({ ...prev, [wish.id]: true }));
    try {
      await axios.post(`/api/finance-management/wishlist/update-wish-status/${wish.id}/`);
      setRefetchFlag(flag => !flag); // trigger refetch
    } catch (err) {
      setActionError(
        err.response?.data?.error ||
        'Failed to update wish status'
      );
    }
    setStatusLoading(prev => ({ ...prev, [wish.id]: false }));
  };

  // Prepare props for edit modal
  const getEditModalProps = (wish) => ({
    initialValues: {
      price: wish.price,
      currency: wish.currency,
      wish_details: wish.wish_details,
      link: wish.link,
      place: wish.place,
      year: wish.year,
      id: wish.id,
    },
    onClose: () => {
      setEditModal({ open: false, wish: null });
      setRefetchFlag(flag => !flag);
    },
    onSuccess: () => {
      setEditModal({ open: false, wish: null });
      setRefetchFlag(flag => !flag);
    },
  });

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors relative"
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
              <h1 className="text-3xl font-bold font-chef text-gray-800 dark:text-gray-100 mb-2">{t('wishlist.title')}</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed mb-4">
                {t('wishlist.subtitle')}
              </p>
            </div>
            <button
              className="chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => setShowAddModal(true)}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 5v14m7-7H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('wishlist.addWish')}
            </button>
          </div>
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('wishlist.year')}</label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={handleYearChange}
                className="chef-input"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
          {/* Show backend error messages */}
          {actionError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {actionError}
            </div>
          )}
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">{t('wishlist.loading')}</div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400 py-8">{error}</div>
          ) : wishlist.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">{t('wishlist.emptyState')}</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('wishlist.table.wish')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('wishlist.table.price')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('wishlist.table.currency')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('wishlist.table.year')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('wishlist.table.place')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('wishlist.table.link')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('wishlist.table.status')}</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">{t('wishlist.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wishlist.map(w => (
                      <tr key={w.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 hover:dark:bg-gray-800/60">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          {w.wish_details || <span className="text-gray-400 italic">{t('wishlist.noDetails')}</span>}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <AmountCell price={w.price} currency={w.currency} />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium">
                          {w.currency}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium">
                          {w.year}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300 font-medium">
                          {w.place || t('wishlist.general')}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {w.link ? (
                            <a href={w.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">{t('wishlist.viewLink')}</a>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">{t('wishlist.noLink')}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <button
                            className={`chef-button-secondary px-3 py-1 flex items-center gap-2 dark:text-gray-100 dark:bg-gray-800 ${w.status === true ? 'bg-green-100 text-green-700' : ''}`}
                            onClick={() => handleStatusToggle(w)}
                            disabled={!!statusLoading[w.id]}
                          >
                            {statusLoading[w.id] ? (
                              <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none"/>
                              </svg>
                            ) : w.status === true ? (
                              <>
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {t('wishlist.completed')}
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 5v14m7-7H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {t('wishlist.markAsCompleted')}
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {w.status === true ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {t('wishlist.completedOn')}
                              </span>
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                {w.transaction_date || t('wishlist.na')}
                              </span>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                className="chef-button-secondary px-2 py-1 text-xs dark:text-gray-100 dark:bg-gray-800"
                                onClick={() => handleEdit(w)}
                              >
                                {t('common.actions.edit')}
                              </button>
                              <button
                                className="chef-button-secondary px-2 py-1 text-xs text-red-600 dark:text-gray-100 dark:bg-gray-800"
                                onClick={() => handleDelete(w)}
                                disabled={!!deleteLoading[w.id]}
                              >
                                {deleteLoading[w.id] ? (
                                  <svg className="w-4 h-4 animate-spin text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none"/>
                                  </svg>
                                ) : (
                                  t('common.actions.delete')
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {wishlist.map(w => (
                  <div
                    key={w.id}
                    className="wishlist-card border rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-blue-800 dark:text-blue-200">
                        {w.wish_details || <span className="text-gray-400 italic">{t('wishlist.noDetails')}</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-300">
                          <AmountCell price={w.price} currency={w.currency} />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{w.year}</div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        {w.place || t('wishlist.general')}
                      </span>
                    </div>
                    {w.link && (
                      <div className="mb-2">
                        <a href={w.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline text-sm">{t('wishlist.viewLinkFull')}</a>
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        className={`chef-button-secondary px-3 py-1 flex items-center gap-2 dark:text-gray-100 dark:bg-gray-800 ${w.status === true ? 'bg-green-100 text-green-700' : ''}`}
                        onClick={() => handleStatusToggle(w)}
                        disabled={!!statusLoading[w.id]}
                      >
                        {statusLoading[w.id] ? (
                          <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none"/>
                          </svg>
                        ) : w.status === true ? (
                          <>
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {t('wishlist.completed')}
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M12 5v14m7-7H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {t('wishlist.markAsCompleted')}
                          </>
                        )}
                      </button>
                      {w.status === true ? (
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {t('wishlist.completedOn')}
                          </span>
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">
                            {w.transaction_date || t('wishlist.na')}
                          </span>
                        </div>
                      ) : (
                        <>
                          <button
                            className="chef-button-secondary px-2 py-1 text-xs dark:text-gray-100 dark:bg-gray-800"
                            onClick={() => handleEdit(w)}
                          >
                            {t('common.actions.edit')}
                          </button>
                          <button
                            className="chef-button-secondary px-2 py-1 text-xs text-red-600 dark:text-gray-100 dark:bg-gray-800"
                            onClick={() => handleDelete(w)}
                            disabled={!!deleteLoading[w.id]}
                          >
                            {deleteLoading[w.id] ? (
                              <svg className="w-4 h-4 animate-spin text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none"/>
                              </svg>
                            ) : (
                              t('common.actions.delete')
                            )}
                          </button>
                        </>
                      )}
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
      
      {/* Add Wish Modal */}
      {showAddModal && (
        <AddWishModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
          initialYear={year}
        />
      )}
      {/* Edit Wish Modal */}
      {editModal.open && (
        <UpdateWishModal
          {...getEditModalProps(editModal.wish)}
        />
      )}
      <Footer />
    </div>
  );
};

export default ShowWishlist;
