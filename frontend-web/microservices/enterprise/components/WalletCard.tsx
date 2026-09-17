'use client';

import React, { useState } from 'react';
import { CreditCard, DollarSign, Plus } from 'lucide-react';
import { BillingProfile } from '../types';

interface WalletCardProps {
  billing: BillingProfile | null;
  onAddFunds: (amount: number) => Promise<void>;
}

export const WalletCard: React.FC<WalletCardProps> = ({ billing, onAddFunds }) => {
  const [amount, setAmount] = useState<number>(250);
  const [isDepositing, setIsDepositing] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleDeposit = async () => {
    if (amount <= 0) return;
    setIsDepositing(true);
    try {
      await onAddFunds(amount);
      setShowInput(false);
    } catch (e: any) {
      alert(e.message || 'Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  const balance = billing?.balance ?? 0;
  const currency = billing?.currency || 'USD';

  return (
    <div
      className="glass"
      style={{
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
            Enterprise Ad Wallet
          </span>
          <div
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--color-accent)',
            }}
          >
            <CreditCard size={18} />
          </div>
        </div>

        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
          ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
            {currency}
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4)' }}>
          Available balance for active campaign bidding
        </p>
      </div>

      {showInput ? (
        <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {[100, 250, 500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: amount === preset ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  backgroundColor: amount === preset ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: amount === preset ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                +${preset}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              min="10"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              onClick={handleDeposit}
              disabled={isDepositing}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: isDepositing ? 'not-allowed' : 'pointer',
              }}
            >
              {isDepositing ? 'Adding...' : 'Deposit'}
            </button>
            <button
              onClick={() => setShowInput(false)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-elevated)',
            color: 'var(--color-text-primary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <Plus size={15} />
          <span>Add Funds</span>
        </button>
      )}
    </div>
  );
};
