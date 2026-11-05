import type { Metadata } from 'next';
import EgdeskProductAppPage from '@/app/components/landing/EgdeskProductAppPage';
import { FILETOSHEET_PRODUCT } from '@/lib/egdesk-product-apps';

export const metadata: Metadata = {
  title: FILETOSHEET_PRODUCT.metadataTitle,
  description: FILETOSHEET_PRODUCT.metadataDescription,
  alternates: { canonical: '/filetosheet' },
  openGraph: {
    title: FILETOSHEET_PRODUCT.metadataTitle,
    description: FILETOSHEET_PRODUCT.metadataDescription,
    url: '/filetosheet',
    siteName: 'EGDesk',
    locale: 'ko_KR',
    type: 'website',
    images: [
      { url: '/landing/icon-filetosheet.svg', width: 1024, height: 1024, alt: 'FileToSheet' },
    ],
  },
};

export default function FiletosheetProductPage() {
  return <EgdeskProductAppPage config={FILETOSHEET_PRODUCT} />;
}
