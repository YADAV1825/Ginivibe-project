'use client';

import { useState, useEffect, useCallback } from 'react';
import { enterpriseApi } from '../api/enterpriseApi';
import {
  Organization,
  Campaign,
  BillingProfile,
  OrganizationSummary,
  AdminAuditLog,
} from '../types';

const ENTERPRISE_TOKEN_KEY = 'ginivibe_enterprise_token';
const ENTERPRISE_ORG_KEY = 'ginivibe_enterprise_org';
const ADMIN_TOKEN_KEY = 'ginivibe_admin_token';

export function useEnterprise() {
  const [token, setToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [billing, setBilling] = useState<BillingProfile | null>(null);
  const [summary, setSummary] = useState<OrganizationSummary | null>(null);
  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isServiceOffline, setIsServiceOffline] = useState<boolean>(false);

  // Load stored tokens on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem(ENTERPRISE_TOKEN_KEY);
      const savedAdminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      const savedOrg = localStorage.getItem(ENTERPRISE_ORG_KEY);

      if (savedToken) setToken(savedToken);
      if (savedAdminToken) setAdminToken(savedAdminToken);
      if (savedOrg) {
        try {
          setActiveOrg(JSON.parse(savedOrg));
        } catch {
          // ignore parsing error
        }
      }
    }
  }, []);

  const loadTenantData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const orgs = await enterpriseApi.getOrganizations(token);
      setOrganizations(orgs);

      const targetOrg = activeOrg || orgs[0] || null;
      if (targetOrg) {
        setActiveOrg(targetOrg);
        if (typeof window !== 'undefined') {
          localStorage.setItem(ENTERPRISE_ORG_KEY, JSON.stringify(targetOrg));
        }

        // Parallel fetch of campaigns, billing and analytics
        const [camps, bill, sum] = await Promise.all([
          enterpriseApi.getCampaigns(token, targetOrg.id).catch(() => []),
          enterpriseApi.getBillingProfile(token, targetOrg.id).catch(() => null),
          enterpriseApi.getOrganizationSummary(token, targetOrg.id).catch(() => null),
        ]);

        setCampaigns(camps);
        setBilling(bill);
        setSummary(sum);
      }
      setIsServiceOffline(false);
    } catch (err: any) {
      console.warn('[Enterprise] Load error:', err.message);
      if (err.message?.includes('Failed to fetch')) {
        setIsServiceOffline(true);
      }
      setError(err.message || 'Failed to connect to Enterprise service');
    } finally {
      setLoading(false);
    }
  }, [token, activeOrg]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await enterpriseApi.login({ email, password: pass });
      setToken(res.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ENTERPRISE_TOKEN_KEY, res.token);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, orgName: string) => {
    setLoading(true);
    try {
      const res = await enterpriseApi.register({
        email,
        password: pass,
        organizationName: orgName,
      });
      setToken(res.token);
      setActiveOrg(res.organization);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ENTERPRISE_TOKEN_KEY, res.token);
        localStorage.setItem(ENTERPRISE_ORG_KEY, JSON.stringify(res.organization));
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (name: string, budget: number, endDate?: string) => {
    if (!token || !activeOrg) throw new Error('Organization not active');
    const camp = await enterpriseApi.createCampaign(token, activeOrg.id, {
      name,
      budget,
      endDate,
    });
    setCampaigns((prev) => [camp, ...prev]);
    return camp;
  };

  const submitCampaignForReview = async (campaignId: string) => {
    if (!token || !activeOrg) throw new Error('Organization not active');
    const updated = await enterpriseApi.updateCampaignStatus(
      token,
      activeOrg.id,
      campaignId,
      'PENDING_REVIEW'
    );
    setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? updated : c)));
    return updated;
  };

  const addFunds = async (amount: number) => {
    if (!token || !activeOrg) throw new Error('Organization not active');
    await enterpriseApi.addFunds(token, activeOrg.id, amount);
    const updatedBilling = await enterpriseApi.getBillingProfile(token, activeOrg.id);
    setBilling(updatedBilling);
  };

  // ──────── ADMIN OPERATIONS ────────
  const adminLogin = async (email: string, pass: string) => {
    const res = await enterpriseApi.adminLogin(email, pass);
    setAdminToken(res.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_TOKEN_KEY, res.token);
    }
    return res;
  };

  const loadAdminQueue = async () => {
    if (!adminToken) return;
    try {
      const [pending, logs] = await Promise.all([
        enterpriseApi.getPendingCampaigns(adminToken).catch(() => []),
        enterpriseApi.getAuditLogs(adminToken).catch(() => []),
      ]);
      setPendingCampaigns(pending);
      setAuditLogs(logs);
    } catch (e: any) {
      console.warn('[AdminQueue] Error:', e.message);
    }
  };

  const reviewCampaign = async (campaignId: string, decision: 'APPROVE' | 'REJECT', notes?: string) => {
    if (!adminToken) throw new Error('Admin token missing');
    await enterpriseApi.reviewCampaign(adminToken, campaignId, decision, notes);
    await loadAdminQueue();
  };

  return {
    token,
    adminToken,
    organizations,
    activeOrg,
    setActiveOrg,
    campaigns,
    billing,
    summary,
    pendingCampaigns,
    auditLogs,
    loading,
    error,
    isServiceOffline,
    login,
    register,
    createCampaign,
    submitCampaignForReview,
    addFunds,
    adminLogin,
    loadAdminQueue,
    reviewCampaign,
    reload: loadTenantData,
  };
}
