import React from 'react';
import { RotateCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onRefresh }) => {
  return (
    <header className="dashboard-header">
      <div className="header-title-group">
        <h1 className="header-title">{title}</h1>
        <span className="header-subtitle">{subtitle}</span>
      </div>

      {onRefresh && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRefresh}
          aria-label="Refresh Dashboard data"
        >
          <RotateCw size={14} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      )}
    </header>
  );
};
