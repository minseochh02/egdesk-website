import { redirectToLatestReleaseAsset } from '@/app/download/download-release';

const latestReleaseApiUrl =
  'https://api.github.com/repos/Charismagreat/SheetBot/releases/latest';

/** Known asset name from SheetBot releases (used when latest has no attachable asset URL). */
const fallbackApkUrl =
  'https://github.com/Charismagreat/SheetBot/releases/latest/download/SheetBotAgent.apk';

export async function GET() {
  return redirectToLatestReleaseAsset({
    apiUrl: latestReleaseApiUrl,
    fallbackUrl: fallbackApkUrl,
    preferApk: true,
  });
}
