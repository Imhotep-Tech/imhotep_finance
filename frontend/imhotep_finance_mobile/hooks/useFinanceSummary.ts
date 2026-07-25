import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import api from '@/constants/api';
import { updateNetworthWidget } from '@/widgets/widget-updater';
import { FinancialSummary } from '@/types/finance';

export const useFinanceSummary = () => {
  const [summary, setSummary] = useState<FinancialSummary>({
    networth: '0',
    favoriteCurrency: 'USD',
    score: null,
    scoreTxt: '',
    target: '',
    loading: true,
    error: null,
  });

  const fetchFinanceSummary = useCallback(async () => {
    let latestNetworth = '0';
    let latestCurrency = 'USD';
    let latestScore: number | null = null;
    let latestScoreTxt = '';
    let latestTarget = '';
    let hasError = false;
    let errorMessage: string | null = null;

    setSummary((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 1. Fetch Networth from Imhotep backend API
      const networthRes = await api.get('/api/finance-management/get-networth/');
      latestNetworth = networthRes.data?.networth || '0';
      if (networthRes.data?.favorite_currency) {
        latestCurrency = networthRes.data.favorite_currency;
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        latestNetworth = '0';
      } else {
        console.warn('Networth fetch error:', err);
        hasError = true;
        errorMessage = 'Failed to load net worth balance';
      }
    }

    try {
      // 2. Fetch Favorite Currency (backup check)
      const favRes = await axios.get('/api/get-fav-currency/');
      if (favRes.data?.favorite_currency) {
        latestCurrency = favRes.data.favorite_currency;
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.warn('Favorite currency fetch error:', err);
      }
    }

    try {
      // 3. Fetch Target Score
      const scoreRes = await api.get('/api/finance-management/target/get-score/');
      if (scoreRes.data?.score_txt) {
        latestScore = scoreRes.data.score;
        latestScoreTxt = scoreRes.data.score_txt;
        latestTarget = scoreRes.data.target;
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        latestScore = null;
        latestScoreTxt = '';
        latestTarget = '';
      } else {
        console.warn('Target score fetch error:', err);
      }
    }

    // 4. Update Last Login (fire and forget)
    api.post('/api/update-last-login/').catch(() => {});

    // Update local state
    setSummary({
      networth: latestNetworth,
      favoriteCurrency: latestCurrency,
      score: latestScore,
      scoreTxt: latestScoreTxt,
      target: latestTarget,
      loading: false,
      error: hasError ? errorMessage : null,
    });

    // Update Android widget
    updateNetworthWidget({
      isLoggedIn: true,
      favoriteCurrency: latestCurrency,
      networth: latestNetworth,
      score: latestScore,
      hasError,
      isRefreshing: false,
    });
  }, []);

  useEffect(() => {
    fetchFinanceSummary();
  }, [fetchFinanceSummary]);

  return {
    ...summary,
    refetch: fetchFinanceSummary,
  };
};

export default useFinanceSummary;
