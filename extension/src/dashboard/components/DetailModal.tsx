import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { ProtectionEventItem } from '../../shared/types/decision.ts';

interface DetailModalProps {
  event: ProtectionEventItem;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ event, onClose }) => {
  const [showTechnical, setShowTechnical] = useState(false);

  const statusIcon =
    event.status === 'DANGER' ? (
      <ShieldAlert size={20} color="var(--color-danger)" />
    ) : event.status === 'CAUTION' ? (
      <AlertTriangle size={20} color="var(--color-caution)" />
    ) : (
      <ShieldCheck size={20} color="var(--color-safe)" />
    );

  const defaultReasons =
    event.status === 'DANGER'
      ? [
          'The domain mimics a known brand or established merchant.',
          'The checkout form lacks verifiable merchant authentication credentials.',
        ]
      : event.status === 'CAUTION'
        ? [
            'This domain was registered very recently.',
            'We were unable to verify the legal business identity of this shop.',
          ]
        : ['The site domain is verified and presents standard secure transaction practices.'];

  const defaultRecommendation =
    event.status === 'DANGER'
      ? 'Do not submit credit cards, passwords, or personal identity information here.'
      : event.status === 'CAUTION'
        ? 'Exercise caution. Look for verifiable contact information before paying.'
        : 'Safe to proceed with normal browsing and checkout.';

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-event-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {statusIcon}
            <h2 className="modal-title" id="modal-event-title">
              {event.hostname}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close detail modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* What Happened */}
        <div className="detail-section">
          <span className="detail-section-title">What Happened</span>
          <div className="detail-section-body">
            <strong>Verdict Status: {event.title}</strong>
            <p style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
              {event.message}
            </p>
          </div>
        </div>

        {/* Why Verdict Warned You */}
        <div className="detail-section">
          <span className="detail-section-title">What Verdict Noticed</span>
          <div className="detail-section-body">
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(event.reasons || defaultReasons).map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* What You Should Do */}
        <div className="detail-section">
          <span className="detail-section-title">What You Should Do</span>
          <div className="detail-section-body" style={{ borderColor: event.status === 'DANGER' ? 'var(--color-danger-border)' : 'var(--border-subtle)' }}>
            {event.recommendation || defaultRecommendation}
          </div>
        </div>

        {/* Optional Technical Details */}
        <div className="detail-section">
          <button
            type="button"
            className="tech-details-toggle"
            onClick={() => setShowTechnical(!showTechnical)}
            aria-expanded={showTechnical}
          >
            <span>Technical Details (Advanced)</span>
            {showTechnical ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showTechnical && (
            <div className="tech-details-content">
              <div>Request ID: {event.technicalDetails?.requestId || 'N/A'}</div>
              <div>Protocol: {event.technicalDetails?.protocol || 'https:'}</div>
              <div>Decision Engine: {event.technicalDetails?.detectionEngine || 'Verdict Cloud v1'}</div>
              <div>Action Taken: {event.actionTaken}</div>
              <div>Timestamp: {new Date(event.timestamp).toISOString()}</div>
              <div>Full URL: {event.url}</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
