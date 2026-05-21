import React from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../constants/api';
import { NetWorthWidget } from './NetWorthWidget';

export type WidgetData = {
  isLoggedIn: boolean;
  favoriteCurrency: string;
  networth: string;
  score: number | null;
  hasError: boolean;
  isRefreshing: boolean;
};

const DEFAULT_STATE: WidgetData = {
  isLoggedIn: false,
  favoriteCurrency: 'USD',
  networth: '0',
  score: null,
  hasError: false,
  isRefreshing: false,
};

async function loadAuthToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('access_token');
    return token || null;
  } catch {
    return null;
  }
}

export async function fetchNetworthDataForWidget(): Promise<WidgetData> {
  const token = await loadAuthToken();

  if (!token) {
    return {
      ...DEFAULT_STATE,
      isLoggedIn: false,
    };
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Net worth
    const networthRes = await api.get('/api/finance-management/get-networth/', { headers });
    const networth = String(networthRes.data.networth || '0');

    // 2. Favorite currency
    let favoriteCurrency = 'USD';
    try {
      const favRes = await api.get('/api/get-fav-currency/', { headers });
      favoriteCurrency = favRes.data.favorite_currency || 'USD';
    } catch {
      // keep USD
    }

    // 3. Score
    let score: number | null = null;
    try {
      const scoreRes = await api.get('/api/finance-management/target/get-score/', { headers });
      if (scoreRes.data.score_txt) {
        score = Number(scoreRes.data.score ?? null);
      }
    } catch {
      score = null;
    }

    return {
      isLoggedIn: true,
      favoriteCurrency,
      networth,
      score,
      hasError: false,
      isRefreshing: false,
    };
  } catch {
    return {
      ...DEFAULT_STATE,
      isLoggedIn: true,
      hasError: true,
    };
  }
}

export async function updateNetworthWidget(customData?: Partial<WidgetData>) {
  if (Platform.OS !== 'android') return;

  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');

    // When passing customData, merge it with current data if some fields are missing.
    // If customData has isLoggedIn: false, just render DEFAULT_STATE.
    let finalData: WidgetData;
    if (customData) {
      if (customData.isLoggedIn === false) {
        finalData = { ...DEFAULT_STATE, isLoggedIn: false };
      } else {
        // Fetch current data and merge customData overrides
        const currentData = await fetchNetworthDataForWidget();
        finalData = { ...currentData, ...customData };
      }
    } else {
      finalData = await fetchNetworthDataForWidget();
    }

    await requestWidgetUpdate({
      widgetName: 'NetWorthWidget',
      renderWidget: () => <NetWorthWidget {...finalData} />,
    });
  } catch (error) {
    console.warn('Failed to update NetWorthWidget:', error);
  }
}
