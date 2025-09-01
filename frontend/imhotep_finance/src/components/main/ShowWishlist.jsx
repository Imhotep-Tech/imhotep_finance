import { useState, useEffect } from 'react';
import axios from 'axios';
import Footer from '../common/Footer';
import Pagination from '../common/Pagination';
import AddWishModal from './components/AddWishModal';
import UpdateWishModal from './components/UpdateWishModal';

const ShowWishlist = () => {
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
    <span className="font-semibold text-blue-600">
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
    if (!window.confirm('Are you sure you want to delete this wish?')) return;
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
      className="min-h-screen bg-chef-pattern"
      style={{
        background: 'linear-gradient(135deg, #eaf6f6 0%, #d6efee 50%, #1a3535 100%)',
      }}
    >
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="chef-card rounded-3xl p-8 shadow-2xl backdrop-blur-2xl border border-white/30 bg-white/90 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-chef text-gray-800 mb-2">Wishlist</h1>
              <p className="text-lg text-gray-600 font-medium leading-relaxed mb-4">
                View and manage your wishlist items
              </p>
            </div>
            <button
              className="chef-button bg-gradient-to-r from-[#366c6b] to-[#1a3535] text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => setShowAddModal(true)}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 5v14m7-7H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add Wish
            </button>
          </div>
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
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

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Show backend error messages */}
          {actionError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {actionError}
            </div>
          )}
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading wishlist...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : wishlist.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No wishlist items found.</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Wish</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Price</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Currency</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Year</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Link</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wishlist.map(w => (
                      <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                          {w.wish_details || <span className="text-gray-400 italic">No details</span>}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <AmountCell price={w.price} currency={w.currency} />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 font-medium">
                          {w.currency}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 font-medium">
                          {w.year}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {w.link ? (
                            <a href={w.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
                          ) : (
                            <span className="text-gray-400 italic">No link</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <button
                            className={`chef-button-secondary px-3 py-1 flex items-center gap-2 ${w.status === true ? 'bg-green-100 text-green-700' : ''}`}
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
                                Completed
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 5v14m7-7H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Mark as Completed
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              className="chef-button-secondary px-2 py-1 text-xs"
                              onClick={() => handleEdit(w)}
                              disabled={w.status === true}
                            >
                              Edit
                            </button>
                            <button
                              className="chef-button-secondary px-2 py-1 text-xs text-red-600"
                              onClick={() => handleDelete(w)}
                              disabled={!!deleteLoading[w.id] || w.status === true}
                            >
                              {deleteLoading[w.id] ? (
                                <svg className="w-4 h-4 animate-spin text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none"/>
                                </svg>
                              ) : (
                                'Delete'
                              )}
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
                {wishlist.map(w => (
                  <div
                    key={w.id}
                    className="wishlist-card border rounded-xl p-4 bg-blue-50 border-l-4 border-blue-400"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-blue-800">
                        {w.wish_details || <span className="text-gray-400 italic">No details</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          <AmountCell price={w.price} currency={w.currency} />
                        </div>
                        <div className="text-sm text-gray-500">{w.year}</div>
                      </div>
                    </div>
                    {w.link && (
                      <div className="mb-2">
                        <a href={w.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">View Link</a>
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        className={`chef-button-secondary px-3 py-1 flex items-center gap-2 ${w.status === true ? 'bg-green-100 text-green-700' : ''}`}
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
                            Completed
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M12 5v14m7-7H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Mark as Completed
                          </>
                        )}
                      </button>
                      <button
                        className="chef-button-secondary px-2 py-1 text-xs"
                        onClick={() => handleEdit(w)}
                        disabled={w.status === true}
                      >
                        Edit
                      </button>
                      <button
                        className="chef-button-secondary px-2 py-1 text-xs text-red-600"
                        onClick={() => handleDelete(w)}
                        disabled={!!deleteLoading[w.id] || w.status === true}
                      >
                        {deleteLoading[w.id] ? (
                          <svg className="w-4 h-4 animate-spin text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none"/>
                          </svg>
                        ) : (
                          'Delete'
                        )}
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
