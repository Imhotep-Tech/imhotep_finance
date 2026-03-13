'use no memo';

import React from 'react';
import { FlexWidget, OverlapWidget, TextWidget } from 'react-native-android-widget';

type NetWorthWidgetProps = {
  isLoggedIn: boolean;
  favoriteCurrency: string;
  networth: string;
  score: number | null;
  hasError: boolean;
  isRefreshing: boolean;
};

const getScoreColor = (score: number | null): any => {
  if (score === null) return '#f59e0b'; // Neutral/unknown
  if (score > 0) return '#10b981'; // Positive
  if (score < 0) return '#ef4444'; // Negative
  return '#f59e0b';
};

export function NetWorthWidget(props: NetWorthWidgetProps) {
  const { isLoggedIn, favoriteCurrency, networth, score, hasError, isRefreshing } = props;

  const scoreColor = getScoreColor(score);
  const scoreLabel =
    score === null ? 'No score' : `${score > 0 ? '+' : ''}${score.toFixed(0)} ${favoriteCurrency}`;

  const mainText = !isLoggedIn
    ? 'Login to see your net worth'
    : hasError
    ? 'Could not load net worth'
    : `${Number(networth || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${favoriteCurrency}`;

  const subtitle = !isLoggedIn
    ? 'Open the app to sign in'
    : hasError
    ? 'Tap reload to try again'
    : isRefreshing
    ? 'Refreshing...'
    : 'Total Net Worth';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        padding: 12,
        backgroundColor: '#0f172a',
        borderRadius: 16,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'imhotep-finance://show-networth-details' }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 10,
          width: 'match_parent',
        }}
      >
        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            flex: 1,
            marginRight: 8,
          }}
        >
          <TextWidget
            text="Total Net Worth"
            style={{
              fontSize: 12,
              color: 'rgba(248, 250, 252, 0.7)',
            }}
          />
          <TextWidget
            text={mainText}
            style={{
              marginTop: 4,
              fontSize: 20,
              fontWeight: '700',
              color: '#f9fafb',
            }}
          />
          <TextWidget
            text={subtitle}
            style={{
              marginTop: 2,
              fontSize: 11,
              color: 'rgba(148, 163, 184, 0.9)',
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
          }}
        >
          <FlexWidget
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 999,
              backgroundColor: '#366c6b',
              marginBottom: 6,
            }}
            clickAction="REFRESH_NETWORTH"
          >
            <TextWidget
              text={isRefreshing ? 'Reloading...' : 'Reload'}
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: '#f9fafb',
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: 999,
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.6)',
            }}
          >
            <TextWidget
              text="Score"
              style={{
                fontSize: 11,
                color: 'rgba(148, 163, 184, 0.9)',
              }}
            />
            <TextWidget
              text={scoreLabel}
              style={{
                marginLeft: 4,
                fontSize: 11,
                fontWeight: '600',
                color: scoreColor,
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'match_parent',
          marginTop: 8,
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            justifyContent: 'center',
            marginRight: 6,
          }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'imhotep-finance://add-transaction?type=deposit' }}
        >
          <TextWidget
            text="+ Deposit"
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: '#10b981',
              textAlign: 'center',
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            justifyContent: 'center',
            marginLeft: 6,
          }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: 'imhotep-finance://add-transaction?type=withdraw' }}
        >
          <TextWidget
            text="- Withdraw"
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: '#ef4444',
              textAlign: 'center',
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

