import React from 'react';
import { AppLayout as FeatureAppLayout } from '@/app/core/components/AppLayout';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <FeatureAppLayout>{children}</FeatureAppLayout>;
}
