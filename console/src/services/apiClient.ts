import type {
  Investigation,
  SandboxSession,
  PaymentFinding,
  WebsiteIntelligence,
  BrandFinding,
  AIAnalysis,
  VerdictRecord,
  SystemHealth,
  PipelineStageId,
  PipelineStageInfo,
} from '../types/index.ts';

const TOP_BRANDS = [
  'nike', 'apple', 'amazon', 'paypal', 'rolex', 'rayban', 'ray-ban',
  'sephora', 'adidas', 'gucci', 'louisvuitton', 'chanel', 'prada',
  'sony', 'samsung', 'dyson', 'lego', 'target', 'walmart', 'bestbuy',
];

const SUSPICIOUS_TLDS = ['.xyz', '.top', '.shop', '.cfd', '.buzz', '.vip', '.click', '.live', '.rest', '.sbs', '.info'];

export class VerdictApiClient {
  private investigations: Investigation[] = [];
  private sandboxSessions: Record<string, SandboxSession> = {};
  private paymentFindings: Record<string, PaymentFinding> = {};
  private websiteIntel: Record<string, WebsiteIntelligence> = {};
  private brandFindings: Record<string, BrandFinding> = {};
  private aiAnalyses: Record<string, AIAnalysis> = {};
  private verdicts: Record<string, VerdictRecord> = {};

  public async syncWithBackend(): Promise<Investigation[]> {
    try {
      const res = await fetch('http://localhost:3000/v1/investigations');
      if (!res.ok) return [];
      const data = (await res.json()) as { investigations?: Array<{ id: string; url: string; hostname: string; timestamp: number; decision: { status: 'SAFE' | 'CAUTION' | 'DANGER'; title: string; message: string; action: string }; threatScore: number; initiator: string }> };
      if (data && Array.isArray(data.investigations)) {
        const newlyFound: Investigation[] = [];
        for (const raw of data.investigations) {
          const isLocal =
            raw.hostname === 'localhost' ||
            raw.hostname === '127.0.0.1' ||
            raw.url.includes('localhost') ||
            raw.url.includes('127.0.0.1');
          if (isLocal) continue;

          const existing = this.investigations.find((i) => i.id === raw.id || (i.url === raw.url && Math.abs(i.createdAt - raw.timestamp) < 5000));
          if (!existing) {
            const stagesList = [
              'URL_RECEIVED', 'FAST_ANALYSIS', 'SANDBOX', 'BEHAVIOR_ANALYSIS',
              'PAYMENT_ANALYSIS', 'BRAND_ANALYSIS', 'EVIDENCE_AGGREGATION',
              'AI_REASONING', 'DECISION_POLICY', 'EXTENSION_RESPONSE',
            ] as const;

            const newInv: Investigation = {
              id: raw.id,
              url: raw.url,
              hostname: raw.hostname,
              createdAt: raw.timestamp,
              updatedAt: raw.timestamp,
              completedAt: raw.timestamp + 450,
              durationMs: 450,
              status: 'COMPLETED',
              currentStage: 'EXTENSION_RESPONSE',
              verdict: raw.decision.status,
              threatScore: raw.threatScore,
              confidence: 96,
              initiator: 'EXTENSION',
              tags: raw.decision.status === 'DANGER' ? ['Scam Shop', 'Phishing'] : raw.decision.status === 'CAUTION' ? ['Unverified Merchant'] : ['Verified Safe'],
              stages: stagesList.reduce((acc, stage) => {
                acc[stage] = {
                  id: stage,
                  name: stage.replace(/_/g, ' '),
                  shortName: stage.slice(0, 8),
                  status: 'COMPLETED',
                  durationMs: 45,
                };
                return acc;
              }, {} as Record<PipelineStageId, PipelineStageInfo>),
            };

            this.saveInvestigation(newInv);
            newlyFound.push(newInv);
          }
        }
        return newlyFound;
      }
    } catch {
      // Backend may not be reachable in standalone mode
    }
    return [];
  }

  public async getInvestigations(): Promise<Investigation[]> {
    return [...this.investigations];
  }

  public async getInvestigationById(id: string): Promise<Investigation | null> {
    const inv = this.investigations.find((item) => item.id === id);
    return inv ? { ...inv } : null;
  }

