'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { launchEgdeskApp } from '@/lib/app-login';

type Provider = 'google' | 'github';

function AppLoginContent() {
  const searchParams = useSearchParams();
  const { user, session, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoLoginAttempted = useRef(false);
  const autoLaunchAttempted = useRef(false);

  const providerParam = searchParams.get('provider');
  const provider: Provider | null =
    providerParam === 'google' || providerParam === 'github' ? providerParam : null;
  const fromDesktop = searchParams.get('source') === 'desktop';

  const handleLaunchApp = useCallback(() => {
    if (!session) return;
    setLaunching(true);
    setError(null);
    try {
      launchEgdeskApp(session);
      setLaunched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open EGDesk');
    } finally {
      setLaunching(false);
    }
  }, [session]);

  const startProviderLogin = useCallback(
    async (selected: Provider) => {
      setSigningIn(true);
      setError(null);
      try {
        sessionStorage.setItem(
          '__egdesk_app_login_pending',
          JSON.stringify({ provider: selected, fromDesktop }),
        );

        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/app-login')}`;

        if (selected === 'google') {
          const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo,
              queryParams: {
                access_type: 'offline',
                prompt: 'select_account',
              },
            },
          });
          if (oauthError) throw oauthError;
        } else {
          const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: { redirectTo },
          });
          if (oauthError) throw oauthError;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sign-in failed');
        setSigningIn(false);
      }
    },
    [fromDesktop],
  );

  useEffect(() => {
    if (loading || user || !provider || autoLoginAttempted.current) return;
    autoLoginAttempted.current = true;
    void startProviderLogin(provider);
  }, [loading, user, provider, startProviderLogin]);

  useEffect(() => {
    if (loading || !user || !session || autoLaunchAttempted.current) return;
    autoLaunchAttempted.current = true;
    const id = window.setTimeout(() => {
      handleLaunchApp();
    }, 600);
    return () => window.clearTimeout(id);
  }, [loading, user, session, handleLaunchApp]);

  useEffect(() => {
    if (!loading && user) {
      sessionStorage.removeItem('__egdesk_app_login_pending');
    }
  }, [loading, user]);

  const effectiveStatus = loading
    ? 'loading'
    : user && session
      ? launched
        ? 'launched'
        : 'ready'
      : signingIn
        ? 'signing-in'
        : 'login';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖥️</div>
          <h1 style={{ color: '#fafafa', fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>
            Sign in to EGDesk
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
            {fromDesktop
              ? 'Complete sign-in in your browser, then return to the desktop app.'
              : 'Sign in with your account, then open the EGDesk desktop app.'}
          </p>
        </div>

        {effectiveStatus === 'loading' && (
          <StatusMessage color="#a1a1aa" spinColor="#3b82f6">
            Loading…
          </StatusMessage>
        )}

        {effectiveStatus === 'signing-in' && (
          <StatusMessage color="#a1a1aa" spinColor="#3b82f6">
            Opening {provider === 'github' ? 'GitHub' : 'Google'} sign-in…
          </StatusMessage>
        )}

        {effectiveStatus === 'login' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <OAuthButton
              label="Continue with Google"
              disabled={signingIn}
              onClick={() => void startProviderLogin('google')}
              variant="google"
            />
            <OAuthButton
              label="Continue with GitHub"
              disabled={signingIn}
              onClick={() => void startProviderLogin('github')}
              variant="github"
            />
          </div>
        )}

        {(effectiveStatus === 'ready' || effectiveStatus === 'launched') && user && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  style={{ width: 40, height: 40, borderRadius: '50%' }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                  }}
                >
                  {user.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#fafafa', fontSize: '14px', fontWeight: 600 }}>
                  {user.email}
                </div>
                <div style={{ color: '#22c55e', fontSize: '12px' }}>Signed in</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLaunchApp}
              disabled={launching}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: launching ? 'wait' : 'pointer',
                opacity: launching ? 0.7 : 1,
              }}
            >
              {launching ? 'Opening EGDesk…' : 'Launch EGDesk'}
            </button>

            <p style={{ color: '#71717a', fontSize: '12px', marginTop: '16px', lineHeight: 1.5 }}>
              {launched
                ? 'If EGDesk did not open, click Launch again or open the app manually — you should stay signed in.'
                : 'Click Launch to open the desktop app with this account.'}
            </p>
          </div>
        )}

        {error && (
          <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '16px' }}>{error}</p>
        )}

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #27272a' }}>
          <Link
            href="/login"
            style={{ color: '#71717a', fontSize: '13px', textDecoration: 'none' }}
          >
            Web MCP client sign-in →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function StatusMessage({
  children,
  color,
  spinColor,
}: {
  children: React.ReactNode;
  color: string;
  spinColor: string;
}) {
  return (
    <div style={{ color, fontSize: '14px' }}>
      <div
        style={{
          width: '24px',
          height: '24px',
          border: '3px solid #3f3f46',
          borderTopColor: spinColor,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 12px',
        }}
      />
      {children}
    </div>
  );
}

function OAuthButton({
  label,
  disabled,
  onClick,
  variant,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  variant: 'google' | 'github';
}) {
  const isGoogle = variant === 'google';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        padding: '12px 20px',
        background: isGoogle ? '#fafafa' : '#27272a',
        color: isGoogle ? '#18181b' : '#fafafa',
        border: isGoogle ? 'none' : '1px solid #3f3f46',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}

export default function AppLoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#a1a1aa',
          }}
        >
          Loading…
        </div>
      }
    >
      <AppLoginContent />
    </Suspense>
  );
}
