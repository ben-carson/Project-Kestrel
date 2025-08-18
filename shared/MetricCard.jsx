//src/components/shared/MetricCard.jsx
import React from 'react';

const MetricCard = ({ label, value, percentage, color = 'blue' }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
      {percentage !== undefined && (
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
          <div 
            className={`bg-${color}-500 h-1 rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default MetricCard;