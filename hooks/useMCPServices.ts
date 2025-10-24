'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TUNNEL_SERVICE_URL = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';

export interface MCPService {
  name: string;
  description: string;
  endpoints: {
    tools: string;
    call: string;
  };
  status: 'active' | 'inactive';
}

interface MCPServicesResponse {
  success: boolean;
  message?: string;
  version?: string;
  servers: MCPService[];
  totalServers: number;
  timestamp?: string;
}

export function useMCPServices(serverKey: string) {
  const { session } = useAuth();
  const [services, setServices] = useState<MCPService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    if (!session?.access_token || !serverKey) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch list of available MCP services
      const response = await fetch(`${TUNNEL_SERVICE_URL}/t/${serverKey}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MCPServicesResponse = await response.json();
      
      if (data.success && data.servers) {
        console.log('📋 Available MCP Services:', data.servers);
        setServices(data.servers);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching MCP services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [serverKey, session]);

  return {
    services,
    loading,
    error,
    refresh: fetchServices,
  };
}

