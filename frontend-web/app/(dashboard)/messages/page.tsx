import { Suspense } from 'react';
import { MessagesDashboard } from '@/app/(dashboard)/messages/screens/MessagesDashboard';

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>Loading messages...</div>}>
      <MessagesDashboard />
    </Suspense>
  );
}
