// egdesk-website/hooks/useAppsScript.ts

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ScriptFile {
  name: string;
  type: string; // e.g., 'CODE_JS', 'HTML', 'JSON'
  source: string;
}

interface CreateProjectResult {
  success: boolean;
  scriptId?: string;
  projectData?: any;
  error?: string;
}

interface UpdateContentResult {
  success: boolean;
  error?: string;
}

interface DeployWebAppResult {
  success: boolean;
  deploymentId?: string;
  webAppUrl?: string;
  error?: string;
}

export function useAppsScript() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callApi = async <T>(endpoint: string, method: string, body?: any): Promise<T> => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    setError(null);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data as T;
    } catch (err: any) {
      console.error(`API call to ${endpoint} failed:`, err);
      setError(err.message || 'An unknown error occurred');
      throw err;
    }
  };

  const createProject = async (
    title: string,
    spreadsheetId?: string
  ): Promise<CreateProjectResult> => {
    setLoading(true);
    try {
      const result = await callApi<CreateProjectResult>('/api/google/scripts', 'POST', { title, spreadsheetId });
      return result;
    } catch (err) {
      return { success: false, error: error || 'Failed to create Apps Script project' };
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (
    scriptId: string,
    fileName: string,
    content: string
  ): Promise<UpdateContentResult> => {
    setLoading(true);
    try {
      const result = await callApi<UpdateContentResult>('/api/google/scripts', 'PUT', { scriptId, fileName, content });
      return result;
    } catch (err) {
      return { success: false, error: error || 'Failed to update Apps Script file' };
    } finally {
      setLoading(false);
    }
  };

  const deployWebApp = async (
    scriptId: string,
    options?: { versionNumber?: number; description?: string; access?: string; executeAs?: string }
  ): Promise<DeployWebAppResult> => {
    setLoading(true);
    try {
      // This would require a new API endpoint in /api/google/scripts/deploy
      // For now, this is a placeholder and would likely require direct Apps Script API interaction
      // which could be complex to implement directly via Next.js API route without a proxy.
      // It's more likely this functionality would be exposed via the MCP tunnel initially.
      console.warn('deployWebApp is a placeholder and not fully implemented via direct API route.');
      return { success: false, error: 'Deployment via direct API route not fully implemented yet.' };
    } catch (err) {
      return { success: false, error: error || 'Failed to deploy web app' };
    } finally {
      setLoading(false);
    }
  };

  return {
    createProject,
    updateContent,
    deployWebApp,
    loading,
    error,
  };
}

