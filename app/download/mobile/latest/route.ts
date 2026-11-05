import { redirect } from 'next/navigation';
import {
  fetchLatestMobileManifest,
  mobileApkDownloadUrl,
  MOBILE_BOOTSTRAP_APK_URL,
} from '@/lib/mobileRelease';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const manifest = await fetchLatestMobileManifest();
    redirect(mobileApkDownloadUrl(manifest));
  } catch {
    redirect(MOBILE_BOOTSTRAP_APK_URL);
  }
}
