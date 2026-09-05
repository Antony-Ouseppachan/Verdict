import React, { useEffect } from 'react';
import { X, Cpu, FileCode, Layers, Gauge } from 'lucide-react';
import type { HealthResponse } from '../types';

interface ModelDetailModalProps {
  modelId: string | null;
  health: HealthResponse | null;
  isHealthy: boolean;
  onClose: () => void;
}

interface ModelInfo {
  id: string;
  name: string;
  shortName: string;
  file: string;
  algorithm: string;
  features: string;
  focus: string;
  metricLabel: string;
  metricValue: string;
  extraMetrics?: { label: string; value: string }[];
}

const MODEL_SPECS: Record<string, ModelInfo> = {
  url_svm: {
    id: 'url_svm',
    name: 'URL Phishing Intelligence',
    shortName: 'URL SVM',
    file: 'url_phishing_svm.joblib',
    algorithm: 'Linear Support Vector Classifier (LinearSVC)',
    features: '300,000 Character n-gram TF-IDF Vectors (3-5 chars)',
    focus: 'Lexical analysis of typosquatting, brand impersonation, suspicious TLDs, and path obfuscation.',
    metricLabel: 'ROC-AUC',
    metricValue: '0.9923',
    extraMetrics: [
      { label: 'Vectorizer', value: 'url_tfidf_vectorizer.joblib' },
      { label: 'Type', value: 'Character Sub-words' },
    ],
  },
  html_xgboost: {
    id: 'html_xgboost',
    name: 'Page Structural Intelligence',
    shortName: 'HTML XGB v2',
    file: 'html_phishing_xgboost_v2.joblib',
    algorithm: 'Extreme Gradient Boosting (XGBClassifier V2)',
    features: '56 Static DOM Structural & Security Features',
    focus: 'Detects deceptive HTML forms, external action URLs, credential harvesting inputs, and hidden iframes.',
    metricLabel: 'ROC-AUC',
    metricValue: '0.9910',
    extraMetrics: [
      { label: 'DOM Nodes', value: 'Forms, Inputs, Scripts' },
      { label: 'Feature Count', value: '56 Features' },
    ],
  },
  payment_xgboost: {
    id: 'payment_xgboost',
    name: 'Payment Surface Intelligence',
    shortName: 'PAYMENT XGB',
    file: 'payment_risk_xgboost.joblib',
    algorithm: 'Extreme Gradient Boosting (XGBClassifier)',
    features: '35 Payment-Specific Feature Vectors',
    focus: 'Identifies credit card fields, CVV, expiry inputs, UPI handles, OTP interception, and fake gateways.',
    metricLabel: 'ROC-AUC',
    metricValue: '0.9376',
    extraMetrics: [
      { label: 'Gateways', value: 'Stripe, PayPal, Razorpay' },
      { label: 'Sensitivity', value: 'High (Payment Flow)' },
    ],
  },
  risk_engine: {
    id: 'risk_engine',
    name: 'Calibrated Risk Fusion Engine',
    shortName: 'RISK FUSION',
    file: 'risk_engine_fusion.joblib',
    algorithm: 'Calibrated Logistic Regression Classifier',
    features: 'Multi-Model Weighted Probability Fusion (3 Core Vectors)',
    focus: 'Blends URL SVM, HTML XGBoost, and Payment XGBoost scores to output the unified 0-100% Verdict score.',
    metricLabel: 'ROC-AUC',
    metricValue: '0.9964',
    extraMetrics: [
      { label: 'Precision', value: '99.1%' },
      { label: 'Recall', value: '97.8%' },
      { label: 'F1 Score', value: '98.4%' },
    ],
  },
};

export const ModelDetailModal: React.FC<ModelDetailModalProps> = ({
  modelId,
  health,
  isHealthy,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!modelId || !MODEL_SPECS[modelId]) return null;

  const info = MODEL_SPECS[modelId];
  const isLoaded = isHealthy && (health?.modelsLoaded ?? false);

  return (
    <div className="soc-modal-overlay" onClick={onClose}>
      <div className="soc-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="soc-modal-header">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-emerald-400" />
            <h3 className="soc-modal-title font-mono">{info.name}</h3>
          </div>
          <button className="soc-modal-close" onClick={onClose} title="Close (Esc)">
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="soc-modal-body">
          {/* Status Badge Row */}
          <div className="flex items-center justify-between p-2 bg-[#06090F] border border-[#141C29] rounded mb-3">
            <div className="flex items-center gap-2">
              <span className={`status-dot ${isLoaded ? 'online' : 'error'}`} />
              <span className="font-mono text-xs text-primary font-bold">{info.shortName}</span>
            </div>
            <span className="font-mono text-xs text-emerald-400 font-bold">
              {isLoaded ? 'ACTIVE / LOADED' : 'OFFLINE'}
            </span>
          </div>

          {/* Key Details Matrix */}
          <div className="space-y-2.5 text-xs">
            <div className="modal-info-row">
              <div className="modal-info-label font-mono">
                <FileCode size={12} className="text-emerald-400" />
                <span>MODEL FILE</span>
              </div>
              <span className="modal-info-val font-mono text-emerald-400 font-semibold">{info.file}</span>
            </div>

            <div className="modal-info-row">
              <div className="modal-info-label font-mono">
                <Cpu size={12} className="text-emerald-400" />
                <span>ALGORITHM</span>
              </div>
              <span className="modal-info-val font-mono text-primary">{info.algorithm}</span>
            </div>

            <div className="modal-info-row">
              <div className="modal-info-label font-mono">
                <Layers size={12} className="text-emerald-400" />
                <span>FEATURES</span>
              </div>
              <span className="modal-info-val font-mono text-secondary">{info.features}</span>
            </div>

            <div className="modal-info-row">
              <div className="modal-info-label font-mono">
                <Gauge size={12} className="text-emerald-400" />
                <span>{info.metricLabel}</span>
              </div>
              <span className="modal-info-val font-mono text-emerald-400 font-bold">{info.metricValue}</span>
            </div>

            {/* Extra Metrics if available */}
            {info.extraMetrics && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#141C29]">
                {info.extraMetrics.map((m, idx) => (
                  <div key={idx} className="bg-[#06090F] border border-[#141C29] p-2 rounded text-center">
                    <div className="text-[10px] font-mono text-muted uppercase">{m.label}</div>
                    <div className="text-xs font-mono text-primary font-bold mt-0.5">{m.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Purpose / Detection Scope */}
            <div className="bg-[#06090F] border border-[#141C29] p-2.5 rounded mt-3">
              <div className="text-[10px] font-mono font-bold text-muted uppercase mb-1">DETECTION FOCUS</div>
              <div className="text-xs text-secondary leading-relaxed">{info.focus}</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="soc-modal-footer font-mono">
          <span className="text-muted text-[10px]">D:\BCA\Verdict\models\{info.file}</span>
          <button className="soc-modal-btn-dismiss" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
