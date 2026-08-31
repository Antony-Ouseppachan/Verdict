import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  iconColor?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'var(--text-muted)',
}) => {
  return (
    <div className="card">
      <div className="card-title">
        <span>{title}</span>
        {Icon && <Icon size={18} color={iconColor} aria-hidden="true" />}
      </div>
      <div className="card-value">{value}</div>
      {subtext && <div className="card-subtext">{subtext}</div>}
    </div>
  );
};
