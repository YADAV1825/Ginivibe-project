const BASE_URL = 'http://localhost:3005/api/v1';

export class EnterpriseAuth {
  static async register(data: { email: string; password: string; organizationName: string }) {
    // 1. Create User
    const userRes = await fetch(`${BASE_URL}/identity/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password })
    });
    if (!userRes.ok) {
      const err = await userRes.json();
      if (err.details && Array.isArray(err.details)) {
        throw new Error(`Validation failed: ${err.details.map((d: any) => d.message).join(', ')}`);
      }
      throw new Error(err.error || 'Failed to register');
    }
    const { token } = await userRes.json();

    // 2. Create Organization
    const orgRes = await fetch(`${BASE_URL}/organizations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: data.organizationName })
    });
    if (!orgRes.ok) {
      const err = await orgRes.json();
      if (err.details && Array.isArray(err.details)) {
        throw new Error(`Validation failed: ${err.details.map((d: any) => d.message).join(', ')}`);
      }
      throw new Error(err.error || 'Failed to create organization');
    }
    
    return { token };
  }

  static async login(data: { email: string; password: string }) {
    const res = await fetch(`${BASE_URL}/identity/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password })
    });
    if (!res.ok) {
      const err = await res.json();
      if (err.details && Array.isArray(err.details)) {
        throw new Error(`Validation failed: ${err.details.map((d: any) => d.message).join(', ')}`);
      }
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  }

  static async getOrganizations(token: string) {
    const res = await fetch(`${BASE_URL}/organizations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to fetch organizations: ${res.status} ${err}`);
    }
    return res.json();
  }

  static async getCampaigns(token: string, orgId: string) {
    const res = await fetch(`${BASE_URL}/campaigns`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'x-organization-id': orgId
      }
    });
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    return res.json();
  }

  static async createCampaign(token: string, orgId: string, data: { name: string; budget: number; endDate?: string }) {
    const res = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': orgId
      },
      body: JSON.stringify({
        name: data.name,
        budget: data.budget,
        startDate: new Date().toISOString(),
        endDate: data.endDate
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create campaign');
    }
    return res.json();
  }

  static async getBillingProfile(token: string, orgId: string) {
    const res = await fetch(`${BASE_URL}/billing/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-organization-id': orgId
      }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch billing profile');
    }
    return res.json();
  }

  static async addFunds(token: string, orgId: string, amount: number) {
    const res = await fetch(`${BASE_URL}/billing/add-funds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': orgId
      },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add funds');
    }
    return res.json();
  }

  static async getOrganizationSummary(token: string, orgId: string) {
    const res = await fetch(`${BASE_URL}/analytics/organization/${orgId}/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-organization-id': orgId
      }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch analytics summary');
    }
    return res.json();
  }

  static async updateCampaignStatus(token: string, orgId: string, campaignId: string, status: string) {
    const res = await fetch(`${BASE_URL}/campaigns/${campaignId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-organization-id': orgId
      },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update campaign status');
    }
    return res.json();
  }
}




