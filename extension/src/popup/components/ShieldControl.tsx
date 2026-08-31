import React, { useState } from 'react';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { t } from '../../shared/utils/i18n.ts';

interface ShieldControlProps {
  enabled: boolean;
  onToggle: (newState: boolean) => Promise<void> | void;
  disabled?: boolean;
}

export const ShieldControl: React.FC<ShieldControlProps> = ({
  enabled,
  onToggle,
  disabled = false,
}) => {
  const [transitioning, setTransitioning] = useState<'connecting' | 'disconnecting' | null>(null);

  const handleClick = async () => {
    if (disabled || transitioning) return;

    if (enabled) {
      setTransitioning('disconnecting');
      setTimeout(async () => {
        await onToggle(false);
        setTransitioning(null);
      }, 300);
    } else {
      setTransitioning('connecting');
      setTimeout(async () => {
        await onToggle(true);
        setTransitioning(null);
      }, 300);
    }
  };

  const isConnected = enabled && !transitioning;
  const isDisconnected = !enabled && !transitioning;

  const getStatusLabel = () => {
    if (transitioning === 'connecting') return t('popup', 'connecting');
    if (transitioning === 'disconnecting') return t('popup', 'disconnecting');
    if (enabled) return t('popup', 'connected');
    return t('popup', 'disconnected');
  };

  const getStatusDescription = () => {
    if (transitioning === 'connecting') return 'Establishing secure connection...';
    if (transitioning === 'disconnecting') return 'Pausing background protection...';
    if (enabled) return t('popup', 'statusActive');
    return t('popup', 'statusInactive');
  };

  return (
    <div className="verdict-shield-container">
      <button
        type="button"
        className={`verdict-shield-btn ${
          isConnected
            ? 'is-connected'
            : isDisconnected
              ? 'is-disconnected'
              : 'is-transitioning'
        }`}
        onClick={handleClick}
        disabled={disabled || transitioning !== null}
        aria-label={`Verdict protection: ${getStatusLabel()}. Click to toggle.`}
        role="switch"
        aria-checked={enabled}
      >
        <div className="verdict-shield-icon-wrapper">
          <Shield
            size={52}
            className="verdict-main-shield"
            strokeWidth={1.75}
          />
          <div className="verdict-shield-badge" aria-hidden="true">
            {transitioning ? (
              <Loader2 size={16} className="verdict-spinner" />
            ) : enabled ? (
              <Check size={16} strokeWidth={2.75} />
            ) : (
              <X size={16} strokeWidth={2.75} />
            )}
          </div>
        </div>
      </button>

      <div className="verdict-shield-text-group">
        <h2 className="verdict-shield-status-title">{getStatusLabel()}</h2>
        <p className="verdict-shield-status-desc">{getStatusDescription()}</p>
      </div>
    </div>
  );
};
