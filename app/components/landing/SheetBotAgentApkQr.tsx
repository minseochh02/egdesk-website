'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

type SheetBotAgentApkQrProps = {
  /** Absolute HTTPS URL encoded in the QR (e.g. egdesk.cloud download redirect). */
  installUrl: string;
};

/**
 * Compact QR for the landing SheetBot card only — scans to the latest agent APK redirect.
 */
export default function SheetBotAgentApkQr({ installUrl }: SheetBotAgentApkQrProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(installUrl, { margin: 1, width: 132 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [installUrl]);

  return (
    <div className="product-app-card__apk-qr" aria-label="SheetBot 에이전트 APK QR">
      <span className="product-app-card__apk-qr-label">에이전트 APK</span>
      <p className="product-app-card__apk-qr-hint">스캔하면 휴대폰에서 최신 APK를 받습니다</p>
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt="SheetBot 에이전트 APK 다운로드 QR"
          width={132}
          height={132}
          className="product-app-card__apk-qr-img"
        />
      ) : (
        <div className="product-app-card__apk-qr-placeholder" aria-hidden>
          QR
        </div>
      )}
    </div>
  );
}