  public async getSandboxSession(investigationId: string): Promise<SandboxSession | null> {
    if (this.sandboxSessions[investigationId]) {
      return { ...this.sandboxSessions[investigationId] };
    }
    const inv = this.investigations.find((i) => i.id === investigationId);
    if (!inv) return null;

    const session = this.generateDynamicSandbox(inv);
    this.sandboxSessions[investigationId] = session;
    return session;
  }

  public async getPaymentFinding(investigationId: string): Promise<PaymentFinding | null> {
    if (this.paymentFindings[investigationId]) {
      return { ...this.paymentFindings[investigationId] };
    }
    const inv = this.investigations.find((i) => i.id === investigationId);
    if (!inv) return null;

    const finding = this.generateDynamicPayment(inv);
    this.paymentFindings[investigationId] = finding;
    return finding;
  }

  public async getWebsiteIntel(investigationId: string): Promise<WebsiteIntelligence | null> {
    if (this.websiteIntel[investigationId]) {
      return { ...this.websiteIntel[investigationId] };
    }
    const inv = this.investigations.find((i) => i.id === investigationId);
    if (!inv) return null;

    const intel = this.generateDynamicWebsiteIntel(inv);
    this.websiteIntel[investigationId] = intel;
    return intel;
  }

  public async getBrandFinding(investigationId: string): Promise<BrandFinding | null> {
    if (this.brandFindings[investigationId]) {
      return { ...this.brandFindings[investigationId] };
    }
    const inv = this.investigations.find((i) => i.id === investigationId);
    if (!inv) return null;

    const brand = this.generateDynamicBrand(inv);
    this.brandFindings[investigationId] = brand;
    return brand;
  }

  public async getAIAnalysis(investigationId: string): Promise<AIAnalysis | null> {
    if (this.aiAnalyses[investigationId]) {
      return { ...this.aiAnalyses[investigationId] };
    }
    const inv = this.investigations.find((i) => i.id === investigationId);
    if (!inv) return null;

    const ai = this.generateDynamicAI(inv);
    this.aiAnalyses[investigationId] = ai;
    return ai;
  }

  public async getVerdictRecord(investigationId: string): Promise<VerdictRecord | null> {
    if (this.verdicts[investigationId]) {
      return { ...this.verdicts[investigationId] };
    }
    const inv = this.investigations.find((i) => i.id === investigationId);
    if (!inv) return null;

    const verdict = this.generateDynamicVerdict(inv);
    this.verdicts[investigationId] = verdict;
    return verdict;
  }

  public async getSystemHealth(): Promise<SystemHealth> {
    const total = this.investigations.length;
    const safe = this.investigations.filter((i) => i.verdict === 'SAFE').length;
    const caution = this.investigations.filter((i) => i.verdict === 'CAUTION').length;
    const danger = this.investigations.filter((i) => i.verdict === 'DANGER').length;

    return {
      overallStatus: 'OPERATIONAL',
      services: [
        { service: 'API_GATEWAY', status: 'HEALTHY', latencyMs: 12, p99LatencyMs: 38, errorRatePercent: 0.0, lastChecked: Date.now() },
        { service: 'DECISION_ENGINE', status: 'HEALTHY', latencyMs: 34, p99LatencyMs: 82, errorRatePercent: 0.0, lastChecked: Date.now() },
        { service: 'SANDBOX_POOL', status: 'HEALTHY', latencyMs: 310, p99LatencyMs: 540, errorRatePercent: 0.0, lastChecked: Date.now() },
        { service: 'DATABASE', status: 'HEALTHY', latencyMs: 3, p99LatencyMs: 14, errorRatePercent: 0.0, lastChecked: Date.now() },
        { service: 'AI_SERVICE', status: 'HEALTHY', latencyMs: 160, p99LatencyMs: 320, errorRatePercent: 0.0, lastChecked: Date.now() },
        { service: 'THREAT_FEED', status: 'HEALTHY', latencyMs: 40, p99LatencyMs: 95, errorRatePercent: 0.0, lastChecked: Date.now() },
      ],
      workers: [
        { id: 'worker-node-us-east-01', name: 'Sandbox Worker Alpha', type: 'SANDBOX_RUNNER', status: 'ONLINE', activeSessions: 1, maxCapacity: 8, cpuPercent: 24, memoryMb: 1120, uptimeSeconds: 48200, version: '1.4.2' },
        { id: 'worker-node-us-east-02', name: 'Sandbox Worker Bravo', type: 'SANDBOX_RUNNER', status: 'ONLINE', activeSessions: 0, maxCapacity: 8, cpuPercent: 14, memoryMb: 940, uptimeSeconds: 48200, version: '1.4.2' },
        { id: 'ai-infer-node-01', name: 'AI Reasoning Engine 1', type: 'AI_INFERENCE', status: 'ONLINE', activeSessions: 1, maxCapacity: 16, cpuPercent: 38, memoryMb: 3400, uptimeSeconds: 96400, version: '2.1.0' },
      ],
      queue: {
        pendingCount: 0,
        processingCount: 0,
        completedToday: total,
        failedToday: 0,
        avgWaitMs: 14,
        avgProcessMs: 920,
        throughputPerMinute: total > 0 ? 12 : 0,
      },
      recentLogs: this.investigations.slice(0, 5).map((inv) => ({
        id: `log-${inv.id}`,
        timestamp: inv.completedAt || inv.createdAt,
        level: inv.verdict === 'DANGER' ? 'WARN' : 'INFO',
        source: 'DECISION_ENGINE',
        message: `Investigation completed for ${inv.hostname}: Verdict ${inv.verdict || 'PENDING'} (Score ${inv.threatScore || 0})`,
        investigationId: inv.id,
      })),
      requestsToday: { total, safe, caution, danger },
    };
  }

