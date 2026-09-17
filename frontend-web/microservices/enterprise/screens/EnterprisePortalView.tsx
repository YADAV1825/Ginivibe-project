'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  TrendingUp,
  MousePointerClick,
  Eye,
  DollarSign,
  Shield,
  Layers,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { useEnterprise } from '../hooks/useEnterprise';
import { CampaignList } from '../components/CampaignList';
import { CreateCampaignModal } from '../components/CreateCampaignModal';
import { WalletCard } from '../components/WalletCard';
import { AdminQueueView } from '../components/AdminQueueView';

export function EnterprisePortalView() {
  const [activeTab, setActiveTab] = useState<'advertiser' | 'admin'>('advertiser');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin login states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  const {
    token,
    adminToken,
    activeOrg,
    organizations,
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
  } = useEnterprise();

  useEffect(() => {
    if (activeTab === 'admin' && adminToken) {
      loadAdminQueue();
    }
  }, [activeTab, adminToken, loadAdminQueue]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, orgName);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    try {
      await adminLogin(adminEmail, adminPassword);
      await loadAdminQueue();
    } catch (err: any) {
      setAdminAuthError(err.message || 'Admin login failed');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'var(--space-6)' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: '4px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
              }}
            >
              <Building2 size={24} />
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>
              Enterprise & Advertiser Platform
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Self-service ad campaigns & B2B admin governance (Port 3005)
          </p>
        </div>

        {/* View Toggle (Advertiser vs Admin) */}
        <div
          style={{
            display: 'inline-flex',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
          }}
        >
          <button
            onClick={() => setActiveTab('advertiser')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'advertiser' ? 'var(--color-surface)' : 'transparent',
              color: activeTab === 'advertiser' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'advertiser' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Advertiser Portal
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'admin' ? 'var(--color-surface)' : 'transparent',
              color: activeTab === 'admin' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'admin' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <Shield size={14} />
            <span>Admin Control Plane</span>
          </button>
        </div>
      </header>

      {/* Offline Alert */}
      {isServiceOffline && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#b45309',
            marginBottom: 'var(--space-6)',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={18} />
          <div>
            <strong>Enterprise Backend Offline:</strong> The service at port 3005 is currently unreachable. Run{' '}
            <code>cd backend/microservices/enterprise && npm run dev</code> to boot the API.
          </div>
        </div>
      )}

      {/* ──────────────── ADVERTISER PORTAL TAB ──────────────── */}
      {activeTab === 'advertiser' && (
        <div>
          {!token ? (
            /* Auth Login / Register Form */
            <div
              className="glass"
              style={{
                maxWidth: '440px',
                margin: 'var(--space-12) auto',
                padding: 'var(--space-8)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  color: 'var(--color-accent)',
                }}
              >
                <LogIn size={26} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                {authMode === 'login' ? 'Advertiser Sign In' : 'Create Advertiser Account'}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-6)' }}>
                Access the multi-tenant programmatic advertising control center.
              </p>

              {authError && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} style={{ textAlign: 'left' }}>
                {authMode === 'register' && (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Media LLC"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface-elevated)',
                        color: 'var(--color-text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@ginivibe.com"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: 'var(--color-accent)',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {loading ? 'Please wait...' : authMode === 'login' ? 'Sign In to Portal' : 'Register Organization'}
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {authMode === 'login' ? (
                    <span>
                      Don't have a B2B tenant account?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode('register')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Register
                      </button>
                    </span>
                  ) : (
                    <span>
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Sign In
                      </button>
                    </span>
                  )}
                </div>
              </form>
            </div>
          ) : (
            /* Authenticated Advertiser Dashboard */
            <div>
              {/* Organization Header Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  marginBottom: 'var(--space-6)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <Layers size={18} color="#6366f1" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Tenant: {activeOrg?.name || 'My Organization'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      color: '#16a34a',
                      fontWeight: 600,
                    }}
                  >
                    {activeOrg?.status || 'ACTIVE'}
                  </span>
                </div>

                {organizations.length > 1 && (
                  <select
                    value={activeOrg?.id}
                    onChange={(e) => {
                      const sel = organizations.find((o) => o.id === e.target.value);
                      if (sel) setActiveOrg(sel);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* KPI Stat Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-6)',
                }}
              >
                {/* Total Impressions */}
                <div
                  className="glass"
                  style={{
                    padding: 'var(--space-5)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Impressions
                    </span>
                    <Eye size={16} color="#6366f1" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                    {(summary?.impressions || 0).toLocaleString()}
                  </div>
                </div>

                {/* Total Clicks */}
                <div
                  className="glass"
                  style={{
                    padding: 'var(--space-5)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Ad Clicks
                    </span>
                    <MousePointerClick size={16} color="#22c55e" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                    {(summary?.clicks || 0).toLocaleString()}
                  </div>
                </div>

                {/* Click-Through Rate */}
                <div
                  className="glass"
                  style={{
                    padding: 'var(--space-5)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Average CTR
                    </span>
                    <TrendingUp size={16} color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                    {((summary?.ctr || 0) * 100).toFixed(2)}%
                  </div>
                </div>

                {/* Total Spend */}
                <div
                  className="glass"
                  style={{
                    padding: 'var(--space-5)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Campaign Spend
                    </span>
                    <DollarSign size={16} color="#ec4899" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                    ${(summary?.totalSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Grid: Wallet & Campaigns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 'var(--space-6)' }}>
                <WalletCard billing={billing} onAddFunds={addFunds} />

                <CampaignList
                  campaigns={campaigns}
                  onSubmitForReview={submitCampaignForReview}
                  onCreateNewClick={() => setIsCreateModalOpen(true)}
                />
              </div>

              {/* Create Campaign Modal */}
              <CreateCampaignModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={createCampaign}
              />
            </div>
          )}
        </div>
      )}

      {/* ──────────────── SUPER-ADMIN CONTROL PLANE TAB ──────────────── */}
      {activeTab === 'admin' && (
        <div>
          {!adminToken ? (
            /* Super Admin Login */
            <div
              className="glass"
              style={{
                maxWidth: '420px',
                margin: 'var(--space-12) auto',
                padding: 'var(--space-8)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  color: '#dc2626',
                }}
              >
                <Shield size={26} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                Super-Admin Control Plane
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-6)' }}>
                Authorized administrative governance only. All actions are immutably logged to Postgres.
              </p>

              {adminAuthError && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {adminAuthError}
                </div>
              )}

              <form onSubmit={handleAdminAuthSubmit} style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@ginivibe.com"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px' }}>
                    Admin Secret Key
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Authorize Admin Session
                </button>
              </form>
            </div>
          ) : (
            <AdminQueueView
              pendingCampaigns={pendingCampaigns}
              auditLogs={auditLogs}
              onReview={reviewCampaign}
              onRefresh={loadAdminQueue}
            />
          )}
        </div>
      )}
    </div>
  );
}
