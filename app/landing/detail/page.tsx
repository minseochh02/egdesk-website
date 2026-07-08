import type { Metadata } from 'next';
import { Suspense } from 'react';
import DetailPageContent from '../../components/landing/DetailPageContent';

export const metadata: Metadata = {
  title: 'EGDESK AI_Server 상세 기술 사양 | EGDesk',
  description:
    'EGDESK AI_Server 입문형, 표준형, 실무형, 전문용 모델의 CPU, GPU, RAM, SSD 사양과 견적 상담 정보를 확인하세요.',
  alternates: {
    canonical: '/landing/detail',
  },
  openGraph: {
    title: 'EGDESK AI_Server 상세 기술 사양',
    description:
      'EGDESK AI_Server 라인업별 상세 하드웨어 사양과 실시간 견적 상담 안내',
    url: '/landing/detail',
    siteName: 'EGDesk',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function LandingDetailPage() {
  return (
    <Suspense fallback={null}>
      <DetailPageContent />
    </Suspense>
  );
}
