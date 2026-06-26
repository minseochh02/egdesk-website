'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const TUNNEL_SERVER_URL = 'https://tunneling-service.onrender.com';

export default function TunnelLoginPage() {
  const searchParams = useSearchParams();
  const { user, session, loading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'login' | 'exchanging' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  // Read from URL params first, fall back to sessionStorage (post-OAuth redirect)
  let redirect = searchParams.get('redirect');
  let tunnelId = searchParams.get('tunnel_id');

  if ((!redirect || !tunnelId) && typeof window !== 'undefined') {
    try {
      const pending = sessionStorage.getItem('__egdesk_tunnel_pending');
      if (pending) {
        const parsed = JSON.parse(pending);
        redirect = redirect || parsed.redirect;
        tunnelId = tunnelId || parsed.tunnelId;
      }
    } catch {}
  }

  const exchangeAndRedirect = useCallback(async () => {
    if (!redirect || !tunnelId || !session?.access_token) return;

    setStatus('exchanging');
    try {
      const res = await fetch(`${TUNNEL_SERVER_URL}/t/${encodeURIComponent(tunnelId)}/auth/session-exchange`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || 'Failed to create session');
        setStatus('error');
        return;
      }

      // Clean up sessionStorage
      sessionStorage.removeItem('__egdesk_tunnel_pending');

      // Redirect back to the custom domain with the session token
      const url = new URL(redirect);
      url.searchParams.set('__egdesk_session', data.session_token);
      window.location.href = url.toString();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
      setStatus('error');
    }
  }, [redirect, tunnelId, session?.access_token]);

  useEffect(() => {
    if (loading) return;

    if (!redirect || !tunnelId) {
      setError('Missing redirect URL or tunnel ID');
      setStatus('error');
      return;
    }

    if (user && session) {
      // Already logged in — exchange token immediately
      exchangeAndRedirect();
    } else {
      setStatus('login');
    }
  }, [loading, user, session, redirect, tunnelId, exchangeAndRedirect]);

  const handleLogin = async () => {
    try {
      // Store tunnel params in sessionStorage so they survive the OAuth round-trip.
      // Supabase may strip custom query params from redirectTo.
      sessionStorage.setItem('__egdesk_tunnel_pending', JSON.stringify({ redirect, tunnelId }));

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/tunnel-login`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
      setStatus('error');
    }
  };

  // Extract domain for display
  let displayDomain = '';
  try {
    if (redirect) displayDomain = new URL(redirect).hostname;
  } catch {}

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
          <h1 style={{ color: '#fafafa', fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>
            Private Access
          </h1>
          {displayDomain && (
            <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0 }}>
              <strong style={{ color: '#d4d4d8' }}>{displayDomain}</strong> requires authentication
            </p>
          )}
        </div>

        {status === 'loading' && (
          <div style={{ color: '#a1a1aa', fontSize: '14px' }}>
            <div style={{
              width: '24px', height: '24px',
              border: '3px solid #3f3f46', borderTopColor: '#3b82f6',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            Loading...
          </div>
        )}

        {status === 'login' && (
          <button
            onClick={handleLogin}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              width: '100%', padding: '12px 20px',
              background: '#fafafa', color: '#18181b',
              border: 'none', borderRadius: '8px',
              fontSize: '15px', fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        )}

        {status === 'exchanging' && (
          <div style={{ color: '#a1a1aa', fontSize: '14px' }}>
            <div style={{
              width: '24px', height: '24px',
              border: '3px solid #3f3f46', borderTopColor: '#22c55e',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            Verifying access...
          </div>
        )}

        {status === 'error' && (
          <div>
            <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </p>
            <button
              onClick={() => window.location.href = redirect || '/'}
              style={{
                padding: '8px 16px', background: '#27272a', color: '#fafafa',
                border: '1px solid #3f3f46', borderRadius: '6px',
                fontSize: '13px', cursor: 'pointer',
              }}
            >
              Go back
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
