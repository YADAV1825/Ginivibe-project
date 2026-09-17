import React from 'react';

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
      backgroundColor: 'var(--color-surface-elevated)'
    }}>
      {children}
    </div>
  );
};
