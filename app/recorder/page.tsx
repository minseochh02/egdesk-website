import type { Metadata } from 'next';
import EgdeskProductAppPage from '@/app/components/landing/EgdeskProductAppPage';
import { RECORDER_PRODUCT } from '@/lib/egdesk-product-apps';

export const metadata: Metadata = {
  title: RECORDER_PRODUCT.metadataTitle,
  description: RECORDER_PRODUCT.metadataDescription,
  alternates: {
    canonical: '/recorder',
  },
  openGraph: {
    title: RECORDER_PRODUCT.metadataTitle,
    description: RECORDER_PRODUCT.metadataDescription,
    url: '/recorder',
    siteName: 'EGDesk',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/landing/icon-recorder.svg',
        width: 1024,
        height: 1024,
        alt: RECORDER_PRODUCT.softwareName,
      },
    ],
  },
};

export default function RecorderProductPage() {
  return <EgdeskProductAppPage config={RECORDER_PRODUCT} />;
}
