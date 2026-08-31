export interface RegistrationInfo {
  registrar: string;
  createdDate: string;
  expiresDate: string;
  updatedDate: string;
  whoisServer: string;
  isPrivate: boolean;
  registrantCountry: string;
  nameservers: string[];
}

export interface TlsCertificate {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  isValid: boolean;
  isSelfSigned: boolean;
  daysRemaining: number;
  certAgeDays: number;
  protocol: 'TLS 1.3' | 'TLS 1.2' | 'INSECURE';
}

export interface BusinessEntity {
  companyName?: string;
  jurisdiction?: string;
  registrationNumber?: string;
  physicalAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  isVerifiedEntity: boolean;
}

export interface SocialPresence {
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok';
  url: string;
  isVerified: boolean;
  followerCountSnippet?: string;
}

export interface WebsiteConsistencyIssue {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
}

export interface WebsiteIntelligence {
  investigationId: string;
  domain: string;
  ipAddress: string;
  hostingProvider: string;
  serverCountry: string;
  domainAgeDays: number;
  reputationScore: number; // 0 - 100 (100 = spotless, 0 = toxic)
  registration: RegistrationInfo;
  tls: TlsCertificate;
  business: BusinessEntity;
  socials: SocialPresence[];
  inconsistencies: WebsiteConsistencyIssue[];
  historicalIncidents: string[];
}
