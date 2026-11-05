export const MOBILE_RELEASES_REPO = 'minseochh02/egdesk-mobile-releases';

export const MOBILE_LATEST_JSON_URL = `https://github.com/${MOBILE_RELEASES_REPO}/releases/latest/download/latest.json`;

export const MOBILE_BOOTSTRAP_TAG = 'mobile-v0.0.14-rc.1';

export const MOBILE_BOOTSTRAP_LATEST_JSON_URL = `https://github.com/${MOBILE_RELEASES_REPO}/releases/download/${MOBILE_BOOTSTRAP_TAG}/latest.json`;

export const MOBILE_BOOTSTRAP_APK_URL = `https://github.com/${MOBILE_RELEASES_REPO}/releases/download/${MOBILE_BOOTSTRAP_TAG}/egdesk-android.apk`;

export const MOBILE_BOOTSTRAP_VERSION_CODE = 14;

export type MobileLatestManifest = {
  schema: number;
  versionName: string;
  versionCode: number;
  minSupportedVersionCode: number;
  apkUrl: string;
  sha256: string;
  signerCertSha256: string;
  sizeBytes: number;
  releasedAt: string;
  notes?: string;
};

const GITHUB_JSON_ACCEPT = 'application/vnd.github+json';

function isMobileManifest(data: unknown): data is MobileLatestManifest {
  if (!data || typeof data !== 'object') return false;
  const m = data as MobileLatestManifest;
  return typeof m.versionName === 'string' && typeof m.apkUrl === 'string';
}

async function fetchJson(url: string, accept = 'application/json'): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: accept, 'User-Agent': 'EGDesk-Website-MobileInstall/1.0' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

async function fetchManifestJson(url: string): Promise<MobileLatestManifest | null> {
  const data = await fetchJson(url);
  if (!isMobileManifest(data)) return null;
  return data;
}

export function mobileApkDownloadUrl(manifest: MobileLatestManifest | null | undefined): string {
  const url = manifest?.apkUrl?.trim();
  if (
    url &&
    typeof manifest?.versionCode === 'number' &&
    manifest.versionCode >= MOBILE_BOOTSTRAP_VERSION_CODE
  ) {
    return url;
  }
  return MOBILE_BOOTSTRAP_APK_URL;
}

async function fetchHighestPrereleaseManifest(): Promise<MobileLatestManifest | null> {
  const releasesRaw = await fetchJson(
    `https://api.github.com/repos/${MOBILE_RELEASES_REPO}/releases?per_page=30`,
    GITHUB_JSON_ACCEPT,
  );
  if (!Array.isArray(releasesRaw)) return null;

  let best: MobileLatestManifest | null = null;
  for (const release of releasesRaw as Array<{
    assets: Array<{ name: string; browser_download_url: string }>;
  }>) {
    const latestJson = release.assets?.find((a) => a.name === 'latest.json');
    if (!latestJson?.browser_download_url) continue;
    const manifest = await fetchManifestJson(latestJson.browser_download_url);
    if (!manifest) continue;
    if (!best || manifest.versionCode > best.versionCode) {
      best = manifest;
    }
  }
  return best;
}

export async function fetchLatestMobileManifest(): Promise<MobileLatestManifest> {
  const fromGithub = await fetchHighestPrereleaseManifest();
  if (fromGithub) return fromGithub;

  const bootstrap = await fetchManifestJson(MOBILE_BOOTSTRAP_LATEST_JSON_URL);
  if (bootstrap) return bootstrap;

  const stable = await fetchManifestJson(MOBILE_LATEST_JSON_URL);
  if (stable) return stable;

  throw new Error('No mobile release manifest available');
}