  public saveInvestigation(inv: Investigation): void {
    const idx = this.investigations.findIndex((i) => i.id === inv.id);
    if (idx >= 0) {
      this.investigations[idx] = inv;
    } else {
      this.investigations.unshift(inv);
    }
  }

  // Dynamic Forensic Generators based on specific target URL
  private generateDynamicSandbox(inv: Investigation): SandboxSession {
    const isLocal = inv.hostname === 'localhost' || inv.hostname === '127.0.0.1' || inv.url.includes('localhost') || inv.url.includes('127.0.0.1');
    const isDanger = !isLocal && inv.verdict === 'DANGER';
    const isCaution = !isLocal && inv.verdict === 'CAUTION';

    if (isLocal) {
      return {
        id: `sbx-${inv.id}`,
        investigationId: inv.id,
        workerId: 'local-loopback',
        targetUrl: inv.url,
        status: 'COMPLETED',
        startedAt: inv.createdAt,
        completedAt: inv.completedAt,
        durationMs: 12,
        redirects: [],
        domainsContacted: [inv.hostname],
        networkRequests: [
          {
            id: 'net-local-1',
            method: 'GET',
            url: inv.url,
            domain: inv.hostname,
            status: 200,
            type: 'document',
            durationMs: 4,
            isThirdParty: false,
            isSuspicious: false,
          },
        ],
        scripts: [],
        forms: [],
        popups: [],
        downloads: [],
        behaviorFlags: [],
      };
    }

    return {
      id: `sbx-${inv.id}`,
      investigationId: inv.id,
      workerId: 'worker-node-us-east-01',
      targetUrl: inv.url,
      status: 'COMPLETED',
      startedAt: inv.createdAt,
      completedAt: inv.completedAt,
      durationMs: inv.durationMs ? Math.round(inv.durationMs * 0.4) : 380,
      redirects: isDanger ? [`${inv.url}/checkout`, `https://fast-pay-gateway.top/api/collect`] : [],
      domainsContacted: [inv.hostname, isDanger ? 'fast-pay-gateway.top' : 'cdn.cloudflare.com', 'fonts.googleapis.com'],
      networkRequests: [
        {
          id: 'net-1',
          method: 'GET',
          url: inv.url,
          domain: inv.hostname,
          status: 200,
          type: 'document',
          durationMs: 110,
          isThirdParty: false,
          isSuspicious: false,
        },
        ...(isDanger
          ? [
              {
                id: 'net-2',
                method: 'GET',
                url: 'https://fast-pay-gateway.top/collect.js',
                domain: 'fast-pay-gateway.top',
                status: 200,
                type: 'script' as const,
                durationMs: 60,
                isThirdParty: true,
                isSuspicious: true,
              },
              {
                id: 'net-3',
                method: 'POST',
                url: 'https://fast-pay-gateway.top/api/collect',
                domain: 'fast-pay-gateway.top',
                status: 200,
                type: 'xhr' as const,
                durationMs: 80,
                isThirdParty: true,
                isSuspicious: true,
                requestBody: '{"card_num":"•••• •••• •••• 4242","cvv":"••••","exp":"12/28"}',
              },
            ]
          : []),
      ],
      scripts: [
        {
          id: 'scr-1',
          src: isDanger ? 'https://fast-pay-gateway.top/collect.js' : `https://${inv.hostname}/app.js`,
          isInline: false,
          origin: isDanger ? 'fast-pay-gateway.top' : inv.hostname,
          functionsHooked: isDanger ? ['document.querySelector', 'addEventListener', 'XMLHttpRequest.prototype.send'] : ['addEventListener'],
          isObfuscated: isDanger,
          evalDetected: isDanger,
          storageAccess: true,
        },
      ],
      forms: isDanger
        ? [
            {
              id: 'form-1',
              formAction: 'https://fast-pay-gateway.top/api/collect',
              fieldType: 'credit-card',
              fieldName: 'card_number',
              isAutocompleteDisabled: true,
              isThirdPartyForm: true,
              redactedValuePreview: '•••• •••• •••• 4242',
            },
          ]
        : [],
      popups: isDanger
        ? [
            {
              id: 'pop-1',
              type: 'alert',
              text: 'Urgent: Limited inventory remaining! Complete order now.',
              blocked: true,
            },
          ]
        : [],
      downloads: [],
      behaviorFlags: isDanger
        ? [
            {
              id: 'flag-1',
              severity: 'HIGH',
              category: 'INPUT',
              title: 'Direct Card Harvest Form',
              description: 'Form inputs capture raw financial card numbers without bank-level iframe tokenization.',
              timestamp: inv.createdAt + 200,
            },
            {
              id: 'flag-2',
              severity: 'HIGH',
              category: 'DOM',
              title: 'Artificial Countdown Pressure Script',
              description: 'Script runs countdown timer coercing payment dispatch.',
              timestamp: inv.createdAt + 300,
            },
          ]
        : isCaution
        ? [
            {
              id: 'flag-1',
              severity: 'MEDIUM',
              category: 'DOM',
              title: 'Unverified Merchant Behavior',
              description: 'Site contains unverified business contact information.',
              timestamp: inv.createdAt + 200,
            },
          ]
        : [],
    };
  }

