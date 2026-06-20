import { NextResponse } from 'next/server';

const downloadableAssetPattern = /\.(dmg|exe|msi|pkg|zip|tar\.gz)$/i;
const ignoredAssetPattern = /\.(blockmap|sha256|sig|yml|yaml|json)$/i;

type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type GitHubLatestRelease = {
  assets?: GitHubReleaseAsset[];
};

type LatestReleaseConfig = {
  apiUrl: string;
  fallbackUrl: string;
};

function selectDownloadAsset(assets: GitHubReleaseAsset[] = []) {
  const installerAsset = assets.find(
    (asset) =>
      downloadableAssetPattern.test(asset.name) &&
      !ignoredAssetPattern.test(asset.name) &&
      Boolean(asset.browser_download_url),
  );

  return installerAsset ?? assets.find((asset) => Boolean(asset.browser_download_url));
}

export async function redirectToLatestReleaseAsset({ apiUrl, fallbackUrl }: LatestReleaseConfig) {
  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'egdesk-website',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.redirect(fallbackUrl);
    }

    const release = (await response.json()) as GitHubLatestRelease;
    const downloadAsset = selectDownloadAsset(release.assets);

    return NextResponse.redirect(downloadAsset?.browser_download_url ?? fallbackUrl);
  } catch {
    return NextResponse.redirect(fallbackUrl);
  }
}
