import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { NetWorthShortcutsWidget } from './widgets/NetWorthShortcutsWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, widgetInfo } = props;
  const { widgetName } = widgetInfo;

  if (widgetName === 'NetWorthShortcutsWidget') {
    switch (widgetAction) {
      case 'WIDGET_ADDED':
      case 'WIDGET_UPDATE':
      case 'WIDGET_RESIZED':
        props.renderWidget(<NetWorthShortcutsWidget />);
        break;
      default:
        break;
    }
  }
}
