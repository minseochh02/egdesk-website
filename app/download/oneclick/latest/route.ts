import { redirectToLatestReleaseAsset } from '@/app/download/download-release';

const releasesPageUrl = 'https://github.com/minseochh02/OneClickAI-releases/releases/latest';
const latestReleaseApiUrl =
  'https://api.github.com/repos/minseochh02/OneClickAI-releases/releases/latest';

export async function GET() {
  return redirectToLatestReleaseAsset({
    apiUrl: latestReleaseApiUrl,
    fallbackUrl: releasesPageUrl,
  });
}
