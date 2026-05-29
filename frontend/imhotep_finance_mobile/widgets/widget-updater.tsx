import React from 'react';
import { Platform } from 'react-native';
import { NetWorthShortcutsWidget } from './NetWorthShortcutsWidget';

export async function updateNetworthShortcutsWidget() {
  if (Platform.OS !== 'android') return;

  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');
    await requestWidgetUpdate({
      widgetName: 'NetWorthShortcutsWidget',
      renderWidget: () => <NetWorthShortcutsWidget />,
    });
  } catch (error) {
    console.warn('Failed to update NetWorthShortcutsWidget:', error);
  }
}

export async function updateNetworthWidget(customData?: any) {
  // No-op: NetWorthWidget has been removed, and only NetWorthShortcutsWidget remains.
  // This function is kept to prevent compilation errors in app screens.
}
