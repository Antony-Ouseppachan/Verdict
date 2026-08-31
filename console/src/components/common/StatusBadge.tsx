import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, Activity } from 'lucide-react';

interface StatusBadgeProps {
  status: 'SAFE' | 'CAUTION' | 'DANGER' | 'QUEUED' | 'ANALYZING' | 'COMPLETED' | 'FAILED' | 'VERIFIED' | 'SUSPICIOUS' | 'UNVERIFIED' | 'NOT_DETECTED';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getIcon = () => {
    switch (status) {
      case 'DANGER':
      case 'FAILED':
      case 'SUSPICIOUS':
        return <ShieldAlert size={size === 'sm' ? 11 : 13} />;
      case 'CAUTION':
      case 'UNVERIFIED':
        return <AlertTriangle size={size === 'sm' ? 11 : 13} />;
      case 'SAFE':
      case 'COMPLETED':
      case 'VERIFIED':
        return <CheckCircle2 size={size === 'sm' ? 11 : 13} />;
      case 'ANALYZING':
        return <Activity size={size === 'sm' ? 11 : 13} className="animate-spin" />;
      case 'QUEUED':
      case 'NOT_DETECTED':
      default:
        return <Clock size={size === 'sm' ? 11 : 13} />;
    }
  };

  return (
    <span className={`console-status-badge status-${status.toLowerCase()} size-${size}`}>
      {getIcon()}
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  );
};
