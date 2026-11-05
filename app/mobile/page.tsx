import type { Metadata } from 'next';
import EgdeskProductAppPage from '@/app/components/landing/EgdeskProductAppPage';
import { MOBILE_PRODUCT } from '@/lib/egdesk-product-apps';

export const metadata: Metadata = {
  title: MOBILE_PRODUCT.metadataTitle,
  description: MOBILE_PRODUCT.metadataDescription,
  alternates: {
    canonical: '/mobile',
  },
  openGraph: {
    title: MOBILE_PRODUCT.metadataTitle,
    description: MOBILE_PRODUCT.metadataDescription,
    url: '/mobile',
    siteName: 'EGDesk',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/landing/icon-mobile.svg',
        width: 1024,
        height: 1024,
        alt: MOBILE_PRODUCT.softwareName,
      },
    ],
  },
};

export default function MobileProductPage() {
  return <EgdeskProductAppPage config={MOBILE_PRODUCT} />;
}
