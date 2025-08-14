import React from "react";
import PropTypes from "prop-types";
import { AlertTriangle, ThumbsUp, HelpCircle } from "lucide-react";
import classNames from "classnames";

const opinionStyles = {
  AGREE: "border-green-500 bg-green-50 text-green-700",
  DISAGREE: "border-red-500 bg-red-50 text-red-700",
  NEUTRAL: "border-yellow-500 bg-yellow-50 text-yellow-700",
};

const iconMap = {
  AGREE: ThumbsUp,
  DISAGREE: AlertTriangle,
  NEUTRAL: HelpCircle,
};

const DebateLog = ({ entries }) => {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {entries.map((entry, index) => {
        const { agent, opinion, rationale } = entry;
        const Icon = iconMap[opinion] || HelpCircle;
        const style = opinionStyles[opinion] || opinionStyles.NEUTRAL;

        return (
          <div
            key={index}
            className={classNames(
              "flex items-start gap-2 p-2 border-l-4 rounded-md shadow-sm",
              style
            )}
          >
            <Icon className="w-4 h-4 mt-1 flex-shrink-0" />
            <div className="text-sm leading-snug">
              <p>
                <span className="font-semibold">{agent}</span>{" "}
                <span className="italic">({opinion})</span>
              </p>
              <p className="text-gray-800">{rationale}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

DebateLog.propTypes = {
  entries: PropTypes.arrayOf(
    PropTypes.shape({
      agent: PropTypes.string.isRequired,
      opinion: PropTypes.oneOf(["AGREE", "DISAGREE", "NEUTRAL"]).isRequired,
      rationale: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default DebateLog;
