import type { Metadata } from 'next';
import EgdeskProductAppPage from '@/app/components/landing/EgdeskProductAppPage';
import { ONECLICK_PRODUCT } from '@/lib/egdesk-product-apps';

export const metadata: Metadata = {
  title: ONECLICK_PRODUCT.metadataTitle,
  description: ONECLICK_PRODUCT.metadataDescription,
  alternates: {
    canonical: '/oneclick',
  },
  openGraph: {
    title: ONECLICK_PRODUCT.metadataTitle,
    description: ONECLICK_PRODUCT.metadataDescription,
    url: '/oneclick',
    siteName: 'EGDesk',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/landing/icon-oneclick.svg',
        width: 1024,
        height: 1024,
        alt: ONECLICK_PRODUCT.softwareName,
      },
    ],
  },
};

export default function OneClickProductPage() {
  return <EgdeskProductAppPage config={ONECLICK_PRODUCT} />;
}
