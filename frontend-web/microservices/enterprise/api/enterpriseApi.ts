import {
  Organization,
  Campaign,
  BillingProfile,
  OrganizationSummary,
  AdminAuditLog,
} from '../types';

const ENTERPRISE_API_URL =
  process.env.NEXT_PUBLIC_ENTERPRISE_API_URL || 'http://localhost:3005/api/v1';

export class EnterpriseApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = ENTERPRISE_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  // ──────────────── IDENTITY & ORGS ────────────────
  async register(data: { email: string; password: string; organizationName: string }) {
    const userRes = await fetch(`${this.baseUrl}/identity/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password }),
    });

    if (!userRes.ok) {
      const err = await userRes.json().catch(() => ({ error: userRes.statusText }));
      throw new Error(err.error || 'Failed to register identity');
    }

    const { token } = await userRes.json();

    // Automatically create the initial tenant organization
    const orgRes = await fetch(`${this.baseUrl}/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: data.organizationName }),
    });

    if (!orgRes.ok) {
      const err = await orgRes.json().catch(() => ({ error: orgRes.statusText }));
      throw new Error(err.error || 'Failed to initialize organization');
    }

    const orgData = await orgRes.json();
    return { token, organization: orgData.organization || orgData };
  }

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${this.baseUrl}/identity/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Invalid credentials');
    }

    return res.json();
  }

  async getOrganizations(token: string): Promise<Organization[]> {
    const res = await fetch(`${this.baseUrl}/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Failed to retrieve organizations');
    return res.json();
  }

  async createOrganization(token: string, name: string): Promise<Organization> {
    const res = await fetch(`${this.baseUrl}/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) throw new Error('Failed to create organization');
    return res.json();
  }

  // ──────────────── CAMPAIGNS ────────────────
  async getCampaigns(token: string, orgId: string): Promise<Campaign[]> {
    const res = await fetch(`${this.baseUrl}/campaigns`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-organization-id': orgId,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch campaigns');
    return res.json();
  }

  async createCampaign(
    token: string,
    orgId: string,
    data: { name: string; budget: number; endDate?: string }
  ): Promise<Campaign> {
    const res = await fetch(`${this.baseUrl}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-organization-id': orgId,
      },
      body: JSON.stringify({
        name: data.name,
        budget: data.budget,
        startDate: new Date().toISOString(),
        endDate: data.endDate,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Failed to create campaign');
    }

    return res.json();
  }

  async updateCampaignStatus(
    token: string,
    orgId: string,
    campaignId: string,
    status: string
  ): Promise<Campaign> {
    const res = await fetch(`${this.baseUrl}/campaigns/${campaignId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-organization-id': orgId,
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Failed to update campaign status');
    }

    return res.json();
  }

  // ──────────────── BILLING & WALLET ────────────────
  async getBillingProfile(token: string, orgId: string): Promise<BillingProfile> {
    const res = await fetch(`${this.baseUrl}/billing/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-organization-id': orgId,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch billing profile');
    return res.json();
  }

  async addFunds(token: string, orgId: string, amount: number) {
    const res = await fetch(`${this.baseUrl}/billing/add-funds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-organization-id': orgId,
      },
      body: JSON.stringify({ amount }),
    });

    if (!res.ok) throw new Error('Failed to deposit funds');
    return res.json();
  }

  // ──────────────── ANALYTICS ────────────────
  async getOrganizationSummary(token: string, orgId: string): Promise<OrganizationSummary> {
    const res = await fetch(`${this.baseUrl}/analytics/organization/${orgId}/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-organization-id': orgId,
      },
    });

    if (!res.ok) throw new Error('Failed to fetch analytics summary');
    return res.json();
  }

  // ──────────────── SUPER-ADMIN CONTROL PLANE ────────────────
  async adminLogin(email: string, password: string) {
    const res = await fetch(`${this.baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Admin login failed');
    }

    return res.json();
  }

  async getPendingCampaigns(adminToken: string): Promise<Campaign[]> {
    const res = await fetch(`${this.baseUrl}/admin/campaigns/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (!res.ok) throw new Error('Failed to fetch pending review campaigns');
    return res.json();
  }

  async reviewCampaign(
    adminToken: string,
    campaignId: string,
    decision: 'APPROVE' | 'REJECT',
    notes?: string
  ) {
    const res = await fetch(`${this.baseUrl}/admin/campaigns/${campaignId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ decision, notes }),
    });

    if (!res.ok) throw new Error('Failed to process review decision');
    return res.json();
  }

  async getAuditLogs(adminToken: string): Promise<AdminAuditLog[]> {
    const res = await fetch(`${this.baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  }
}

export const enterpriseApi = new EnterpriseApiClient();
