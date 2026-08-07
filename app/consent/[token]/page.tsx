import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { ConsentForm } from './ConsentForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '광고성 정보 수신 동의/거부 | EGDesk',
  description: '마케팅 문자 수신 동의 또는 거부를 등록합니다.',
  robots: {
    index: false,
    follow: false,
  },
};

type ConsentLink = {
  token: string;
  brand_name: string;
  opt_out_phone: string;
  active: boolean;
};

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadLink(token: string): Promise<ConsentLink | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('sms_consent_links')
    .select('token, brand_name, opt_out_phone, active')
    .eq('token', token)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as ConsentLink;
}

export default async function ConsentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = token ? await loadLink(token) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/EGDesk.png" alt="EGDesk" width={32} height={32} className="rounded" />
            <span className="text-lg font-semibold tracking-tight">EGDesk</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-lg px-5 py-10">
        {!link ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h1 className="text-2xl font-bold">링크를 찾을 수 없습니다</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              수신 동의/거부 링크가 없거나 더 이상 사용되지 않습니다. 문자에 안내된
              수신거부 번호로 문의하거나 발신자에게 새 링크를 요청해 주세요.
            </p>
          </div>
        ) : (
          <>
            <header className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
                광고성 정보 수신
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {link.brand_name || '사업자'}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                아래 휴대폰 번호를 입력한 뒤, 광고성 문자 수신에{' '}
                <strong className="text-white">동의</strong>하거나{' '}
                <strong className="text-white">거부</strong>할 수 있습니다.
                {link.opt_out_phone ? (
                  <>
                    {' '}
                    무료수신거부 안내 번호:{' '}
                    <span className="font-medium text-emerald-200">{link.opt_out_phone}</span>
                  </>
                ) : null}
              </p>
            </header>

            <ConsentForm token={link.token} brandName={link.brand_name} />
          </>
        )}
      </main>
    </div>
  );
}
