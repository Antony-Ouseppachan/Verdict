import React from 'react';
import { Laptop, CheckCircle, Shield } from 'lucide-react';

interface DeviceCardProps {
  deviceName: string;
  platform: string;
  isCurrentDevice: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'SYNCING';
  lastSeen: string;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  deviceName,
  platform,
  isCurrentDevice,
  status,
  lastSeen,
}) => {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-brand)',
          }}
          aria-hidden="true"
        >
          <Laptop size={22} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {deviceName}
            </span>
            {isCurrentDevice && (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--color-safe)',
                  border: '1px solid var(--color-safe-border)',
                }}
              >
                This Device
              </span>
            )}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            {platform} • Last active {lastSeen}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {status === 'ACTIVE' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-safe)', fontSize: 'var(--font-size-xs)', fontWeight: 500 }}>
            <CheckCircle size={16} />
            <span>Protection Active</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>
            <Shield size={16} />
            <span>Paused</span>
          </div>
        )}
      </div>
    </div>
  );
};
