'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';

type CheckoutConfig = {
  paymentId: string;
  storeId: string;
  channelKey: string;
  orderName: string;
  totalAmount: number;
  currency: string;
  customer: { fullName: string; email: string; phoneNumber: string };
  customData?: Record<string, unknown>;
  completeUrl: string;
};

declare global {
  interface Window {
    PortOne?: {
      requestPayment: (args: Record<string, unknown>) => Promise<{
        code?: string;
        message?: string;
        pgCode?: string;
        pgMessage?: string;
        paymentId?: string;
      }>;
    };
  }
}

function functionsBaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cbptgzaubhcclkmvkiua.supabase.co';
  if (supabaseUrl.includes('.supabase.co')) {
    const ref = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0];
    return `https://${ref}.functions.supabase.co`;
  }
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1`;
}

function waitForPortOne(timeoutMs: number): Promise<NonNullable<Window['PortOne']>> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    (function tick() {
      if (window.PortOne && typeof window.PortOne.requestPayment === 'function') {
        resolve(window.PortOne);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('PortOne SDK 로드 시간 초과. 네트워크를 확인하세요.'));
        return;
      }
      setTimeout(tick, 100);
    })();
  });
}

export function PortoneCheckoutClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') ?? '';

  const [cfg, setCfg] = useState<CheckoutConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'paying' | 'done' | 'error'>('loading');
  const [message, setMessage] = useState('결제 정보를 불러오는 중…');
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setStatus('error');
        setLoadError('결제 링크에 토큰이 없습니다. EGDesk에서 다시 시도해주세요.');
        return;
      }
      try {
        const res = await fetch(`${functionsBaseUrl()}/portone-checkout?t=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || `결제 정보를 불러오지 못했습니다 (${res.status})`);
        }
        if (!cancelled) {
          setCfg(data as CheckoutConfig);
          setStatus('ready');
          setMessage('준비됨 — 결제를 시작합니다…');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setStatus('error');
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const startPay = useCallback(async () => {
    if (!cfg) return;
    setStatus('paying');
    setMessage('결제창을 여는 중…');
    try {
      const PortOne = await waitForPortOne(15000);
      const payment = await PortOne.requestPayment({
        storeId: cfg.storeId,
        channelKey: cfg.channelKey,
        paymentId: cfg.paymentId,
        orderName: cfg.orderName,
        totalAmount: cfg.totalAmount,
        currency: cfg.currency || 'KRW',
        payMethod: 'CARD',
        customer: cfg.customer,
        ...(cfg.customData ? { customData: cfg.customData } : {}),
      });
      // eslint-disable-next-line no-console
      console.log('[PortOne] requestPayment result:', payment);

      if (payment && payment.code !== undefined) {
        const detail: string[] = [];
        if (payment.pgCode) detail.push(`pgCode=${payment.pgCode}`);
        if (payment.pgMessage) detail.push(`pgMessage=${payment.pgMessage}`);
        const fullMsg = `${payment.message || `결제 실패: ${payment.code}`}${
          detail.length ? `\n[${detail.join(', ')}]` : ''
        }\n(code: ${payment.code})`;
        throw new Error(fullMsg);
      }

      setMessage('결제 확인 중…');
      const completeRes = await fetch(cfg.completeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: cfg.paymentId }),
      });
      const completeText = await completeRes.text();
      let completeData: { error?: string } = {};
      try {
        completeData = JSON.parse(completeText);
      } catch {
        completeData = { error: completeText };
      }
      if (!completeRes.ok) {
        throw new Error(completeData.error || `결제 확인 실패 (${completeRes.status})`);
      }

      setStatus('done');
      setMessage('결제 완료! EGDesk 앱으로 돌아가 주세요.');
      window.location.href = `egdesk://subscription/callback?provider=portone&paymentId=${encodeURIComponent(
        cfg.paymentId,
      )}`;
    } catch (err: unknown) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }, [cfg]);

  useEffect(() => {
    if (status === 'ready' && cfg && !startedRef.current) {
      startedRef.current = true;
      void startPay();
    }
  }, [status, cfg, startPay]);

  const amountLabel = cfg
    ? new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(cfg.totalAmount)
    : '';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', color: '#111' }}>
      <Script src="https://cdn.portone.io/v2/browser-sdk.js" strategy="afterInteractive" />
      <div
        style={{
          maxWidth: 420,
          margin: '48px auto',
          padding: 24,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,.08)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>EGDesk Pro</h1>
        <p style={{ margin: '0 0 16px', lineHeight: 1.5, color: '#444' }}>
          카드로 연간 이용권을 결제합니다. (자동갱신 없음)
        </p>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
          {amountLabel || '불러오는 중…'}
        </div>
        <button
          type="button"
          disabled={status === 'paying' || status === 'loading' || status === 'done'}
          onClick={() => void startPay()}
          style={{
            width: '100%',
            border: 0,
            borderRadius: 8,
            padding: '14px 16px',
            fontSize: 16,
            fontWeight: 600,
            background: '#111',
            color: '#fff',
            cursor: 'pointer',
            opacity: status === 'paying' || status === 'loading' || status === 'done' ? 0.55 : 1,
          }}
        >
          카드 결제하기
        </button>
        <div
          style={{
            marginTop: 16,
            fontSize: 14,
            whiteSpace: 'pre-wrap',
            color: status === 'error' ? '#b91c1c' : status === 'done' ? '#047857' : '#444',
          }}
        >
          {loadError || message}
        </div>
      </div>
    </div>
  );
}
