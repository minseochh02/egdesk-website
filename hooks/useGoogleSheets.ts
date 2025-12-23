import { useState } from 'react';

interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  scriptId?: string;
  scriptUrl?: string;
  scriptError?: string;
}

export function useGoogleSheets() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSpreadsheet = async (title: string): Promise<CreateSpreadsheetResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/google/spreadsheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create spreadsheet');
      }

      return {
        spreadsheetId: data.spreadsheetId,
        spreadsheetUrl: data.spreadsheetUrl,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createSpreadsheetWithScript = async (
    title: string, 
    scriptTitle?: string,
    initialFiles?: any[]
  ): Promise<CreateSpreadsheetResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/google/spreadsheet-with-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          scriptTitle,
          initialFiles
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create spreadsheet with script');
      }

      return {
        spreadsheetId: data.spreadsheetId,
        spreadsheetUrl: data.spreadsheetUrl,
        scriptId: data.scriptId,
        scriptUrl: data.scriptUrl,
        scriptError: data.scriptError,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { 
    createSpreadsheet, 
    createSpreadsheetWithScript, 
    loading, 
    error 
  };
}
