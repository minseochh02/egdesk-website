export const SITE_URL = 'https://egdesk.cloud';

export function canonicalPath(path: string): string {
  if (path === '/') {
    return `${SITE_URL}/`;
  }

  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
