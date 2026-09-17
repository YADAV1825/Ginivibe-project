'use client';

import React from 'react';
import { ShieldCheck, Check, X, History } from 'lucide-react';
import { Campaign, AdminAuditLog } from '../types';

interface AdminQueueViewProps {
  pendingCampaigns: Campaign[];
  auditLogs: AdminAuditLog[];
  onReview: (campaignId: string, decision: 'APPROVE' | 'REJECT', notes?: string) => Promise<void>;
  onRefresh: () => void;
}

export const AdminQueueView: React.FC<AdminQueueViewProps> = ({
  pendingCampaigns,
  auditLogs,
  onReview,
  onRefresh,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Campaign Approval Queue */}
      <div
        className="glass"
        style={{
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#6366f1" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              Platform Approval Queue
            </h3>
          </div>
          <button
            onClick={onRefresh}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Refresh Queue
          </button>
        </div>

        {pendingCampaigns.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Queue clear! No campaigns currently awaiting Super-Admin approval.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Campaign Name</th>
                  <th style={{ padding: '10px 14px' }}>Budget</th>
                  <th style={{ padding: '10px 14px' }}>Org ID</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Review Decision</th>
                </tr>
              </thead>
              <tbody>
                {pendingCampaigns.map((camp) => (
                  <tr key={camp.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{camp.name}</td>
                    <td style={{ padding: '12px 14px' }}>${camp.budget.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      {camp.organizationId}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => onReview(camp.id, 'APPROVE', 'Authorized by Super-Admin')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onReview(camp.id, 'REJECT', 'Rejected by Super-Admin')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Immutable Audit Logs */}
      {auditLogs.length > 0 && (
        <div
          className="glass"
          style={{
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
            <History size={18} color="#8b5cf6" />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
              Immutable Governance Audit Logs
            </h4>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 12px' }}>Action</th>
                  <th style={{ padding: '8px 12px' }}>Target</th>
                  <th style={{ padding: '8px 12px' }}>Admin</th>
                  <th style={{ padding: '8px 12px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 5).map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-accent)' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{log.targetType} ({log.targetId.substring(0, 8)}...)</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{log.adminId.substring(0, 8)}...</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
