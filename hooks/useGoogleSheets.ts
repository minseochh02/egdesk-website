// egdesk-website/hooks/useGoogleSheets.ts

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CreateSpreadsheetResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}

interface CreateSpreadsheetWithScriptResult extends CreateSpreadsheetResult {
  scriptId?: string;
}

export function useGoogleSheets() {
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
          // Pass Supabase access token, which will be used to verify user in API route
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

  const createSpreadsheet = async (
    title: string
  ): Promise<CreateSpreadsheetResult> => {
    setLoading(true);
    try {
      const result = await callApi<CreateSpreadsheetResult>('/api/google/spreadsheets', 'POST', { title });
      return result;
    } catch (err) {
      return { success: false, error: error || 'Failed to create spreadsheet' };
    } finally {
      setLoading(false);
    }
  };

  const createSpreadsheetWithScript = async (
    spreadsheetTitle: string,
    scriptTitle?: string,
    initialScriptContent?: string
  ): Promise<CreateSpreadsheetWithScriptResult> => {
    setLoading(true);
    try {
      const result = await callApi<CreateSpreadsheetWithScriptResult>(
        '/api/google/spreadsheet-with-script',
        'POST',
        {
          spreadsheetTitle,
          scriptTitle,
          initialScriptContent,
        }
      );
      return result;
    } catch (err) {
      return { success: false, error: error || 'Failed to create spreadsheet with script' };
    } finally {
      setLoading(false);
    }
  };

  // This function would be for direct Google API calls, not via MCP tunnel
  // For now, we will rely on MCP tools for reading existing spreadsheets
  const getSpreadsheet = async (spreadsheetId: string) => {
    console.warn('getSpreadsheet not implemented for direct Google API access yet. Use MCP tools for reading.');
    return { success: false, error: 'Not implemented' };
  };

  return {
    createSpreadsheet,
    createSpreadsheetWithScript,
    getSpreadsheet,
    loading,
    error,
  };
}