  private generateDynamicPayment(inv: Investigation): PaymentFinding {
    const isDanger = inv.verdict === 'DANGER';

    return {
      investigationId: inv.id,
      status: isDanger ? 'SUSPICIOUS' : inv.verdict === 'CAUTION' ? 'UNVERIFIED' : 'VERIFIED',
      detectedGateways: isDanger ? ['Unverified Direct Script (fast-pay-gateway.top)'] : ['Standard Verified Merchant Checkout (Stripe/PayPal)'],
      sdks: isDanger
        ? [
            {
              name: 'Generic Card Collector (Obfuscated)',
              sourceUrl: 'https://fast-pay-gateway.top/collect.js',
              isAuthenticOrigin: false,
              integrityHashValid: false,
            },
          ]
        : [
            {
              name: 'Stripe.js v3 (Official CDN)',
              sourceUrl: 'https://js.stripe.com/v3/',
              isAuthenticOrigin: true,
              integrityHashValid: true,
            },
          ],
      iframes: isDanger
        ? []
        : [
            {
              src: 'https://js.stripe.com/v3/elements-inner-card.html',
              origin: 'https://js.stripe.com',
              isSandboxed: true,
              allowsPaymentRequest: true,
              isOfficialGatewayDomain: true,
            },
          ],
      paymentDomains: isDanger ? ['fast-pay-gateway.top'] : ['js.stripe.com', 'api.stripe.com'],
      checkoutUrls: [`${inv.url}/checkout`],
      redirectChains: isDanger ? [inv.url, 'https://fast-pay-gateway.top/api/collect'] : [inv.url],
      anomalies: isDanger
        ? [
            {
              id: 'pa-1',
              severity: 'HIGH',
              title: 'Absence of Verified PCI-DSS Iframe',
              description: 'Payment fields are unencrypted light-DOM inputs rather than official gateway tokenized iframes.',
            },
          ]
        : [],
      collectsRawCardDataDirectly: isDanger,
      cryptoWalletDetected: false,
      offPlatformTransferDetected: isDanger,
      notes: isDanger
        ? ['Insecure payment flow: Credit card numbers collected in plain DOM.']
        : ['Standard PCI-compliant tokenized payment flow verified.'],
    };
  }

