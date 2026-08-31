import { Router, type Request, type Response } from 'express';
import type { AnalyzePayload, VerdictDecision } from '../types.js';

export const analyzeRouter = Router();

export interface RecordedInvestigation {
  id: string;
  url: string;
  hostname: string;
  timestamp: number;
  decision: VerdictDecision;
  threatScore: number;
  initiator: string;
}

const recentInvestigations: RecordedInvestigation[] = [];

export function evaluateVerdict(url: string, hostname: string): { decision: VerdictDecision; threatScore: number } {
  const normalizedUrl = (url || '').toLowerCase();
  const normalizedHost = (hostname || '').toLowerCase();
  const combined = `${normalizedHost} ${normalizedUrl}`;

  // Localhost development exception
  if (
    normalizedHost === 'localhost' ||
    normalizedHost === '127.0.0.1' ||
    normalizedHost === '0.0.0.0' ||
    normalizedHost === '[::1]' ||
    normalizedHost.endsWith('.local') ||
    normalizedHost.endsWith('.localhost') ||
    normalizedUrl.includes('localhost:') ||
    normalizedUrl.includes('127.0.0.1:')
  ) {
    return {
      threatScore: 0,
      decision: {
        status: 'SAFE',
        title: 'Local Development Environment',
        message: 'Localhost and private development servers are exempt from threat scanning.',
        action: 'NONE',
        decisionId: `dec-local-${Date.now()}`,
        timestamp: Date.now(),
      },
    };
  }

  // Danger triggers
  if (
    combined.includes('danger') ||
    combined.includes('phishing') ||
    combined.includes('fake-shop') ||
    combined.includes('scam') ||
    combined.includes('malicious') ||
    combined.includes('counterfeit') ||
    combined.includes('cheap') ||
    combined.includes('outlet')
  ) {
    return {
      threatScore: 92,
      decision: {
        status: 'DANGER',
        title: "Don't pay here",
        message: 'This looks like a fake shop. Your money may not be safe.',
        action: 'GO_BACK',
        explanationAvailable: true,
        decisionId: `dec-danger-${Date.now()}`,
        timestamp: Date.now(),
      },
    };
  }

  // Caution triggers
  if (
    combined.includes('caution') ||
    combined.includes('suspicious') ||
    combined.includes('unverified') ||
    combined.includes('untrusted') ||
    combined.includes('new-shop')
  ) {
    return {
      threatScore: 48,
      decision: {
        status: 'CAUTION',
        title: 'Be careful here',
        message: "This shop is very new and we couldn't verify who operates it.",
        action: 'WARN',
        explanationAvailable: true,
        decisionId: `dec-caution-${Date.now()}`,
        timestamp: Date.now(),
      },
    };
  }

  // Safe default
  return {
    threatScore: 2,
    decision: {
      status: 'SAFE',
      title: 'Safe',
      message: 'No threat detected.',
      action: 'NONE',
      decisionId: `dec-safe-${Date.now()}`,
      timestamp: Date.now(),
    },
  };
}

analyzeRouter.post('/v1/analyze', (req: Request, res: Response) => {
  const body = req.body as AnalyzePayload;

  const url = body.url || body.signals?.page?.url || 'https://unknown-target.com';
  let hostname = body.hostname || body.signals?.page?.hostname || '';
  if (!hostname && url) {
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = url.replace(/https?:\/\//, '').split('/')[0] || 'unknown-target.com';
    }
  }

  const { decision, threatScore } = evaluateVerdict(url, hostname);
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost') ||
    url.includes('localhost:') ||
    url.includes('127.0.0.1:');

  // Store in live buffer only for external targets (completely avoid localhost)
  if (!isLocalhost) {
    const item: RecordedInvestigation = {
      id: requestId,
      url,
      hostname,
      timestamp: Date.now(),
      decision,
      threatScore,
      initiator: 'BROWSER_EXTENSION',
    };

    recentInvestigations.unshift(item);
    if (recentInvestigations.length > 200) {
      recentInvestigations.pop();
    }
  }

  res.json({
    status: decision.status,
    title: decision.title,
    message: decision.message,
    action: decision.action,
    decision,
    requestId,
    cached: false,
  });
});

analyzeRouter.get('/v1/investigations', (_req: Request, res: Response) => {
  res.json({
    investigations: recentInvestigations,
    total: recentInvestigations.length,
  });
});

analyzeRouter.delete('/v1/investigations', (_req: Request, res: Response) => {
  recentInvestigations.length = 0;
  res.json({ success: true, count: 0 });
});
