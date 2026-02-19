'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface CodingProject {
  projectName: string;
  folderPath: string;
  port: number;
  url: string;
  status: 'running' | 'stopped' | 'error';
  registeredAt: string;
}

export function useCodingProjects(tunnelId: string | null) {
  const { session } = useAuth();
  const [projects, setProjects] = useState<CodingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tunnelId || !session?.access_token) {
      setProjects([]);
      setLoading(false);
      return;
    }

    fetchCodingProjects();

    // Poll every 5 seconds to keep projects list updated
    const interval = setInterval(fetchCodingProjects, 5000);

    return () => clearInterval(interval);
  }, [tunnelId, session?.access_token]);

  const fetchCodingProjects = async () => {
    if (!tunnelId || !session?.access_token) return;

    try {
      // Call tunnel service API endpoint to get coding projects
      // This endpoint will forward to EGDesk which queries the project registry
      const response = await fetch(
        `https://tunneling-service.onrender.com/t/${tunnelId}/api/coding-projects`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch coding projects: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.projects) {
        setProjects(data.projects);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching coding projects:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    loading,
    error,
    refresh: fetchCodingProjects,
  };
}
