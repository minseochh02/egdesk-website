import { useState, useCallback, useRef, useEffect } from 'react';
import { SpreadsheetContext } from './types';

interface UseSpreadsheetContextProps {
  projectId: string;
  callTool: (name: string, args: any) => Promise<any>;
  callSheetsTool: (name: string, args: any) => Promise<any>;
}

export function useSpreadsheetContext({
  projectId,
  callTool,
  callSheetsTool
}: UseSpreadsheetContextProps) {
  const [spreadsheetContext, setSpreadsheetContext] = useState<SpreadsheetContext>({
    spreadsheetId: '',
    spreadsheetUrl: '',
    sheets: [],
    isLoading: true,
  });

  // Use refs to avoid dependency issues with callback functions
  const callToolRef = useRef(callTool);
  const callSheetsToolRef = useRef(callSheetsTool);
  
  useEffect(() => {
    callToolRef.current = callTool;
    callSheetsToolRef.current = callSheetsTool;
  }, [callTool, callSheetsTool]);

  const loadSpreadsheetContext = useCallback(async () => {
    setSpreadsheetContext(prev => ({ ...prev, isLoading: true, error: undefined }));
    try {
      const projectResult = await callToolRef.current('apps_script_get_project', { projectId });
      let spreadsheetId = '';
      let spreadsheetUrl = '';
      if (projectResult?.content?.[0]?.text) {
        try {
          const parsed = JSON.parse(projectResult.content[0].text);
          spreadsheetId = parsed.spreadsheetId || '';
          spreadsheetUrl = parsed.spreadsheetUrl || '';
        } catch (e) { console.warn('Failed to parse project details:', e); }
      } else if (projectResult?.spreadsheetId) {
        spreadsheetId = projectResult.spreadsheetId;
        spreadsheetUrl = projectResult.spreadsheetUrl || '';
      }

      if (!spreadsheetId) {
        setSpreadsheetContext({ spreadsheetId: '', spreadsheetUrl: '', sheets: [], isLoading: false });
        return;
      }

      const sheetsResult = await callSheetsToolRef.current('sheets_get_full_context', { spreadsheetId, sampleRows: 5 });
      let spreadsheetName = '';
      let sheetsData: SpreadsheetContext['sheets'] = [];
      if (sheetsResult?.content?.[0]?.text) {
        try {
          const parsed = JSON.parse(sheetsResult.content[0].text);
          spreadsheetName = parsed.metadata?.title || '';
          sheetsData = parsed.sheetsData || [];
        } catch (e) { console.warn('Failed to parse sheets context:', e); }
      } else if (sheetsResult?.metadata) {
        spreadsheetName = sheetsResult.metadata.title || '';
        sheetsData = sheetsResult.sheetsData || [];
      }

      setSpreadsheetContext({ spreadsheetId, spreadsheetUrl, spreadsheetName, sheets: sheetsData, isLoading: false });
    } catch (err) {
      console.error('Error loading spreadsheet context:', err);
      setSpreadsheetContext(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'Failed to load spreadsheet context' }));
    }
  }, [projectId]); // Only depend on projectId, use refs for functions

  return {
    spreadsheetContext,
    loadSpreadsheetContext
  };
}

