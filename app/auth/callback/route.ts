import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  // Honour a `next` param so callers can control post-login destination
  const next = requestUrl.searchParams.get('next');
  const destination = next && next.startsWith('/') ? next : '/app';
  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
