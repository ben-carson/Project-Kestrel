// src/components/widgets/NetworkTopology/Overlays/PredictivePanel.jsx

import React, { useState, useMemo } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Clock, 
  Zap,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';

const PredictivePanel = ({ 
  predictiveAnalytics = [],
  className = "absolute top-4 right-4 w-80"
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('risk');

  // Process and sort predictions
  const processedPredictions = useMemo(() => {
    return predictiveAnalytics
      .filter(p => p.prediction && p.prediction.risk > 0.1) // Only show meaningful predictions
      .sort((a, b) => {
        // Sort by risk level, then by confidence
        const riskDiff = (b.prediction?.risk || 0) - (a.prediction?.risk || 0);
        if (Math.abs(riskDiff) > 0.05) return riskDiff;
        return (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0);
      })
      .slice(0, 8); // Show top 8 predictions
  }, [predictiveAnalytics]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!processedPredictions.length) {
      return { highRisk: 0, mediumRisk: 0, lowRisk: 0, avgConfidence: 0 };
    }

    const stats = processedPredictions.reduce((acc, pred) => {
      const risk = pred.prediction?.risk || 0;
      const confidence = pred.prediction?.confidence || 0;

      if (risk > 0.7) acc.highRisk++;
      else if (risk > 0.4) acc.mediumRisk++;
      else acc.lowRisk++;

      acc.totalConfidence += confidence;
      return acc;
    }, { highRisk: 0, mediumRisk: 0, lowRisk: 0, totalConfidence: 0 });

    stats.avgConfidence = stats.totalConfidence / processedPredictions.length;
    return stats;
  }, [processedPredictions]);

  if (!predictiveAnalytics.length) {
    return null;
  }

  return (
    <div className={className}>
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                AI Predictions
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {processedPredictions.length} active predictions
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? 
              <ChevronUp className="w-4 h-4 text-gray-500" /> : 
              <ChevronDown className="w-4 h-4 text-gray-500" />
            }
          </button>
        </div>

        {isExpanded && (
          <>
            {/* Summary Stats */}
            <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="grid grid-cols-3 gap-3 text-center">
                <SummaryStatCard
                  label="High Risk"
                  value={summaryStats.highRisk}
                  color="red"
                  icon={<AlertTriangle className="w-3 h-3" />}
                />
                <SummaryStatCard
                  label="Medium Risk"
                  value={summaryStats.mediumRisk}
                  color="yellow"
                  icon={<TrendingUp className="w-3 h-3" />}
                />
                <SummaryStatCard
                  label="Avg Confidence"
                  value={`${Math.round(summaryStats.avgConfidence * 100)}%`}
                  color="blue"
                  icon={<Target className="w-3 h-3" />}
                />
              </div>
            </div>

            {/* Metric Selector */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <MetricButton
                  active={selectedMetric === 'risk'}
                  onClick={() => setSelectedMetric('risk')}
                  label="Risk Level"
                />
                <MetricButton
                  active={selectedMetric === 'confidence'}
                  onClick={() => setSelectedMetric('confidence')}
                  label="Confidence"
                />
                <MetricButton
                  active={selectedMetric === 'time'}
                  onClick={() => setSelectedMetric('time')}
                  label="Time to Failure"
                />
              </div>
            </div>

            {/* Predictions List */}
            <div className="max-h-64 overflow-y-auto">
              {processedPredictions.length > 0 ? (
                <div className="space-y-1 p-2">
                  {processedPredictions.map((prediction) => (
                    <PredictionCard
                      key={prediction.serverId}
                      prediction={prediction}
                      selectedMetric={selectedMetric}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No significant predictions
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    All systems operating within normal parameters
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  <span>Live ML Analysis</span>
                </div>
                <div>Updated {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SummaryStatCard = ({ label, value, color, icon }) => {
  const colorClasses = {
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
  };

  return (
    <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-lg font-bold">{value}</span>
      </div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
};

const MetricButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
      active
        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    {label}
  </button>
);

const PredictionCard = ({ prediction, selectedMetric }) => {
  const { serverName, prediction: predData, recommendations = [] } = prediction;
  const { risk = 0, confidence = 0, timeToFailure } = predData || {};

  // Get risk level and styling
  const getRiskLevel = (riskValue) => {
    if (riskValue > 0.7) return { level: 'High', color: 'red', bgColor: 'bg-red-50 dark:bg-red-900/20' };
    if (riskValue > 0.4) return { level: 'Medium', color: 'yellow', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' };
    return { level: 'Low', color: 'green', bgColor: 'bg-green-50 dark:bg-green-900/20' };
  };

  const riskInfo = getRiskLevel(risk);

  // Format time to failure
  const formatTimeToFailure = (time) => {
    if (!time) return 'Unknown';
    const hours = Math.floor(time / (1000 * 60 * 60));
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Get metric-specific display
  const getMetricDisplay = () => {
    switch (selectedMetric) {
      case 'confidence':
        return {
          value: Math.round(confidence * 100),
          unit: '%',
          color: confidence > 0.8 ? 'green' : confidence > 0.6 ? 'yellow' : 'red'
        };
      case 'time':
        return {
          value: formatTimeToFailure(timeToFailure),
          unit: '',
          color: timeToFailure && timeToFailure < 3600000 ? 'red' : 'yellow' // Less than 1 hour
        };
      default: // risk
        return {
          value: Math.round(risk * 100),
          unit: '%',
          color: riskInfo.color
        };
    }
  };

  const metricDisplay = getMetricDisplay();

  return (
    <div className={`p-3 rounded-lg border transition-all hover:shadow-sm ${riskInfo.bgColor} border-${riskInfo.color}-200 dark:border-${riskInfo.color}-700/50`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {serverName}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full bg-${riskInfo.color}-100 dark:bg-${riskInfo.color}-900/30 text-${riskInfo.color}-700 dark:text-${riskInfo.color}-400`}>
              {riskInfo.level} Risk
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-lg font-bold text-${metricDisplay.color}-600 dark:text-${metricDisplay.color}-400`}>
            {metricDisplay.value}{metricDisplay.unit}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {selectedMetric === 'time' ? 'Est. Failure' : selectedMetric}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
        <div 
          className={`h-1.5 rounded-full transition-all duration-500 bg-${riskInfo.color}-500`}
          style={{ 
            width: selectedMetric === 'risk' ? `${risk * 100}%` : 
                   selectedMetric === 'confidence' ? `${confidence * 100}%` : 
                   timeToFailure ? `${Math.max(10, 100 - (timeToFailure / 3600000) * 100)}%` : '0%'
          }}
        />
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Recommendations
            </span>
          </div>
          <div className="space-y-1">
            {recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                <span className="text-blue-500 mt-0.5">•</span>
                <span className="flex-1">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
            <span className="ml-1 font-medium">{Math.round(confidence * 100)}%</span>
          </div>
          {timeToFailure && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">ETA:</span>
              <span className="ml-1 font-medium">{formatTimeToFailure(timeToFailure)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictivePanel;