// Execute Confirmation Modal Component
import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { AlertTriangle } from 'lucide-react';

const ExecuteConfirmationModal = ({ isOpen, onCancel, onConfirm, onDiscard, plan, impactedAssets, infrastructure }) => {
  const [confirmationText, setConfirmationText] = useState('');
  
  if (!isOpen || !plan) return null;

  const isConfirmed = confirmationText === 'EXECUTE';
  
  const selectedAssets = plan.targets || [];
  const impact = plan.simulatedImpact || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <h2 className="text-xl font-bold text-red-900 dark:text-red-100">Confirm Execution</h2>
              <p className="text-red-700 dark:text-red-200">This action is irreversible.</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-gray-900 dark:text-white">
            You are about to execute Change <span className="font-mono font-bold text-blue-600">{plan?.id || '...'}</span>.
          </p>
          
          <div className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Impact Summary:</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li><span className="font-bold">{selectedAssets.length}</span> target assets will be changed.</li>
              <li><span className="font-bold">{impact.affectedCount || 0}</span> downstream dependencies affected.</li>
              <li>Estimated Downtime: <span className="font-bold">{impact.predictedDowntime || 'Unknown'}</span>.</li>
              <li>Impacts approx. <span className="font-bold">{impact.impactedUsers?.toLocaleString() || 'Unknown'} users</span>.</li>
              <li>Estimated Revenue Impact: <span className="font-bold">${impact.estimatedRevenueImpact?.toLocaleString() || '0'}</span>.</li>
              {impact.slaViolation && (
                <li className="text-red-600 dark:text-red-400 font-bold">⚠️ Potential SLA Violation!</li>
              )}
            </ul>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white">
              To proceed, please type 'EXECUTE' below:
            </label>
            <input 
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
              placeholder="Type EXECUTE to confirm"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onDiscard();
              setConfirmationText('');
            }}
            className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-700 text-white font-medium transition-colors"
          >
            Discard Plan
          </button>
          <button 
            onClick={() => {
              onConfirm();
              setConfirmationText('');
            }}
            disabled={!isConfirmed}
            className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-800 disabled:cursor-not-allowed transition-colors"
          >
            Execute Plan
          </button>
        </div>
      </div>
    </div>
  );
};