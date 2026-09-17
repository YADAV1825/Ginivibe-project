const BASE_URL = 'http://localhost:3005/api/v1/admin';

export class AdminAuth {
  static async login(data: { email: string; password: string }) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Admin login failed');
    }
    return res.json();
  }

  static async getPendingCampaigns(token: string) {
    const res = await fetch(`${BASE_URL}/campaigns/pending`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch pending campaigns');
    return res.json();
  }

  static async approveCampaign(token: string, campaignId: string) {
    const res = await fetch(`${BASE_URL}/campaigns/${campaignId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to approve campaign');
    return res.json();
  }

  static async rejectCampaign(token: string, campaignId: string, reason: string) {
    const res = await fetch(`${BASE_URL}/campaigns/${campaignId}/reject`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error('Failed to reject campaign');
    return res.json();
  }

  static async getOrganizations(token: string) {
    const res = await fetch(`${BASE_URL}/organizations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch orgs');
    return res.json();
  }

  static async suspendOrganization(token: string, orgId: string) {
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/suspend`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to suspend org');
    return res.json();
  }

  static async reactivateOrganization(token: string, orgId: string) {
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/reactivate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to reactivate org');
    return res.json();
  }

  static async getGlobalAnalytics(token: string) {
    const res = await fetch(`${BASE_URL}/analytics/global`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  }

  static async getAuditLogs(token: string) {
    const res = await fetch(`${BASE_URL}/audit-logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  }
}
