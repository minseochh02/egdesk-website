import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PortoneCheckoutClient } from './PortoneCheckoutClient';

export const metadata: Metadata = {
  title: 'EGDesk Pro 결제',
  robots: { index: false, follow: false },
};

export default function PortoneCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <PortoneCheckoutClient />
    </Suspense>
  );
}
