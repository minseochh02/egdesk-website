import {
  fetchLatestMobileManifest,
  mobileApkDownloadUrl,
  MOBILE_BOOTSTRAP_APK_URL,
  MOBILE_BOOTSTRAP_VERSION_CODE,
} from '@/lib/mobileRelease';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const manifest = await fetchLatestMobileManifest();
    return Response.json({
      apkUrl: mobileApkDownloadUrl(manifest),
      versionName: manifest.versionName,
      versionCode: manifest.versionCode,
    });
  } catch {
    return Response.json({
      apkUrl: MOBILE_BOOTSTRAP_APK_URL,
      versionName: '0.0.14-rc.1',
      versionCode: MOBILE_BOOTSTRAP_VERSION_CODE,
    });
  }
}
