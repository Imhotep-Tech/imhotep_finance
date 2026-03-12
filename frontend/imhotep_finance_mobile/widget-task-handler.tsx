import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './constants/api';
import { NetWorthWidget } from './widgets/NetWorthWidget';

type WidgetState = {
  isLoggedIn: boolean;
  favoriteCurrency: string;
  networth: string;
  score: number | null;
  hasError: boolean;
  isRefreshing: boolean;
};

const DEFAULT_STATE: WidgetState = {
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

async function fetchNetworthData(): Promise<WidgetState> {
  const token = await loadAuthToken();

  if (!token) {
    return {
      ...DEFAULT_STATE,
      isLoggedIn: false,
    };
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Net worth & favorite currency
    const networthRes = await api.get('/api/finance-management/get-networth/', { headers });
    const networth = String(networthRes.data.networth || '0');
    const favoriteCurrency = networthRes.data.favorite_currency || 'USD';

    // 2. Score
    let score: number | null = null;
    try {
      const scoreRes = await api.get('/api/finance-management/target/get-score/', { headers });
      if (scoreRes.data.score_txt) {
        score = Number(scoreRes.data.score ?? null);
      }
    } catch {
      // If score fails, widget still works
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

async function renderNetworthWidget(props: WidgetTaskHandlerProps, overrideState?: Partial<WidgetState>) {
  const baseState = overrideState?.isRefreshing
    ? { ...(await fetchNetworthData()), ...overrideState }
    : await fetchNetworthData();

  const state: WidgetState = {
    ...baseState,
    ...overrideState,
  };

  props.renderWidget(<NetWorthWidget {...state} />);
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, clickAction } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      await renderNetworthWidget(props);
      break;
    case 'WIDGET_CLICK':
      if (clickAction === 'REFRESH_NETWORTH') {
        // Show refreshing state while data is fetched
        await renderNetworthWidget(props, { isRefreshing: true });
      }
      break;
    case 'WIDGET_DELETED':
    default:
      break;
  }
}

