import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Returns the balance available for a specific place (account) and currency.
 * Defaults to 'General' if place is empty.
 */
export function getBalanceForPlace(details, currency, place) {
  if (!details || !currency) return 0;
  const targetPlace = (place && String(place).trim()) ? String(place).trim() : 'General';
  const placeKey = Object.keys(details).find(
    k => k.trim().toLowerCase() === targetPlace.toLowerCase()
  );
  if (!placeKey || !Array.isArray(details[placeKey])) {
    return 0;
  }
  const item = details[placeKey].find(
    i => i.currency && i.currency.toUpperCase() === currency.toUpperCase()
  );
  return item ? Number(item.amount || 0) : 0;
}

/**
 * Returns total balance available for a currency aggregated across all places.
 */
export function getTotalBalanceForCurrency(details, currency) {
  if (!details || !currency) return 0;
  let total = 0;
  Object.values(details).forEach(list => {
    if (Array.isArray(list)) {
      list.forEach(i => {
        if (i.currency && i.currency.toUpperCase() === currency.toUpperCase()) {
          total += Number(i.amount || 0);
        }
      });
    }
  });
  return total;
}

/**
 * Hook to fetch and provide networth details per place and currency.
 */
export function useNetworthBalances() {
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    axios.get('/api/finance-management/get-networth-details/')
      .then(res => {
        if (res.data?.networth_details) {
          setDetails(res.data.networth_details);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch networth details:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { details, loading, refresh };
}
