import React from 'react';

interface RiskGaugeProps {
  score: number; // 0 - 100
  size?: number;
  showLabel?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, size = 90, showLabel = true }) => {
  const getStrokeColor = (val: number) => {
    if (val >= 70) return '#ef4444';
    if (val >= 35) return '#f59e0b';
    return '#10b981';
  };

  const strokeColor = getStrokeColor(score);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  return (
    <div className="console-risk-gauge" style={{ width: size, height: size }}>
      <svg className="console-gauge-svg" viewBox="0 0 100 100">
        <circle
          className="console-gauge-track"
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          className="console-gauge-fill"
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="8"
          fill="transparent"
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="console-gauge-center">
        <span className="console-gauge-score" style={{ color: strokeColor }}>
          {score}
        </span>
        {showLabel && <span className="console-gauge-label">RISK</span>}
      </div>
    </div>
  );
};
