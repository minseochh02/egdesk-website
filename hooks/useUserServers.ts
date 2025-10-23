'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface MCPServer {
  id: string;
  name: string;
  description: string | null;
  server_key: string;
  status: string;
  access_level: 'read_only' | 'read_write' | 'admin';
  permission_status: 'pending' | 'active' | 'revoked' | 'expired';
  granted_at: string;
  activated_at: string | null;
  expires_at: string | null;
}

export function useUserServers() {
  const { user } = useAuth();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) {
      setServers([]);
      setLoading(false);
      return;
    }

    fetchUserServers();
  }, [user]);

  const fetchUserServers = async () => {
    if (!user?.email) return;

    setLoading(true);
    setError(null);

    try {
      // Query Supabase directly for permissions
      const { data: permissions, error: queryError } = await supabase
        .from('mcp_server_permissions')
        .select(`
          *,
          mcp_servers!inner(*)
        `)
        .eq('allowed_email', user.email);

      if (queryError) {
        throw queryError;
      }

      if (!permissions || permissions.length === 0) {
        setServers([]);
        setLoading(false);
        return;
      }

      // Format server list
      const formattedServers: MCPServer[] = permissions.map((perm: any) => {
        const server = perm.mcp_servers;
        return {
          id: server.id,
          name: server.name,
          description: server.description,
          server_key: server.server_key,
          status: server.status,
          access_level: perm.access_level,
          permission_status: perm.status,
          granted_at: perm.granted_at,
          activated_at: perm.activated_at,
          expires_at: perm.expires_at,
        };
      });

      setServers(formattedServers);
    } catch (err) {
      console.error('Error fetching user servers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    servers,
    loading,
    error,
    refresh: fetchUserServers,
  };
}

