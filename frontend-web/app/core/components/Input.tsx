import React, { InputHTMLAttributes, forwardRef } from 'react';
import styles from './ui.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`${styles.inputWrapper} ${className}`}>
        {label && <label className={styles.inputLabel}>{label}</label>}
        <input 
          ref={ref}
          className={styles.inputField} 
          {...props} 
        />
        {error && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem' }}>{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
