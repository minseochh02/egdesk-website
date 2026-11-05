import type { Metadata } from 'next';
import EgdeskProductAppPage from '@/app/components/landing/EgdeskProductAppPage';
import { SHEETBOT_PRODUCT } from '@/lib/egdesk-product-apps';

export const metadata: Metadata = {
  title: SHEETBOT_PRODUCT.metadataTitle,
  description: SHEETBOT_PRODUCT.metadataDescription,
  alternates: { canonical: '/sheetbot' },
  openGraph: {
    title: SHEETBOT_PRODUCT.metadataTitle,
    description: SHEETBOT_PRODUCT.metadataDescription,
    url: '/sheetbot',
    siteName: 'EGDesk',
    locale: 'ko_KR',
    type: 'website',
    images: [{ url: '/landing/icon-sheetbot.svg', width: 1024, height: 1024, alt: 'SheetBot' }],
  },
};

export default function SheetbotProductPage() {
  return <EgdeskProductAppPage config={SHEETBOT_PRODUCT} />;
}
