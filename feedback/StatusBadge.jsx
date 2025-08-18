import React from 'react';

export default function StatusBadge({ status, size = "sm", className = "" }) {
  const baseClasses = "inline-flex items-center font-medium rounded-full";
  
  const sizeClasses = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-sm"
  };

  const statusClasses = {
    online: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    healthy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    offline: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    maintenance: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    unknown: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
  };

  const normalizedStatus = status?.toLowerCase() || 'unknown';
  
  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${statusClasses[normalizedStatus] || statusClasses.unknown} ${className}`}>
      {status || 'Unknown'}
    </span>
  );
}
