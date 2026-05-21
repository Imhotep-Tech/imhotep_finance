import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { NetWorthWidget } from './widgets/NetWorthWidget';
import { fetchNetworthDataForWidget, WidgetData } from './widgets/widget-updater';

async function renderNetworthWidget(props: WidgetTaskHandlerProps, overrideState?: Partial<WidgetData>) {
  const baseState = overrideState?.isRefreshing
    ? { ...(await fetchNetworthDataForWidget()), ...overrideState }
    : await fetchNetworthDataForWidget();

  const state: WidgetData = {
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

