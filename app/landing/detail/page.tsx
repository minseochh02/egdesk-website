import { Suspense } from 'react';
import DetailPageContent from '../../components/landing/DetailPageContent';

export default function LandingDetailPage() {
  return (
    <Suspense fallback={null}>
      <DetailPageContent />
    </Suspense>
  );
}
