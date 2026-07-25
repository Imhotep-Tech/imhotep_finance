import { useState, useCallback, useEffect } from 'react';
import api from '@/constants/api';
import { Transaction, TransactionFilterParams } from '@/types/finance';

export const useTransactionList = (initialPlaceFilter: string = '') => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<TransactionFilterParams>({
    startDate: null,
    endDate: null,
    statusFilter: '',
    categoryFilter: '',
    placeFilter: initialPlaceFilter,
    detailsSearch: '',
  });

  const fetchTransactions = useCallback(
    async (
      pageNum: number,
      refresh: boolean = false,
      filterOverrides?: Partial<TransactionFilterParams>
    ) => {
      setLoading(true);
      setError(null);

      try {
        const activeFilters = { ...filters, ...filterOverrides };
        const params: Record<string, any> = { page: pageNum };

        if (activeFilters.startDate) {
          params.start_date = activeFilters.startDate.toISOString().split('T')[0];
        }
        if (activeFilters.endDate) {
          params.end_date = activeFilters.endDate.toISOString().split('T')[0];
        }
        if (activeFilters.statusFilter) {
          params.trans_status = activeFilters.statusFilter;
        }
        if (activeFilters.categoryFilter) {
          params.category = activeFilters.categoryFilter;
        }
        if (activeFilters.placeFilter) {
          params.place = activeFilters.placeFilter;
        }
        if (activeFilters.detailsSearch) {
          params.details_search = activeFilters.detailsSearch;
        }

        const res = await api.get('/api/finance-management/transaction/get-transactions/', {
          params,
        });

        const newTransactions: Transaction[] = res.data.transactions || [];
        let actuallyAddedCount = 0;

        if (refresh) {
          setTransactions(newTransactions);
          actuallyAddedCount = newTransactions.length;
        } else {
          setTransactions((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const uniqueNew = newTransactions.filter((t) => !existingIds.has(t.id));
            actuallyAddedCount = uniqueNew.length;
            return [...prev, ...uniqueNew];
          });
        }

        let hasMoreFromAPI: boolean;
        if (res.data.has_more !== undefined) {
          hasMoreFromAPI = res.data.has_more;
        } else {
          hasMoreFromAPI = newTransactions.length >= 10 && actuallyAddedCount > 0;
        }

        setPage(pageNum);
        setHasMore(hasMoreFromAPI);
      } catch (err: any) {
        console.error('Fetch transactions error:', err);
        setError('Failed to load transaction records');
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  const refreshList = useCallback(
    (overrides?: Partial<TransactionFilterParams>) => {
      setRefreshing(true);
      setPage(1);
      setHasMore(true);
      fetchTransactions(1, true, overrides);
    },
    [fetchTransactions]
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      fetchTransactions(nextPage, false);
    }
  }, [loading, hasMore, page, fetchTransactions]);

  const updateFilters = useCallback(
    (newFilters: Partial<TransactionFilterParams>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      setPage(1);
      setHasMore(true);
      fetchTransactions(1, true, updated);
    },
    [filters, fetchTransactions]
  );

  const clearFilters = useCallback(() => {
    const cleared: TransactionFilterParams = {
      startDate: null,
      endDate: null,
      statusFilter: '',
      categoryFilter: '',
      placeFilter: '',
      detailsSearch: '',
    };
    setFilters(cleared);
    setPage(1);
    setHasMore(true);
    fetchTransactions(1, true, cleared);
  }, [fetchTransactions]);

  // Initial fetch on place filter change
  useEffect(() => {
    if (initialPlaceFilter !== filters.placeFilter) {
      setFilters((prev) => ({ ...prev, placeFilter: initialPlaceFilter }));
      fetchTransactions(1, true, { placeFilter: initialPlaceFilter });
    }
  }, [initialPlaceFilter]);

  return {
    transactions,
    loading,
    refreshing,
    hasMore,
    error,
    filters,
    page,
    refreshList,
    loadMore,
    updateFilters,
    clearFilters,
    fetchTransactions,
  };
};

export default useTransactionList;