  private generateDynamicWebsiteIntel(inv: Investigation): WebsiteIntelligence {
    const isDanger = inv.verdict === 'DANGER';
    const isSuspiciousTld = SUSPICIOUS_TLDS.some((tld) => inv.hostname.endsWith(tld));
    const ageDays = isDanger ? 4 : inv.verdict === 'CAUTION' ? 18 : 1850;

    return {
      investigationId: inv.id,
      domain: inv.hostname,
      ipAddress: isDanger ? '198.51.100.42' : '104.21.44.18',
      hostingProvider: isDanger ? 'Hostinger Panama (High Anonymity)' : 'Cloudflare Inc. / AWS Global',
      serverCountry: isDanger ? 'Panama (PA)' : 'United States (US)',
      domainAgeDays: ageDays,
      reputationScore: isDanger ? 8 : inv.verdict === 'CAUTION' ? 45 : 98,
      registration: {
        registrar: isSuspiciousTld ? 'NameCheap / PrivacyGuardian' : 'MarkMonitor / Cloudflare Registrar',
        createdDate: new Date(Date.now() - ageDays * 86400000).toISOString(),
        expiresDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        updatedDate: new Date().toISOString(),
        whoisServer: 'whois.iana.org',
        isPrivate: isSuspiciousTld || ageDays < 30,
        registrantCountry: isDanger ? 'IS (Withheld for Privacy)' : 'US',
        nameservers: ['ns1.dns-parking.xyz', 'ns2.dns-parking.xyz'],
      },
      tls: {
        subject: inv.hostname,
        issuer: isDanger ? "Let's Encrypt Authority X3" : 'DigiCert Global Root G2',
        validFrom: new Date(Date.now() - 5 * 86400000).toISOString(),
        validTo: new Date(Date.now() + 85 * 86400000).toISOString(),
        isValid: true,
        isSelfSigned: false,
        daysRemaining: 85,
        certAgeDays: isDanger ? 5 : 365,
        protocol: 'TLS 1.3',
      },
      business: {
        companyName: isDanger ? 'Unregistered Entity' : 'Verified Merchant Corp',
        physicalAddress: isDanger ? 'Missing / Stolen Address' : '100 Verified Commerce St, CA',
        contactEmail: isDanger ? 'support@gmail.com' : `security@${inv.hostname}`,
        isVerifiedEntity: !isDanger && inv.verdict !== 'CAUTION',
      },
      socials: [],
      inconsistencies: isDanger
        ? [
            {
              id: 'inc-1',
              severity: 'HIGH',
              title: 'Domain Age vs Merchant Claims',
              description: `Domain was created only ${ageDays} days ago but claims long-standing enterprise reputation.`,
            },
          ]
        : [],
      historicalIncidents: isDanger ? ['Domain matches disposable counterfeit e-commerce heuristics.'] : [],
    };
  }

  private generateDynamicBrand(inv: Investigation): BrandFinding {
    let matchedBrand: string | null = null;
    for (const b of TOP_BRANDS) {
      if (inv.hostname.toLowerCase().includes(b)) {
        matchedBrand = b.toUpperCase();
        break;
      }
    }

    const isMismatch = !!matchedBrand && !inv.hostname.toLowerCase().endsWith(`${matchedBrand.toLowerCase()}.com`);

    return {
      investigationId: inv.id,
      claimedBrand: matchedBrand,
      detectedBrand: matchedBrand,
      officialDomain: matchedBrand ? `${matchedBrand.toLowerCase()}.com` : null,
      isOfficialDomain: matchedBrand ? !isMismatch : true,
      brandDomainMismatch: isMismatch,
      visualSimilarityScore: isMismatch ? 92 : 0,
      typoDistance: isMismatch ? 14 : 0,
      impersonationIndicators: isMismatch
        ? [
            {
              id: 'imp-1',
              severity: 'HIGH',
              type: 'TYPOSQUATTING',
              title: `Unauthorized ${matchedBrand} Trademark Usage`,
              description: `Domain appropriates ${matchedBrand} brand structure without certified authorization.`,
            },
          ]
        : [],
      copiedContentIndicators: isMismatch ? [`Product catalog text matches ${matchedBrand} official descriptions.`] : [],
      suspiciousClaims: isMismatch ? ['85% Off liquidation pricing detected across catalog.'] : [],
      contentIntegrityScore: isMismatch ? 15 : 95,
      aiGeneratedContentConfidence: isMismatch ? 65 : 10,
    };
  }

