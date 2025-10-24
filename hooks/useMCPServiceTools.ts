'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TUNNEL_SERVICE_URL = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export function useMCPServiceTools(serverKey: string, serviceName: string) {
  const { session } = useAuth();
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = async () => {
    if (!session?.access_token || !serverKey || !serviceName) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch list of available tools for this service
      const response = await fetch(`${TUNNEL_SERVICE_URL}/t/${serverKey}/${serviceName}/tools`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // The server returns the tools array directly, not wrapped
      if (Array.isArray(data)) {
        console.log(`📋 Available tools for ${serviceName}:`, data);
        setTools(data);
      } else {
        throw new Error('Invalid response format - expected array of tools');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error(`Error fetching ${serviceName} tools:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, [serverKey, serviceName, session]);

  return {
    tools,
    loading,
    error,
    refresh: fetchTools,
  };
}

