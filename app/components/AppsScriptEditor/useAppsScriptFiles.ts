import { useState, useCallback, useEffect } from 'react';
import { ScriptFile } from './types';

interface UseAppsScriptFilesProps {
  projectId: string;
  projectName?: string;
  callTool: (name: string, args: any) => Promise<any>;
  createSpreadsheetWithScript: (title: string, scriptTitle: string, files: any[]) => Promise<any>;
}

export function useAppsScriptFiles({
  projectId,
  projectName,
  callTool,
  createSpreadsheetWithScript
}: UseAppsScriptFilesProps) {
  const [files, setFiles] = useState<ScriptFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pushed' | 'pulled' | 'error'>('idle');
  const [lastPushedVersion, setLastPushedVersion] = useState<number | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);

  const loadFiles = useCallback(async () => {
    setIsLoadingFiles(true);
    setError(null);
    try {
      const result = await callTool('apps_script_list_files', { projectId });
      if (result && !result.error) {
        let parsedFiles: ScriptFile[] = [];
        const normalizeFile = (file: any): ScriptFile => {
          if (typeof file === 'string') {
            let type = 'server_js';
            if (file.endsWith('.html')) type = 'html';
            else if (file.endsWith('.json')) type = 'json';
            else if (file.endsWith('.gs')) type = 'server_js';
            return { name: file, type };
          }
          return {
            name: file.name,
            type: file.type || (file.name.endsWith('.html') ? 'html' : file.name.endsWith('.json') ? 'json' : 'server_js'),
            id: file.id
          };
        };

        if (Array.isArray(result)) parsedFiles = result.map(normalizeFile);
        else if (result.content && Array.isArray(result.content)) {
          if (typeof result.content[0] === 'string') parsedFiles = result.content.map(normalizeFile);
          else if (typeof result.content[0] === 'object') {
            if (result.content[0].text) {
              try {
                const parsed = JSON.parse(result.content[0].text);
                const list = Array.isArray(parsed) ? parsed : parsed.files || [];
                parsedFiles = list.map(normalizeFile);
              } catch (e) { console.error('Failed to parse files list:', e); }
            } else parsedFiles = result.content.map(normalizeFile);
          }
        } else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) {
          const list = result.content.files || [];
          parsedFiles = list.map(normalizeFile);
        } else if (result.files) parsedFiles = result.files.map(normalizeFile);

        setFiles(parsedFiles);
        setIsAuthError(false);
        if (parsedFiles.length > 0 && !selectedFile) {
          // We can't call handleFileSelect directly here as it's defined below
        }
      } else setError(result?.error || 'Failed to load files');
    } catch (err: any) {
      console.error('Error loading files:', err);
      if (err.message?.includes('No Google OAuth token available') || err.message?.includes('sign in with Google')) setIsAuthError(true);
      else setError(err instanceof Error ? err.message : 'Unknown error loading files');
    } finally { setIsLoadingFiles(false); }
  }, [projectId, callTool, selectedFile]);

  const handleFileSelect = useCallback(async (fileName: string) => {
    if (selectedFile === fileName && fileContent) return;
    setSelectedFile(fileName);
    setIsLoadingContent(true);
    setSaveStatus('idle');
    const fileObj = files.find(f => f.name === fileName);
    if (fileObj?.source) {
      setFileContent(fileObj.source);
      setIsLoadingContent(false);
      return;
    }
    try {
      const result = await callTool('apps_script_read_file', { projectId, fileName });
      if (result && !result.error) {
        let content = '';
        if (typeof result === 'string') content = result;
        else if (result.content?.[0]?.text) {
          const text = result.content[0].text;
          content = typeof text === 'object' ? JSON.stringify(text, null, 2) : text;
        } else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) content = JSON.stringify(result.content, null, 2);
        else if (result.data) content = typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data;
        else if (typeof result === 'object') content = JSON.stringify(result, null, 2);
        else content = String(result);
        setFileContent(content);
      } else setError(result?.error || `Failed to read ${fileName}`);
    } catch (err) {
      console.error('Error reading file:', err);
      setError(err instanceof Error ? err.message : `Error reading ${fileName}`);
    } finally { setIsLoadingContent(false); }
  }, [projectId, callTool, selectedFile, fileContent, files]);

  // Initial load
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      handleFileSelect(files[0].name);
    }
  }, [files, selectedFile, handleFileSelect]);

  const handleSave = useCallback(async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const result = await callTool('apps_script_write_file', { projectId, fileName: selectedFile, content: fileContent });
      if (result && !result.error) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setError(result?.error || 'Failed to save file');
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Error saving file:', err);
      setError(err instanceof Error ? err.message : 'Error saving file');
      setSaveStatus('error');
    } finally { setIsSaving(false); }
  }, [projectId, callTool, selectedFile, fileContent]);

  const handlePushToGoogle = useCallback(async () => {
    if (!confirm('Push local changes to Google Apps Script and create a new version?')) return;
    setIsPushing(true);
    setSyncStatus('idle');
    setError(null);
    try {
      const result = await callTool('apps_script_push_to_google', { projectId, createVersion: true, versionDescription: `Push from EGDesk at ${new Date().toLocaleString()}` });
      if (result && !result.error) {
        let parsed = result;
        if (result.content?.[0]?.text) try { parsed = JSON.parse(result.content[0].text); } catch { parsed = result; }
        setSyncStatus('pushed');
        if (parsed.versionNumber) setLastPushedVersion(parsed.versionNumber);
        else setLastPushedVersion(null);
        setTimeout(() => { setSyncStatus('idle'); setLastPushedVersion(null); }, 4000);
      } else {
        setError(result?.error || 'Failed to push to Google');
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Error pushing to Google:', err);
      setError(err instanceof Error ? err.message : 'Error pushing to Google');
      setSyncStatus('error');
    } finally { setIsPushing(false); }
  }, [projectId, callTool]);

  const handlePullFromGoogle = useCallback(async () => {
    if (!confirm('Pull latest from Google Apps Script?')) return;
    setIsPulling(true);
    setSyncStatus('idle');
    setError(null);
    try {
      const result = await callTool('apps_script_pull_from_google', { projectId });
      if (result && !result.error) {
        setSyncStatus('pulled');
        await loadFiles();
        if (selectedFile) {
          const currentFile = selectedFile;
          setSelectedFile(null);
          setFileContent('');
          setTimeout(() => handleFileSelect(currentFile), 100);
        }
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setError(result?.error || 'Failed to pull from Google');
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Error pulling from Google:', err);
      setError(err instanceof Error ? err.message : 'Error pulling from Google');
      setSyncStatus('error');
    } finally { setIsPulling(false); }
  }, [projectId, callTool, loadFiles, selectedFile, handleFileSelect]);

  const handleDeployDevVersion = useCallback(async () => {
    setIsDeploying(true);
    setError(null);
    try {
      if (!files || files.length === 0) throw new Error('No files to deploy');
      const scriptFiles = files.map(f => {
        let type = f.type;
        if (type === 'gs' || type === 'server_js') type = 'SERVER_JS';
        if (type === 'html') type = 'HTML';
        if (type === 'json') type = 'JSON';
        const name = f.name.replace(/\.(gs|html|json)$/, '');
        return { name, type: type.toUpperCase(), source: f.source || '' };
      });
      const devTitle = `[DEV] ${projectName || 'Untitled'} - ${new Date().toLocaleString()}`;
      const result = await createSpreadsheetWithScript(devTitle, `${devTitle} Script`, scriptFiles);
      if (result) {
        if (result.scriptError) alert(`Spreadsheet created but script creation had issues: ${result.scriptError}`);
        else if (confirm(`✅ Successfully created Dev Version!\n\nDo you want to open the new spreadsheet?`)) window.open(result.spreadsheetUrl, '_blank');
      } else throw new Error('Failed to create dev version');
    } catch (err) {
      console.error('Error deploying dev version:', err);
      setError(err instanceof Error ? err.message : 'Error deploying dev version');
    } finally { setIsDeploying(false); }
  }, [files, projectName, createSpreadsheetWithScript]);

  const handleRestoreVersion = useCallback(async (version: number, versionFiles: ScriptFile[]) => {
    if (!confirm(`Are you sure you want to restore version ${version} to your local workspace?`)) return;
    setIsSaving(true);
    try {
      let successCount = 0;
      let failCount = 0;
      for (const file of versionFiles) {
        if (!file.source) continue;
        try {
          await callTool('apps_script_write_file', { projectId, fileName: file.name, content: file.source });
          successCount++;
        } catch (e) { console.error(`Failed to restore file ${file.name}:`, e); failCount++; }
      }
      if (failCount === 0) {
        alert(`Successfully restored ${successCount} files from version ${version}.`);
        await loadFiles();
      } else alert(`Restored ${successCount} files, but failed to restore ${failCount} files.`);
    } catch (err) {
      console.error('Error restoring version:', err);
      setError(err instanceof Error ? err.message : 'Error restoring version');
    } finally { setIsSaving(false); }
  }, [projectId, callTool, loadFiles]);

  return {
    files,
    setFiles,
    selectedFile,
    setSelectedFile,
    fileContent,
    setFileContent,
    isLoadingFiles,
    isLoadingContent,
    isSaving,
    isPushing,
    isPulling,
    isDeploying,
    error,
    setError,
    saveStatus,
    syncStatus,
    lastPushedVersion,
    isAuthError,
    setIsAuthError,
    loadFiles,
    handleFileSelect,
    handleSave,
    handlePushToGoogle,
    handlePullFromGoogle,
    handleDeployDevVersion,
    handleRestoreVersion
  };
}

