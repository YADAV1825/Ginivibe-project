export interface EnterpriseUser {
  id: string;
  email: string;
  role?: string;
}

export interface Organization {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
}

export type CampaignStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED' | 'REJECTED' | 'COMPLETED';

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  budget: number;
  spent?: number;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  impressions?: number;
  clicks?: number;
}

export interface BillingProfile {
  balance: number;
  currency: string;
  creditLimit?: number;
}

export interface OrganizationSummary {
  impressions: number;
  clicks: number;
  ctr: number;
  totalSpend: number;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
  createdAt: string;
}
