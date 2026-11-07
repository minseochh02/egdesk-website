import { NextResponse } from 'next/server';

const downloadableAssetPattern = /\.(dmg|exe|msi|pkg|zip|tar\.gz|apk)$/i;
const apkAssetPattern = /\.apk$/i;
const ignoredAssetPattern = /\.(blockmap|sha256|sig|yml|yaml|json)$/i;

type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type GitHubRelease = {
  assets?: GitHubReleaseAsset[];
  draft?: boolean;
  prerelease?: boolean;
};

type LatestReleaseConfig = {
  apiUrl: string;
  fallbackUrl: string;
};

function githubRequestHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'egdesk-website',
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

type ApkAssetSelection = {
  preferApk?: boolean;
  /** When set, match this release asset filename (case-insensitive) before any other APK. */
  apkAssetName?: string;
};

function selectDownloadAsset(
  assets: GitHubReleaseAsset[] = [],
  apkSelection: ApkAssetSelection = {},
) {
  const { preferApk, apkAssetName } = apkSelection;
  if (preferApk || apkAssetName) {
    if (apkAssetName) {
      const target = apkAssetName.toLowerCase();
      const namedApk = assets.find(
        (asset) =>
          asset.name?.toLowerCase() === target &&
          !ignoredAssetPattern.test(asset.name) &&
          Boolean(asset.browser_download_url),
      );
      if (namedApk) return namedApk;
    }

    const apkAsset = assets.find(
      (asset) =>
        apkAssetPattern.test(asset.name) &&
        !ignoredAssetPattern.test(asset.name) &&
        Boolean(asset.browser_download_url),
    );
    if (apkAsset) return apkAsset;
  }

  const installerAsset = assets.find(
    (asset) =>
      downloadableAssetPattern.test(asset.name) &&
      !apkAssetPattern.test(asset.name) &&
      !ignoredAssetPattern.test(asset.name) &&
      Boolean(asset.browser_download_url),
  );

  return installerAsset ?? assets.find((asset) => Boolean(asset.browser_download_url));
}

function downloadUrlFromRelease(
  release: GitHubRelease | null | undefined,
  apkSelection: ApkAssetSelection = {},
): string | undefined {
  return selectDownloadAsset(release?.assets, apkSelection)?.browser_download_url;
}

async function fetchGitHubJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    headers: githubRequestHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

/** Prefer GitHub "latest", but fall back to the newest stable release that has a matching asset. */
async function resolveLatestInstallerDownloadUrl(
  apiLatestUrl: string,
  apkSelection: ApkAssetSelection = {},
): Promise<string | null> {
  const latest = await fetchGitHubJson<GitHubRelease>(apiLatestUrl);
  const fromLatest = downloadUrlFromRelease(latest, apkSelection);
  if (fromLatest) return fromLatest;

  const listUrl = apiLatestUrl.replace(/\/releases\/latest$/u, '/releases?per_page=30');
  const releases = await fetchGitHubJson<GitHubRelease[]>(listUrl);
  if (!Array.isArray(releases)) return null;

  for (const release of releases) {
    if (release.draft || release.prerelease) continue;
    const url = downloadUrlFromRelease(release, apkSelection);
    if (url) return url;
  }

  return null;
}

type RedirectLatestReleaseOptions = LatestReleaseConfig & ApkAssetSelection;

export async function redirectToLatestReleaseAsset({
  apiUrl,
  fallbackUrl,
  preferApk,
  apkAssetName,
}: RedirectLatestReleaseOptions) {
  try {
    const downloadUrl = await resolveLatestInstallerDownloadUrl(apiUrl, {
      preferApk,
      apkAssetName,
    });
    return NextResponse.redirect(downloadUrl ?? fallbackUrl);
  } catch {
    return NextResponse.redirect(fallbackUrl);
  }
}
