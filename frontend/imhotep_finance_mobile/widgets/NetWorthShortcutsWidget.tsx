'use no memo';

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function NetWorthShortcutsWidget() {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#0f172a',
        borderRadius: 16,
      }}
    >
      <FlexWidget
        style={{
          flex: 1,
          paddingVertical: 12,
          paddingHorizontal: 8,
          borderRadius: 999,
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          justifyContent: 'center',
          alignItems: 'center',
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
          flex: 1.2,
          paddingVertical: 12,
          paddingHorizontal: 8,
          borderRadius: 999,
          backgroundColor: '#366c6b',
          justifyContent: 'center',
          alignItems: 'center',
          marginHorizontal: 6,
        }}
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'imhotep-finance://show-networth-details' }}
      >
        <TextWidget
          text="Net Worth"
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: '#f9fafb',
            textAlign: 'center',
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          flex: 1,
          paddingVertical: 12,
          paddingHorizontal: 8,
          borderRadius: 999,
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          justifyContent: 'center',
          alignItems: 'center',
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
  );
}
