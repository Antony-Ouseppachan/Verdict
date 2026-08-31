export interface ImpersonationIndicator {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'TYPOSQUATTING' | 'LOGO_THEFT' | 'TITLE_HIJACK' | 'IMAGE_SCRAPING' | 'FAKED_POLICY';
  title: string;
  description: string;
}

export interface BrandFinding {
  investigationId: string;
  claimedBrand: string | null;
  detectedBrand: string | null;
  officialDomain: string | null;
  isOfficialDomain: boolean;
  brandDomainMismatch: boolean;
  visualSimilarityScore: number; // 0 - 100%
  typoDistance: number;
  impersonationIndicators: ImpersonationIndicator[];
  copiedContentIndicators: string[];
  suspiciousClaims: string[];
  contentIntegrityScore: number; // 0 - 100
  aiGeneratedContentConfidence?: number; // Weak supporting signal (0 - 100)
}
