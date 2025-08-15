// Audit Trail View Component
import React from 'react';
import StatusBadge from '../feedback/StatusBadge';

const AuditTrailView = ({ changeHistory }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change History Audit Trail</h2>
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Change ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Targets</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Impact</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {changeHistory?.slice(0, 10).map(log => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-white">{log.id}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white capitalize">{log.action?.type || 'N/A'}</td>
                <td className="px-4 py-2 text-sm">
                  <StatusBadge status={log.status?.toLowerCase()} />
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                  {log.targets?.length || 0} assets
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                  {log.simulatedImpact?.affectedCount || 0} downstream
                </td>
                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTrailView;
