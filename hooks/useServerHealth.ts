'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TUNNEL_SERVICE_URL = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';

interface ServerHealth {
  [serverKey: string]: {
    online: boolean;
    lastChecked: number;
    error?: string;
  };
}

export function useServerHealth(serverKeys: string[]) {
  const { session } = useAuth();
  const [healthStatus, setHealthStatus] = useState<ServerHealth>({});
  const [checking, setChecking] = useState(false);

  // Memoize the server keys array to prevent infinite loops
  const stableServerKeys = useMemo(() => serverKeys, [JSON.stringify(serverKeys.sort())]);

  const checkServerHealth = useCallback(async (serverKey: string) => {
    if (!session?.access_token) {
      return { online: false, error: 'Not authenticated' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout (reduced from 5s)

      const response = await fetch(`${TUNNEL_SERVICE_URL}/t/${serverKey}/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { online: true };
      } else {
        return { online: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { online: false, error: 'Timeout' };
        }
        return { online: false, error: error.message };
      }
      return { online: false, error: 'Unknown error' };
    }
  }, [session]);

  const checkAllServers = useCallback(async () => {
    if (stableServerKeys.length === 0 || !session) return;

    setChecking(true);
    const results: ServerHealth = {};

    // Check all servers in parallel
    await Promise.all(
      stableServerKeys.map(async (serverKey) => {
        const health = await checkServerHealth(serverKey);
        results[serverKey] = {
          ...health,
          lastChecked: Date.now(),
        };
      })
    );

    setHealthStatus(results);
    setChecking(false);
  }, [stableServerKeys, session, checkServerHealth]);

  // Initial check (only run when server keys change)
  useEffect(() => {
    checkAllServers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableServerKeys]);

  // Periodic health checks every 2 minutes (reduced frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      checkAllServers();
    }, 120000); // 2 minutes instead of 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    healthStatus,
    checking,
    refresh: checkAllServers,
  };
}

