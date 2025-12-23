import { cookies } from 'next/headers';

export async function getGoogleToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('google_provider_token');
  
  if (!token) {
    console.warn('⚠️ getGoogleToken: Cookie "google_provider_token" is missing');
    // Log all available cookies for debugging
    console.log('🍪 Available cookies:', cookieStore.getAll().map(c => c.name));
  } else {
    console.log('✅ getGoogleToken: Cookie found (length: ' + token.value.length + ')');
  }
  
  return token?.value || null;
}

export async function getGoogleRefreshToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('google_provider_refresh_token');
  return token?.value || null;
}
