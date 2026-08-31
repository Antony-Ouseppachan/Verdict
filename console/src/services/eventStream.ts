import type { ConsoleEvent, ConsoleEventType, Investigation, PipelineStageId, PipelineStageInfo } from '../types/index.ts';

type EventListener = (event: ConsoleEvent) => void;
type InvestigationUpdateListener = (inv: Investigation) => void;

export class EventStreamService {
  private listeners: Set<EventListener> = new Set();
  private investigationListeners: Set<InvestigationUpdateListener> = new Set();
  private isConnected: boolean = true;

  public subscribeEvents(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeInvestigationUpdates(listener: InvestigationUpdateListener): () => void {
    this.investigationListeners.add(listener);
    return () => this.investigationListeners.delete(listener);
  }

  public emitEvent(event: ConsoleEvent): void {
    this.listeners.forEach((l) => l(event));
  }

  public emitInvestigationUpdate(inv: Investigation): void {
    this.investigationListeners.forEach((l) => l(inv));
  }

  public isStreamConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Runs an investigation through all 10 pipeline stages in real time,
   * emitting events and stage progress updates.
   */
  public async simulateRealtimeInvestigation(
    targetUrl: string,
    existingInv?: Investigation
  ): Promise<Investigation> {
    let hostname = '';
    try {
      hostname = new URL(targetUrl).hostname;
    } catch {
      hostname = targetUrl.replace(/https?:\/\//, '').split('/')[0] || 'target-domain.com';
    }

    const reqId = existingInv?.id || `req-2026-${Date.now().toString().slice(-6)}`;
    const now = Date.now();

    const stagesList: PipelineStageId[] = [
      'URL_RECEIVED',
      'FAST_ANALYSIS',
      'SANDBOX',
      'BEHAVIOR_ANALYSIS',
      'PAYMENT_ANALYSIS',
      'BRAND_ANALYSIS',
      'EVIDENCE_AGGREGATION',
      'AI_REASONING',
      'DECISION_POLICY',
      'EXTENSION_RESPONSE',
    ];

    const currentInv: Investigation = {
      id: reqId,
      url: targetUrl,
      hostname,
      createdAt: now,
      updatedAt: now,
      status: 'ANALYZING',
      currentStage: 'URL_RECEIVED',
      initiator: 'OPERATOR_REPLAY',
      tags: [],
      stages: stagesList.reduce((acc, stage) => {
        acc[stage] = {
          id: stage,
          name: stage.replace(/_/g, ' '),
          shortName: stage.slice(0, 8),
          status: 'PENDING',
        };
        return acc;
      }, {} as Record<PipelineStageId, PipelineStageInfo>),
    };

    this.emitInvestigationUpdate({ ...currentInv });

    const emitConsoleEvt = (type: ConsoleEventType, message: string, severity: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' = 'INFO') => {
      this.emitEvent({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        investigationId: reqId,
        type,
        timestamp: Date.now(),
        message,
        severity,
      });
    };

    emitConsoleEvt('REQUEST_RECEIVED', `Received URL inspection request for ${hostname}`);

    const stageDelays: Record<PipelineStageId, number> = {
      URL_RECEIVED: 100,
      FAST_ANALYSIS: 250,
      SANDBOX: 450,
      BEHAVIOR_ANALYSIS: 300,
      PAYMENT_ANALYSIS: 350,
      BRAND_ANALYSIS: 280,
      EVIDENCE_AGGREGATION: 200,
      AI_REASONING: 400,
      DECISION_POLICY: 200,
      EXTENSION_RESPONSE: 150,
    };

    for (const stage of stagesList) {
      currentInv.currentStage = stage;
      currentInv.stages[stage].status = 'RUNNING';
      currentInv.stages[stage].startedAt = Date.now();
      this.emitInvestigationUpdate({ ...currentInv });

      if (stage === 'FAST_ANALYSIS') emitConsoleEvt('ANALYSIS_STARTED', `Querying DNS & WHOIS reputation databases for ${hostname}`);
      if (stage === 'SANDBOX') emitConsoleEvt('SANDBOX_STARTED', `Dispatched headless sandbox container session on worker-node-01`);
      if (stage === 'PAYMENT_ANALYSIS') emitConsoleEvt('PAYMENT_DETECTED', `Inspecting checkout DOM iframes and payment gateway tokenization`);
      if (stage === 'BRAND_ANALYSIS') emitConsoleEvt('BRAND_DETECTED', `Calculating visual similarity and Levenshtein typo-distance`);
      if (stage === 'AI_REASONING') emitConsoleEvt('AI_ANALYSIS_STARTED', `Autonomous AI Investigator evaluating multi-vector evidence matrix`);

      await new Promise((resolve) => setTimeout(resolve, stageDelays[stage]));

      const stageEndTime = Date.now();
      currentInv.stages[stage].status = 'COMPLETED';
      currentInv.stages[stage].completedAt = stageEndTime;
      currentInv.stages[stage].durationMs = stageEndTime - (currentInv.stages[stage].startedAt || stageEndTime);
      this.emitInvestigationUpdate({ ...currentInv });
    }

    const isDanger = targetUrl.includes('cheap') || targetUrl.includes('outlet') || targetUrl.includes('scam') || targetUrl.includes('phishing');
    const isCaution = targetUrl.includes('new') || targetUrl.includes('boutique') || targetUrl.includes('unverified');

    currentInv.status = 'COMPLETED';
    currentInv.completedAt = Date.now();
    currentInv.durationMs = currentInv.completedAt - currentInv.createdAt;
    currentInv.verdict = isDanger ? 'DANGER' : isCaution ? 'CAUTION' : 'SAFE';
    currentInv.threatScore = isDanger ? 94 : isCaution ? 52 : 2;
    currentInv.confidence = isDanger ? 99 : isCaution ? 88 : 100;
    currentInv.tags = isDanger ? ['Counterfeit Shop', 'Brand Impersonation'] : isCaution ? ['Unverified Merchant'] : ['Verified Brand'];

    emitConsoleEvt('VERDICT_GENERATED', `Verdict generated: ${currentInv.verdict} (Score: ${currentInv.threatScore}/100)`, isDanger ? 'ERROR' : isCaution ? 'WARN' : 'SUCCESS');
    emitConsoleEvt('EXTENSION_NOTIFIED', `Extension client acknowledged policy enforcement advisory`, 'SUCCESS');

    this.emitInvestigationUpdate({ ...currentInv });
    return currentInv;
  }
}

export const eventStream = new EventStreamService();
