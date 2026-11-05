'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { MOBILE_BOOTSTRAP_APK_URL } from '@/lib/mobileRelease';

type InstallPayload = {
  apkUrl: string;
  versionName: string;
  versionCode: number;
};

export default function MobileInstallQr({ compact = false }: { compact?: boolean }) {
  const [payload, setPayload] = useState<InstallPayload | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const downloadUrl = payload?.apkUrl ?? MOBILE_BOOTSTRAP_APK_URL;

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/mobile/install', { cache: 'no-store' })
      .then((res) => res.json() as Promise<InstallPayload>)
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch(() => {
        if (!cancelled) {
          setPayload({
            apkUrl: MOBILE_BOOTSTRAP_APK_URL,
            versionName: '0.0.14-rc.1',
            versionCode: 14,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(downloadUrl, { margin: 1, width: compact ? 176 : 200 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [downloadUrl, compact]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopyMsg('Link copied');
      setTimeout(() => setCopyMsg(null), 2000);
    } catch {
      setCopyMsg(downloadUrl);
    }
  }, [downloadUrl]);

  return (
    <section
      className={`rounded-xl border border-dashed border-teal-700/40 bg-teal-950/30 ${
        compact ? 'p-4 mt-4' : 'p-5 mt-6'
      }`}
      aria-label="Install EGDesk Mobile"
    >
      <h3 className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>
        Install EGDesk Mobile (Android)
      </h3>
      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
        Scan to download the APK on your phone. After installing, sign in with the mobile app or
        approve desktop login from your phone.
      </p>

      <div className="flex flex-col items-center gap-2 mt-4">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR code to download EGDesk Mobile APK"
            width={compact ? 176 : 200}
            height={compact ? 176 : 200}
            className="rounded-lg bg-white p-1.5"
          />
        ) : (
          <div
            className={`flex items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900 text-xs text-zinc-500 ${
              compact ? 'w-44 h-44' : 'w-[200px] h-[200px]'
            }`}
          >
            {loading ? 'Loading release…' : 'QR unavailable'}
          </div>
        )}

        {payload ? (
          <p className="text-xs text-teal-400/90">
            Version {payload.versionName} (code {payload.versionCode})
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void copyLink()}
          className="text-xs font-medium text-teal-300 hover:text-teal-200 underline-offset-2 hover:underline"
        >
          Copy download link
        </button>
        {copyMsg ? <span className="text-xs text-emerald-400">{copyMsg}</span> : null}
      </div>
    </section>
  );
}
