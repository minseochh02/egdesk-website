'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Props = {
  token: string;
  brandName: string;
  /** Prefill from ?phone= */
  initialPhone?: string;
  /** One-tap from ?action=opt_in|opt_out (requires phone) */
  initialAction?: 'opt_in' | 'opt_out' | null;
};

type ResultState = {
  action: 'opt_in' | 'opt_out';
  phone: string;
} | null;

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function ConsentForm({
  token,
  brandName,
  initialPhone = '',
  initialAction = null,
}: Props) {
  const [phone, setPhone] = useState(initialPhone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResultState>(null);
  const autoSubmitted = useRef(false);

  const submit = async (action: 'opt_in' | 'opt_out', phoneOverride?: string) => {
    setError('');
    const trimmed = (phoneOverride ?? phone).trim();
    if (!trimmed) {
      setError('휴대폰 번호를 입력해 주세요.');
      return;
    }
    setBusy(true);
    try {
      const supabase = getClient();
      const { data, error: rpcError } = await supabase.rpc('record_sms_consent', {
        p_token: token,
        p_phone: trimmed,
        p_action: action,
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });
      if (rpcError) {
        setError(rpcError.message || '처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      const phoneNormalized =
        (data as { phoneNormalized?: string } | null)?.phoneNormalized || trimmed;
      setResult({ action, phone: phoneNormalized });
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  // One-tap: ?phone=…&action=opt_in|opt_out
  useEffect(() => {
    if (autoSubmitted.current) return;
    if (!initialPhone || !initialAction) return;
    autoSubmitted.current = true;
    void submit(initialAction, initialPhone);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for one-tap links
  }, [initialPhone, initialAction]);

  if (result) {
    const optedIn = result.action === 'opt_in';
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/90">
          {brandName || '등록 완료'}
        </p>
        <h2 className="mt-3 text-2xl font-bold">
          {optedIn ? '수신에 동의하셨습니다' : '수신을 거부하셨습니다'}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          {optedIn
            ? `${result.phone} 번호로 광고성 정보 수신 동의가 등록되었습니다.`
            : `${result.phone} 번호로는 더 이상 광고성 문자를 보내지 않습니다.`}
        </p>
        <button
          type="button"
          className="mt-6 text-sm text-emerald-200 underline underline-offset-4"
          onClick={() => {
            setResult(null);
            setPhone(initialPhone || '');
            autoSubmitted.current = true; // don't auto-fire again after manual reset
          }}
        >
          다른 번호로 다시 등록
        </button>
      </div>
    );
  }

  const phoneLocked = Boolean(initialPhone);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
      {busy && initialAction ? (
        <p className="mb-4 text-sm text-emerald-200/90">등록 처리 중…</p>
      ) : null}

      <label className="block text-sm font-medium text-white/90" htmlFor="consent-phone">
        휴대폰 번호
      </label>
      <input
        id="consent-phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="010-1234-5678"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={busy || phoneLocked}
        readOnly={phoneLocked}
        className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base text-white outline-none ring-emerald-400/40 placeholder:text-white/35 focus:ring-2 disabled:opacity-80"
      />
      {phoneLocked ? (
        <p className="mt-2 text-xs text-white/50">
          문자 링크에서 번호가 전달되었습니다. 아래에서 동의 또는 거부를 선택하세요.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit('opt_in')}
          className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {busy ? '처리 중…' : '수신 동의'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit('opt_out')}
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {busy ? '처리 중…' : '수신 거부'}
        </button>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-white/45">
        정보통신망법에 따라 광고성 정보 전송 전 수신 동의가 필요하며, 수신을 원하지 않는 경우
        언제든 거부할 수 있습니다. 등록 내용은 해당 사업자의 EGDesk 계정에 저장됩니다.
      </p>
    </div>
  );
}
