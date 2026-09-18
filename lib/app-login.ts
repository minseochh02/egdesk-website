import type { Session } from '@supabase/supabase-js';

/** Build egdesk:// deep link so the desktop app can import the Supabase session. */
export function buildEgdeskAppCallbackUrl(session: Session): string {
  const hash = new URLSearchParams();
  hash.set('access_token', session.access_token);
  hash.set('refresh_token', session.refresh_token);
  if (session.expires_in != null) {
    hash.set('expires_in', String(session.expires_in));
  }
  if (session.expires_at != null) {
    hash.set('expires_at', String(session.expires_at));
  }
  hash.set('token_type', 'bearer');
  return `egdesk://auth/callback#${hash.toString()}`;
}

export function launchEgdeskApp(session: Session): void {
  window.location.href = buildEgdeskAppCallbackUrl(session);
}
