'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TUNNEL_SERVICE_URL = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';

interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export function useMCPTools(serverKey: string) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callTool = async (toolName: string, args: Record<string, any> = {}) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${TUNNEL_SERVICE_URL}/t/${serverKey}/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listDirectory = async (path: string = '/') => {
    return await callTool('fs_list_directory', { path });
  };

  const readFile = async (path: string) => {
    return await callTool('fs_read_file', { path });
  };

  const getFileInfo = async (path: string) => {
    return await callTool('fs_get_file_info', { path });
  };

  return {
    callTool,
    listDirectory,
    readFile,
    getFileInfo,
    loading,
    error,
  };
}

