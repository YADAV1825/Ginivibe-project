import React, { HTMLAttributes } from 'react';
import styles from './ui.module.css';

export const Card = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.card} ${className}`} {...props} />
);

export const CardHeader = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.cardHeader} ${className}`} {...props} />
);

export const CardTitle = ({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`${styles.cardTitle} ${className}`} {...props} />
);

export const CardDescription = ({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`${styles.cardDescription} ${className}`} {...props} />
);

export const CardContent = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.cardContent} ${className}`} {...props} />
);

export const CardFooter = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`${styles.cardFooter} ${className}`} {...props} />
);
