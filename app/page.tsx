import type { Metadata } from 'next';
import HomePage from './components/HomePage';

export const metadata: Metadata = {
  title: 'EGDESK AI_Server - 고성능 AI 워크스테이션',
  description:
    '딥러닝, 머신러닝, 생성형 AI 및 전문 인공지능 연구 개발을 위한 최적의 하드웨어 EGDESK AI_Server 라인업을 소개합니다.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'EGDESK AI_Server - 고성능 AI 워크스테이션',
    description:
      '딥러닝, 머신러닝, 생성형 AI 및 전문 인공지능 연구 개발을 위한 최적의 하드웨어 EGDESK AI_Server 라인업을 소개합니다.',
    url: '/',
    siteName: 'EGDesk',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function Home() {
  return <HomePage />;
}
