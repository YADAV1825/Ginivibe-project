'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';
import { 
  BarChart3, 
  Megaphone, 
  CreditCard, 
  Settings, 
  TrendingUp,
  Users,
  MousePointerClick,
  Eye,
  Plus
} from 'lucide-react';
import { EnterpriseAuth } from '@/app/core/services/EnterpriseAuth';

export function EnterpriseDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampName, setNewCampName] = useState('');
  const [newCampBudget, setNewCampBudget] = useState(100);
  const [newCampEndDate, setNewCampEndDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [fundAmount, setFundAmount] = useState(500);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'billing' | 'team' | 'settings'>('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('enterprise_token');
    if (!token) {
      router.push('/enterprise');
      return;
    }

    const loadDashboard = async () => {
      try {
        // Fetch User's Organizations
        const orgs = await EnterpriseAuth.getOrganizations(token);
        if (orgs.length === 0) {
          throw new Error('No organizations found');
        }
        const activeOrg = orgs[0];
        setOrg(activeOrg);

        // Fetch Campaigns for that Organization
        const camps = await EnterpriseAuth.getCampaigns(token, activeOrg.id);
        setCampaigns(camps);

        // Fetch Billing Profile
        try {
          const billingProfile = await EnterpriseAuth.getBillingProfile(token, activeOrg.id);
          setBilling(billingProfile);
        } catch (err) {
          console.warn("Could not fetch billing profile", err);
        }

        // Fetch Analytics Summary
        try {
          const orgSummary = await EnterpriseAuth.getOrganizationSummary(token, activeOrg.id);
          setSummary(orgSummary);
        } catch (err) {
          console.warn("Could not fetch org summary", err);
        }
      } catch (err) {
        console.error(err);
        router.push('/enterprise');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const token = localStorage.getItem('enterprise_token');
      if (!token || !org) return;

      const newCamp = await EnterpriseAuth.createCampaign(token, org.id, {
        name: newCampName,
        budget: Number(newCampBudget),
        endDate: newCampEndDate ? new Date(newCampEndDate).toISOString() : undefined
      });
      
      setCampaigns((prev) => [newCamp, ...prev]);
      setIsModalOpen(false);
      setNewCampName('');
      setNewCampBudget(100);
      setNewCampEndDate('');
    } catch (err) {
      console.error(err);
      alert('Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (campaignId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('enterprise_token');
      if (!token || !org) return;

      const updated = await EnterpriseAuth.updateCampaignStatus(token, org.id, campaignId, newStatus);
      
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: updated.status } : c));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleAddFunds = async () => {
    try {
      setIsAddingFunds(true);
      const token = localStorage.getItem('enterprise_token');
      if (!token || !org) return;

      const newBilling = await EnterpriseAuth.addFunds(token, org.id, Number(fundAmount));
      setBilling(newBilling);
      alert('Funds added successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to add funds. Are you an OWNER/ADMIN?');
    } finally {
      setIsAddingFunds(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading Enterprise Portal...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}>
      
      {/* SIDEBAR */}
      <div style={{ 
        width: '260px', 
        backgroundColor: 'var(--color-surface)', 
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{org?.name}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Enterprise Portal</p>
        </div>
        
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
          <Button variant="ghost" onClick={() => setActiveTab('dashboard')} style={{ justifyContent: 'flex-start', color: activeTab === 'dashboard' ? 'var(--color-primary)' : 'var(--color-text-secondary)', backgroundColor: activeTab === 'dashboard' ? 'rgba(129, 140, 248, 0.1)' : 'transparent' }}>
            <BarChart3 size={20} style={{ marginRight: '12px' }} /> Dashboard
          </Button>
          <Button variant="ghost" onClick={() => setActiveTab('campaigns')} style={{ justifyContent: 'flex-start', color: activeTab === 'campaigns' ? 'var(--color-primary)' : 'var(--color-text-secondary)', backgroundColor: activeTab === 'campaigns' ? 'rgba(129, 140, 248, 0.1)' : 'transparent' }}>
            <Megaphone size={20} style={{ marginRight: '12px' }} /> Campaigns
          </Button>
          <Button variant="ghost" onClick={() => setActiveTab('billing')} style={{ justifyContent: 'flex-start', color: activeTab === 'billing' ? 'var(--color-primary)' : 'var(--color-text-secondary)', backgroundColor: activeTab === 'billing' ? 'rgba(129, 140, 248, 0.1)' : 'transparent' }}>
            <CreditCard size={20} style={{ marginRight: '12px' }} /> Billing
          </Button>
          <Button variant="ghost" onClick={() => setActiveTab('team')} style={{ justifyContent: 'flex-start', color: activeTab === 'team' ? 'var(--color-primary)' : 'var(--color-text-secondary)', backgroundColor: activeTab === 'team' ? 'rgba(129, 140, 248, 0.1)' : 'transparent' }}>
            <Users size={20} style={{ marginRight: '12px' }} /> Team
          </Button>
        </div>

        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <Button variant="ghost" onClick={() => setActiveTab('settings')} style={{ justifyContent: 'flex-start', color: activeTab === 'settings' ? 'var(--color-primary)' : 'var(--color-text-secondary)', backgroundColor: activeTab === 'settings' ? 'rgba(129, 140, 248, 0.1)' : 'transparent' }}>
            <Settings size={20} style={{ marginRight: '12px' }} /> Settings
          </Button>
          <Link href="/enterprise" onClick={() => localStorage.removeItem('enterprise_token')} style={{ display: 'block', marginTop: 'var(--space-2)' }}>
            <Button variant="secondary" fullWidth>Log Out</Button>
          </Link>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-8)' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
              {activeTab === 'dashboard' ? 'Dashboard Overview' : activeTab}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Track your campaign performance across GiniVibe.</p>
          </div>
          {activeTab === 'dashboard' || activeTab === 'campaigns' ? (
            <Button style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> New Campaign
            </Button>
          ) : null}
        </div>

        {activeTab !== 'dashboard' && activeTab !== 'campaigns' && activeTab !== 'billing' ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-secondary)' }}>
            <div style={{ margin: '0 auto var(--space-4)', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>Coming Soon</h3>
            <p>This module ({activeTab}) is slated for a future Phase 2 release.</p>
          </div>
        ) : activeTab === 'billing' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-8)' }}>
            <Card className="glass">
              <CardHeader>
                <CardTitle>Billing Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-6)', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>Available Balance</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                      ${billing?.balance ? Number(billing.balance).toFixed(2) : '0.00'}
                    </h2>
                  </div>
                  <div>
                    <CreditCard size={48} color="rgba(255,255,255,0.1)" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Add Funds</CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>Amount to Add (USD)</label>
                  <input 
                    type="number" 
                    value={fundAmount}
                    onChange={(e) => setFundAmount(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>
                <Button onClick={handleAddFunds} disabled={isAddingFunds} style={{ width: '100%', padding: '12px' }}>
                  {isAddingFunds ? 'Processing...' : 'Deposit Funds'}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'campaigns' ? (
          <Card className="glass">
            <CardHeader>
              <CardTitle>All Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    <th style={{ padding: '12px 0', fontWeight: 500 }}>Campaign Name</th>
                    <th style={{ padding: '12px 0', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '12px 0', fontWeight: 500 }}>Budget</th>
                    <th style={{ padding: '12px 0', fontWeight: 500 }}>Start Date</th>
                    <th style={{ padding: '12px 0', fontWeight: 500 }}>End Date</th>
                    <th style={{ padding: '12px 0', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(camp => (
                    <tr key={camp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 0', fontWeight: 500 }}>{camp.name}</td>
                      <td style={{ padding: '16px 0' }}>
                        <span style={{ 
                          backgroundColor: camp.status === 'ACTIVE' ? 'rgba(76, 175, 80, 0.2)' : 
                                           camp.status === 'PENDING_REVIEW' ? 'rgba(33, 150, 243, 0.2)' :
                                           'rgba(255, 193, 7, 0.2)', 
                          color: camp.status === 'ACTIVE' ? 'var(--color-success)' : 
                                 camp.status === 'PENDING_REVIEW' ? 'var(--color-warning)' :
                                 'var(--color-text-muted)', 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' 
                        }}>
                          {camp.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 0', color: 'var(--color-text-secondary)' }}>${Number(camp.budget).toFixed(2)}</td>
                      <td style={{ padding: '16px 0', color: 'var(--color-text-secondary)' }}>{new Date(camp.startDate).toLocaleDateString()}</td>
                      <td style={{ padding: '16px 0', color: 'var(--color-text-secondary)' }}>{camp.endDate ? new Date(camp.endDate).toLocaleDateString() : 'Continuous'}</td>
                      <td style={{ padding: '16px 0', textAlign: 'right' }}>
                        {camp.status === 'DRAFT' && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(camp.id, 'PENDING_REVIEW')}>
                            Submit for Review
                          </Button>
                        )}
                        {camp.status === 'PENDING_REVIEW' && (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Awaiting Review</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No campaigns found. Create one to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* DASHBOARD TAB METRICS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
              
              <Card className="glass">
                <CardContent style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Total Spend</span>
                    <CreditCard size={18} color="var(--color-primary)" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>${summary ? summary.spend.toFixed(2) : '0.00'}</div>
                  <div style={{ color: 'var(--color-success)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                    <TrendingUp size={12} style={{ marginRight: '4px' }}/> Total lifetime spend
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Impressions</span>
                    <Eye size={18} color="var(--color-accent)" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{summary ? summary.impressions.toLocaleString() : '0'}</div>
                  <div style={{ color: 'var(--color-success)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                    <TrendingUp size={12} style={{ marginRight: '4px' }}/> Delivered across network
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Clicks</span>
                    <MousePointerClick size={18} color="var(--color-accent)" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{summary ? summary.clicks.toLocaleString() : '0'}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                    {summary ? summary.ctr : '0.00'}% Avg CTR
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardContent style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Active Campaigns</span>
                    <Megaphone size={18} color="var(--color-warning)" />
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{campaigns.filter(c => c.status === 'ACTIVE').length}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                    Running today
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* DASHBOARD RECENT CAMPAIGNS TABLE */}
            <Card className="glass" style={{ marginBottom: 'var(--space-8)' }}>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      <th style={{ padding: '12px 0', fontWeight: 500 }}>Campaign Name</th>
                      <th style={{ padding: '12px 0', fontWeight: 500 }}>Status</th>
                      <th style={{ padding: '12px 0', fontWeight: 500 }}>Budget</th>
                      <th style={{ padding: '12px 0', fontWeight: 500 }}>Start Date</th>
                      <th style={{ padding: '12px 0', fontWeight: 500 }}>End Date</th>
                      <th style={{ padding: '12px 0', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 3).map(camp => (
                      <tr key={camp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px 0', fontWeight: 500 }}>{camp.name}</td>
                        <td style={{ padding: '16px 0' }}>
                          <span style={{ 
                            backgroundColor: camp.status === 'ACTIVE' ? 'rgba(76, 175, 80, 0.2)' : 
                                             camp.status === 'PENDING_REVIEW' ? 'rgba(33, 150, 243, 0.2)' :
                                             'rgba(255, 193, 7, 0.2)', 
                            color: camp.status === 'ACTIVE' ? 'var(--color-success)' : 
                                   camp.status === 'PENDING_REVIEW' ? 'var(--color-warning)' :
                                   'var(--color-text-muted)', 
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' 
                          }}>
                            {camp.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 0', color: 'var(--color-text-secondary)' }}>${Number(camp.budget).toFixed(2)}</td>
                        <td style={{ padding: '16px 0', color: 'var(--color-text-secondary)' }}>{new Date(camp.startDate).toLocaleDateString()}</td>
                        <td style={{ padding: '16px 0', color: 'var(--color-text-secondary)' }}>{camp.endDate ? new Date(camp.endDate).toLocaleDateString() : 'Continuous'}</td>
                      <td style={{ padding: '16px 0', textAlign: 'right' }}>
                        {camp.status === 'DRAFT' && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(camp.id, 'PENDING_REVIEW')}>
                            Submit for Review
                          </Button>
                        )}
                        {camp.status === 'PENDING_REVIEW' && (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Awaiting Review</span>
                        )}
                      </td>
                      </tr>
                    ))}
                    {campaigns.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                          No campaigns found. Create one to get started!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <Card className="glass" style={{ width: '400px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Campaign Name</label>
                  <input 
                    type="text" 
                    value={newCampName}
                    onChange={(e) => setNewCampName(e.target.value)}
                    placeholder="e.g. Summer App Promo" 
                    required
                    style={{
                      width: '100%', padding: '10px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Lifetime Budget (USD)</label>
                  <input 
                    type="number" 
                    min={10}
                    value={newCampBudget}
                    onChange={(e) => setNewCampBudget(Number(e.target.value))}
                    required
                    style={{
                      width: '100%', padding: '10px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>End Date (Optional)</label>
                  <input 
                    type="date" 
                    value={newCampEndDate}
                    onChange={(e) => setNewCampEndDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                  <Button type="button" variant="ghost" fullWidth onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" fullWidth disabled={isCreating}>{isCreating ? 'Creating...' : 'Launch'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
