import React, { ButtonHTMLAttributes } from 'react';
import styles from './ui.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth, 
  className = '', 
  style,
  ...props 
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.25rem 0.65rem', fontSize: '0.8rem' },
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' }
  };

  const outlineStyle: React.CSSProperties = variant === 'outline' ? {
    backgroundColor: 'transparent',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)'
  } : {};

  const classNames = [
    styles.button,
    variant !== 'outline' ? styles[variant] : '',
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={classNames} 
      style={{ 
        width: fullWidth ? '100%' : undefined,
        ...sizeStyles[size],
        ...outlineStyle,
        ...style
      }} 
      {...props}
    >
      {children}
    </button>
  );
};