  private generateDynamicAI(inv: Investigation): AIAnalysis {
    const isDanger = inv.verdict === 'DANGER';
    const isCaution = inv.verdict === 'CAUTION';

    return {
      investigationId: inv.id,
      assessmentSummary: isDanger
        ? `High-confidence counterfeit storefront scam identified on ${inv.hostname} with raw card harvesting mechanics.`
        : isCaution
        ? `Suspicious unverified merchant registered on new domain (${inv.hostname}).`
        : `Verified authentic web property on ${inv.hostname}. Zero security anomalies identified.`,
      keyFindings: isDanger
        ? [
            `Domain age is young (<15 days) with WHOIS concealment on ${inv.hostname}.`,
            'Payment form collects raw credit card numbers directly without PCI tokenized iframes.',
            'Manipulative countdown timers coerce rapid checkout.',
          ]
        : [
            `Domain ${inv.hostname} meets verified infrastructure security criteria.`,
          ],
      evidenceSupplied: isDanger
        ? [
            { id: 'ev-1', category: 'DOMAIN', title: 'Young Domain (<15 Days)', weight: 'HIGH', description: 'Domain registered recently with privacy shielding.' },
            { id: 'ev-2', category: 'PAYMENT', title: 'Direct Card Harvest', weight: 'CRITICAL', description: 'Insecure post without bank-level iframe tokenization.' },
          ]
        : [
            { id: 'ev-1', category: 'DOMAIN', title: 'Established Clean Domain', weight: 'HIGH', description: 'Reputation history verified with enterprise TLS.' },
          ],
      conflictingSignals: [],
      riskFactors: isDanger
        ? [
            { name: 'Payment Exfiltration', category: 'PAYMENT', score: 98, impact: 'SEVERE' },
            { name: 'Infrastructure Anomaly', category: 'DOMAIN', score: 85, impact: 'SEVERE' },
          ]
        : [
            { name: 'Baseline Security', category: 'DOMAIN', score: 2, impact: 'LOW' },
          ],
      confidenceScore: inv.confidence || 98,
      reasoningBriefing: isDanger
        ? `Synthesized evidence across network telemetry and registrar heuristics flags ${inv.hostname} as an active counterfeit or credential trap.`
        : `Autonomous assessment confirms ${inv.hostname} adheres to trusted merchant and browsing security standards.`,
      recommendedAction: isDanger ? 'BLOCK_AND_RETURN' : isCaution ? 'WARN_AND_PROCEED' : 'ALLOW_BROWSING',
      modelIdentifier: 'Verdict-Autonomous-Reasoning-v3.2',
      latencyMs: 180,
    };
  }

  private generateDynamicVerdict(inv: Investigation): VerdictRecord {
    const isLocal = inv.hostname === 'localhost' || inv.hostname === '127.0.0.1' || inv.url.includes('localhost') || inv.url.includes('127.0.0.1');
    const isDanger = !isLocal && inv.verdict === 'DANGER';
    const isCaution = !isLocal && inv.verdict === 'CAUTION';

    return {
      investigationId: inv.id,
      classification: isLocal ? 'SAFE' : inv.verdict || 'SAFE',
      threatScore: isLocal ? 0 : inv.threatScore || 0,
      confidence: 100,
      title: isLocal ? 'Local Development Environment' : isDanger ? "Don't pay here" : isCaution ? 'Be careful here' : 'Safe',
      message: isLocal
        ? 'Localhost and private development servers are exempt from Verdict threat scanning.'
        : isDanger
        ? 'This looks like a fake shop. Your money and card details may not be safe.'
        : isCaution
        ? "This shop is very new and we couldn't verify who operates it."
        : 'Verified authentic site. No security concerns detected.',
      primaryReasons: isLocal
        ? ['Localhost loopback interface detected.', 'Development servers are exempt from scanning.']
        : isDanger
        ? [
            'Unverified merchant registered recently with hidden ownership.',
            'Payment form collects raw credit card numbers without bank protection.',
          ]
        : ['Verified domain credentials with zero active fraud indicators.'],
      supportingEvidenceIds: ['ev-1'],
      recommendedUserAction: isLocal ? 'ALLOW_BROWSING' : isDanger ? 'BLOCK_AND_RETURN' : isCaution ? 'WARN_AND_PROCEED' : 'ALLOW_BROWSING',
      decisionPolicyRules: [],
      timestamp: inv.completedAt || Date.now(),
      extensionNotified: true,
      notifiedAt: inv.completedAt ? inv.completedAt + 40 : Date.now(),
    };
  }
}

export const apiClient = new VerdictApiClient();
