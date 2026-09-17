"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAuth } from '@/app/core/services/AdminAuth';
import { Shield, Activity, Users, FileText, Settings, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';

export function AdminDashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'approvals' | 'analytics' | 'organizations' | 'audit'>('approvals');
  const [loading, setLoading] = useState(true);
  
  const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    loadData(activeTab, token);
  }, [activeTab, router]);

  const loadData = async (tab: string, token: string) => {
    setLoading(true);
    try {
      if (tab === 'approvals') {
        const camps = await AdminAuth.getPendingCampaigns(token);
        setPendingCampaigns(camps);
      } else if (tab === 'analytics') {
        const stats = await AdminAuth.getGlobalAnalytics(token);
        setAnalytics(stats);
      } else if (tab === 'organizations') {
        const orgs = await AdminAuth.getOrganizations(token);
        setOrganizations(orgs);
      } else if (tab === 'audit') {
        const logs = await AdminAuth.getAuditLogs(token);
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error('Error loading data', err);
      // alert('Failed to load data, session might be expired');
      // router.push('/admin-login');
    } finally {
      setLoading(false);
    }
  };

  const [rejectingCampaign, setRejectingCampaign] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const [togglingOrg, setTogglingOrg] = useState<{id: string, status: string} | null>(null);

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token')!;
      await AdminAuth.approveCampaign(token, id);
      setPendingCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const confirmReject = async () => {
    if (!rejectingCampaign || !rejectReason.trim()) return;
    try {
      const token = localStorage.getItem('admin_token')!;
      await AdminAuth.rejectCampaign(token, rejectingCampaign, rejectReason);
      setPendingCampaigns(prev => prev.filter(c => c.id !== rejectingCampaign));
      setRejectingCampaign(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      alert('Failed to reject');
    }
  };

  const confirmToggleOrg = async () => {
    if (!togglingOrg) return;
    try {
      const token = localStorage.getItem('admin_token')!;
      if (togglingOrg.status === 'ACTIVE') {
        await AdminAuth.suspendOrganization(token, togglingOrg.id);
      } else {
        await AdminAuth.reactivateOrganization(token, togglingOrg.id);
      }
      loadData('organizations', token);
      setTogglingOrg(null);
    } catch (err) {
      console.error(err);
      alert('Failed to toggle org status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin-login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Reject Modal */}
      {rejectingCampaign && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#111', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid #333' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', fontWeight: 600 }}>Reject Campaign</h3>
            <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '16px' }}>Please provide a reason for rejecting this campaign. This will be visible to the advertiser.</p>
            <input 
              type="text" 
              placeholder="e.g. Violates community guidelines" 
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#000', color: '#fff', marginBottom: '24px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="outline" onClick={() => setRejectingCampaign(null)}>Cancel</Button>
              <Button style={{ backgroundColor: 'var(--color-error)', color: '#fff' }} onClick={confirmReject}>Confirm Rejection</Button>
            </div>
          </div>
        </div>
      )}

      {/* Org Toggle Modal */}
      {togglingOrg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#111', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid #333' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.2rem', fontWeight: 600 }}>
              {togglingOrg.status === 'ACTIVE' ? 'Suspend Organization?' : 'Reactivate Organization?'}
            </h3>
            <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.5 }}>
              {togglingOrg.status === 'ACTIVE' 
                ? 'Are you sure you want to suspend this organization? All of their active campaigns will instantly stop serving across the entire network.' 
                : 'Are you sure you want to reactivate this organization? Their approved campaigns will begin serving again.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="outline" onClick={() => setTogglingOrg(null)}>Cancel</Button>
              <Button style={{ backgroundColor: togglingOrg.status === 'ACTIVE' ? 'var(--color-error)' : 'var(--color-success)', color: '#fff' }} onClick={confirmToggleOrg}>
                Yes, {togglingOrg.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#111', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #222' }}>
          <Shield color="var(--color-error)" size={28} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>GiniVibe</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-error)', letterSpacing: '1px' }}>CONTROL PLANE</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'approvals', icon: Shield, label: 'Approval Queue' },
            { id: 'organizations', icon: Users, label: 'Organizations' },
            { id: 'analytics', icon: Activity, label: 'Global Analytics' },
            { id: 'audit', icon: FileText, label: 'Audit Logs' }
          ].map(item => (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px',
                cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: activeTab === item.id ? 'rgba(244, 67, 54, 0.1)' : 'transparent',
                color: activeTab === item.id ? 'var(--color-error)' : 'var(--color-text-muted)'
              }}
            >
              <item.icon size={20} />
              <span style={{ fontWeight: 500 }}>{item.label}</span>
              {item.id === 'approvals' && pendingCampaigns.length > 0 && (
                <div style={{ marginLeft: 'auto', backgroundColor: 'var(--color-error)', color: '#fff', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px' }}>
                  {pendingCampaigns.length}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div style={{ padding: '24px' }}>
          <Button variant="outline" fullWidth onClick={handleLogout} style={{ borderColor: '#333', color: '#aaa' }}>
            <LogOut size={16} style={{ marginRight: '8px' }} /> Sign Out
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        
        {loading && activeTab === 'approvals' && pendingCampaigns.length === 0 ? (
          <div style={{ color: '#888' }}>Loading secure control plane data...</div>
        ) : activeTab === 'approvals' ? (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Approval Queue</h2>
            <Card className="glass">
              <CardContent style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #333', color: '#888', fontSize: '0.875rem' }}>
                      <th style={{ padding: '16px' }}>Organization</th>
                      <th style={{ padding: '16px' }}>Campaign</th>
                      <th style={{ padding: '16px' }}>Budget</th>
                      <th style={{ padding: '16px' }}>Targeting</th>
                      <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCampaigns.map(camp => (
                      <tr key={camp.id} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '16px', fontWeight: 500 }}>{camp.organization?.name}</td>
                        <td style={{ padding: '16px' }}>
                          <div>{camp.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>{camp.objective || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '16px' }}>${Number(camp.budget).toFixed(2)}</td>
                        <td style={{ padding: '16px', color: '#888', fontSize: '0.875rem' }}>View Details</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <Button size="sm" variant="outline" style={{ marginRight: '8px' }} onClick={() => setRejectingCampaign(camp.id)}>Reject</Button>
                          <Button size="sm" style={{ backgroundColor: 'var(--color-success)', color: '#fff' }} onClick={() => handleApprove(camp.id)}>Approve</Button>
                        </td>
                      </tr>
                    ))}
                    {pendingCampaigns.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
                          Queue is clear. No campaigns pending review.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'organizations' ? (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Enterprise Organizations</h2>
            <Card className="glass">
              <CardContent style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #333', color: '#888', fontSize: '0.875rem' }}>
                      <th style={{ padding: '16px' }}>Organization Name</th>
                      <th style={{ padding: '16px' }}>Status</th>
                      <th style={{ padding: '16px' }}>Members</th>
                      <th style={{ padding: '16px' }}>Campaigns</th>
                      <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map(org => (
                      <tr key={org.id} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '16px', fontWeight: 500 }}>{org.name}</td>
                        <td style={{ padding: '16px' }}>
                           <span style={{ 
                            backgroundColor: org.status === 'ACTIVE' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)', 
                            color: org.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-error)', 
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' 
                          }}>
                            {org.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#888' }}>{org._count?.members || 0}</td>
                        <td style={{ padding: '16px', color: '#888' }}>{org._count?.campaigns || 0}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            style={{ color: org.status === 'ACTIVE' ? 'var(--color-error)' : 'var(--color-success)', borderColor: org.status === 'ACTIVE' ? 'var(--color-error)' : 'var(--color-success)' }} 
                            onClick={() => setTogglingOrg({ id: org.id, status: org.status })}
                          >
                            {org.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'analytics' ? (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Global Network Analytics</h2>
            {analytics && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                <Card className="glass">
                  <CardContent style={{ padding: '24px' }}>
                    <div style={{ color: '#888', fontSize: '0.875rem', marginBottom: '8px' }}>Total Ad Revenue</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>${analytics.totalRevenue.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card className="glass">
                  <CardContent style={{ padding: '24px' }}>
                    <div style={{ color: '#888', fontSize: '0.875rem', marginBottom: '8px' }}>Network Impressions</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.totalImpressions.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="glass">
                  <CardContent style={{ padding: '24px' }}>
                    <div style={{ color: '#888', fontSize: '0.875rem', marginBottom: '8px' }}>Network Clicks</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.totalClicks.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="glass">
                  <CardContent style={{ padding: '24px' }}>
                    <div style={{ color: '#888', fontSize: '0.875rem', marginBottom: '8px' }}>Active Campaigns</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{analytics.activeCampaigns}</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '24px' }}>Security Audit Logs</h2>
            <Card className="glass">
              <CardContent style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #333', color: '#888', fontSize: '0.875rem' }}>
                      <th style={{ padding: '16px' }}>Timestamp</th>
                      <th style={{ padding: '16px' }}>Admin</th>
                      <th style={{ padding: '16px' }}>Action</th>
                      <th style={{ padding: '16px' }}>Resource</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '16px', color: '#888', fontSize: '0.875rem' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px', fontWeight: 500 }}>
                          {log.admin?.email} <span style={{ color: '#888', fontSize: '0.75rem', marginLeft: '4px' }}>({log.admin?.role})</span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ backgroundColor: '#222', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#aaa', fontSize: '0.875rem' }}>
                          {log.resourceType}: {log.resourceId}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
                          No audit logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
