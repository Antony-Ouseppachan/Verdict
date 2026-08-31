import React from 'react';
import { Shield, PlusCircle, ExternalLink } from 'lucide-react';
import { env } from '../../config/environment.ts';
import { DeviceCard } from '../components/DeviceCard.tsx';

interface DevicesPageProps {
  protectionEnabled: boolean;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({ protectionEnabled }) => {
  const handleFamilyShieldClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: `${env.webUrl}/family-shield` });
    } else {
      window.open(`${env.webUrl}/family-shield`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="dashboard-page-content">
      {/* 1. Connected Devices List */}
      <div className="section-header" style={{ marginTop: 0 }}>
        <h2 className="section-title">Enrolled Devices</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <DeviceCard
          deviceName="Primary Chrome Browser"
          platform="Desktop • Chrome Extension MV3"
          isCurrentDevice={true}
          status={protectionEnabled ? 'ACTIVE' : 'PAUSED'}
          lastSeen="Active now"
        />
      </div>

      {/* 2. Family Shield & Multi-Device Card */}
      <div
        className="card"
        style={{
          marginTop: '16px',
          background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-card-subtle) 100%)',
          border: '1px dashed var(--border-card-hover)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid var(--color-safe-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-safe)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <Shield size={20} />
            </div>

            <div>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Verdict Family Shield & Multi-Device Sync
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '540px', lineHeight: 1.5 }}>
                Protect household devices, phones, and family members under a single unified dashboard. Sync threat intelligence across all endpoints in real-time.
              </p>
            </div>
          </div>

          <a
            href={`${env.webUrl}/family-shield`}
            onClick={handleFamilyShieldClick}
            className="btn btn-primary"
            style={{ fontSize: 'var(--font-size-xs)', flexShrink: 0 }}
          >
            <PlusCircle size={14} />
            <span>Connect New Device</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};
