import React from 'react';
import {
  Server,
  Layers,
  Cpu,
  ShieldAlert,
  Globe,
  CreditCard,
  Clock,
  Terminal,
} from 'lucide-react';

const OPERATOR_MODULES = [
  {
    name: 'Sandbox Queue & Sessions',
    desc: 'Incoming sandboxing requests, active sessions, and container orchestration.',
    icon: Layers,
  },
  {
    name: 'Detection Pipeline',
    desc: 'Multi-stage static, behavioral, and ML heuristic detection engines.',
    icon: Cpu,
  },
  {
    name: 'Domain & Reputation Analysis',
    desc: 'WHOIS, TLS cert chains, DNS heuristics, and domain age intelligence.',
    icon: Globe,
  },
  {
    name: 'Payment & Checkout Inspection',
    desc: 'Gateway validation, token interception checks, and fake merchant analysis.',
    icon: CreditCard,
  },
  {
    name: 'Brand & Impersonation Spoofing',
    desc: 'Visual similarity, logo matching, and brand typo-squatting detection.',
    icon: ShieldAlert,
  },
  {
    name: 'AI Reasoning & Verdict Decisions',
    desc: 'LLM explanation generation, threat probability, and verdict classification.',
    icon: Server,
  },
  {
    name: 'Latency & System Health',
    desc: 'P95/P99 latency tracking, throughput, and worker cluster metrics.',
    icon: Clock,
  },
  {
    name: 'Errors & Operational Logs',
    desc: 'Real-time telemetry stream, failed inspections, and exception tracebacks.',
    icon: Terminal,
  },
];

export const OperatorStatus: React.FC = () => {
  return (
    <div className="console-placeholder-card">
      <h1 className="console-title">Verdict Intelligence Infrastructure</h1>
      <p className="console-subtitle">
        Operator and Developer Console foundation for monitoring autonomous sandboxing sessions,
        detection pipelines, brand verification, and system telemetry.
      </p>

      <div className="console-modules-grid">
        {OPERATOR_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <div key={mod.name} className="console-module-item">
              <div className="console-module-name">
                <Icon size={16} color="#94a3b8" />
                <span>{mod.name}</span>
              </div>
              <p className="console-module-desc">{mod.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
