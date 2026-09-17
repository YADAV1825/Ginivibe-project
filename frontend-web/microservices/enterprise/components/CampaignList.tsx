'use client';

import React from 'react';
import { Send, Clock, CheckCircle, AlertTriangle, PauseCircle, XCircle } from 'lucide-react';
import { Campaign, CampaignStatus } from '../types';

interface CampaignListProps {
  campaigns: Campaign[];
  onSubmitForReview: (campaignId: string) => Promise<any>;
  onCreateNewClick: () => void;
}

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; color: string; bg: string; icon: any }
> = {
  DRAFT: { label: 'Draft', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', icon: Clock },
  PENDING_REVIEW: { label: 'In Review', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', icon: AlertTriangle },
  ACTIVE: { label: 'Active', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)', icon: CheckCircle },
  PAUSED: { label: 'Paused', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', icon: PauseCircle },
  REJECTED: { label: 'Rejected', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', icon: XCircle },
  COMPLETED: { label: 'Completed', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', icon: CheckCircle },
};

export const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  onSubmitForReview,
  onCreateNewClick,
}) => {
  return (
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 4px' }}>
            Ad Campaigns
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Manage your targeted ads and submission state machine
          </p>
        </div>
        <button
          onClick={onCreateNewClick}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: 'var(--color-accent)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          + New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
          <p style={{ margin: '0 0 var(--space-4)' }}>No campaigns created yet for this organization.</p>
          <button
            onClick={onCreateNewClick}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Create your first campaign
          </button>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Campaign</th>
                <th style={{ padding: '12px 16px' }}>Budget</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Created</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => {
                const config = STATUS_CONFIG[camp.status] || STATUS_CONFIG.DRAFT;
                const StatusIcon = config.icon;
                return (
                  <tr
                    key={camp.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      fontSize: '0.875rem',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {camp.name}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)' }}>
                      ${camp.budget.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: config.color,
                          backgroundColor: config.bg,
                        }}
                      >
                        <StatusIcon size={12} />
                        {config.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)' }}>
                      {new Date(camp.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {camp.status === 'DRAFT' && (
                        <button
                          onClick={() => onSubmitForReview(camp.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #d97706',
                            backgroundColor: 'rgba(217, 119, 6, 0.08)',
                            color: '#b45309',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Send size={12} />
                          <span>Submit for Review</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
