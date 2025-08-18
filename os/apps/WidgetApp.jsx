import React from 'react';
// Expect user's project to have this path:
import WidgetRenderer from '../../widgets/WidgetRenderer.jsx';

export const WidgetApp = (widgetId) => function WrappedWidgetApp() {
  return (
    <div className="h-full w-full p-2">
      <WidgetRenderer widgetId={widgetId} />
    </div>
  );
};
