//src/components/os/apps/AlertCenterApp.jsx

import React from 'react';
import AlertCenterWidget from '../../widgets/AlertCenterWidget';

const AlertCenterApp = () => {
  return (
    <div className="h-full w-full overflow-hidden">
      <AlertCenterWidget />
    </div>
  );
};

export default AlertCenterApp;