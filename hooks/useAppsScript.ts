import { useState } from 'react';

interface CreateProjectResult {
  scriptId: string;
  scriptUrl?: string;
}

export function useAppsScript() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = async (title: string, parentId?: string): Promise<CreateProjectResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/google/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, parentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create script project');
      }

      return {
        scriptId: data.scriptId,
        scriptUrl: data.scriptUrl,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (scriptId: string, files: any[]): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/google/scripts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scriptId, files }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update script content');
      }

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { 
    createProject, 
    updateContent,
    loading, 
    error 
  };
}
