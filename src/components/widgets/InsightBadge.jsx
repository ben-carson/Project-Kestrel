import React from "react";
import PropTypes from "prop-types";
import { Info, AlertCircle } from "lucide-react";
import classNames from "classnames";

const getConfidenceStyle = (score) => {
  if (score >= 0.9) return "border-green-500 text-green-600 bg-green-50";
  if (score >= 0.6) return "border-yellow-500 text-yellow-600 bg-yellow-50";
  if (score >= 0.3) return "border-orange-500 text-orange-600 bg-orange-50";
  return "border-red-500 text-red-600 bg-red-50";
};

const InsightBadge = ({ agents, confidenceScore, tooltip }) => {
  const style = getConfidenceStyle(confidenceScore);

  return (
    <div className={classNames("inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium", style)}>
      {confidenceScore < 0.5 ? <AlertCircle className="w-3 h-3 mr-1" /> : <Info className="w-3 h-3 mr-1" />}
      {confidenceScore && <span>{Math.round(confidenceScore * 100)}%</span>}

      {agents && agents.length > 0 && (
        <span className="ml-2 text-gray-500">
          {agents.map((agent, i) => (
            <span key={i} className="ml-1 italic">
              @{agent}
            </span>
          ))}
        </span>
      )}

      {tooltip && (
        <span className="ml-2 text-gray-400 italic">({tooltip})</span>
      )}
    </div>
  );
};

InsightBadge.propTypes = {
  agents: PropTypes.arrayOf(PropTypes.string),
  confidenceScore: PropTypes.number.isRequired,
  tooltip: PropTypes.string
};

export default InsightBadge;
