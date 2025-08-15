// Analytics View Component
import React from 'react';

const AnalyticsView = ({ infrastructure, healthTrend, summary }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Infrastructure Health Overview</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Overall Health Score</span>
            <span className="text-2xl font-bold text-green-600">{summary.healthScore}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Average CPU Usage</span>
            <span className="text-lg font-semibold text-blue-600">{summary.avgCpu}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Critical Events</span>
            <span className="text-lg font-semibold text-red-600">{summary.criticalEvents}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resource Distribution</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Online</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 bg-green-500 rounded-full" 
                  style={{ width: `${(summary.online / summary.total) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{summary.online}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Warning</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 bg-yellow-500 rounded-full" 
                  style={{ width: `${(summary.warning / summary.total) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{summary.warning}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Critical</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 bg-red-500 rounded-full" 
                  style={{ width: `${(summary.critical / summary.total) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{summary.critical}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsView;