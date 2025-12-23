import { useState, useCallback } from 'react';
import { ScriptFile, VersionInfo } from './types';

interface UseAppsScriptVersionsProps {
  projectId: string;
  devScriptId?: string;
  callTool: (name: string, args: any) => Promise<any>;
  setIsAuthError: (error: boolean) => void;
  loadFiles: () => Promise<void>;
  setFiles: (files: ScriptFile[]) => void;
  setSelectedFile: (file: string | null) => void;
  setFileContent: (content: string) => void;
  setError: (error: string | null) => void;
}

export function useAppsScriptVersions({
  projectId,
  devScriptId,
  callTool,
  setIsAuthError,
  loadFiles,
  setFiles,
  setSelectedFile,
  setFileContent,
  setError
}: UseAppsScriptVersionsProps) {
  const [devVersions, setDevVersions] = useState<VersionInfo[]>([]);
  const [selectedDevVersion, setSelectedDevVersion] = useState<number | null>(null);
  const [isLoadingDevVersions, setIsLoadingDevVersions] = useState(false);
  const [showDevVersionDropdown, setShowDevVersionDropdown] = useState(false);

  const [prodVersions, setProdVersions] = useState<VersionInfo[]>([]);
  const [selectedProdVersion, setSelectedProdVersion] = useState<number | null>(null);
  const [isLoadingProdVersions, setIsLoadingProdVersions] = useState(false);
  const [showProdVersionDropdown, setShowProdVersionDropdown] = useState(false);

  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);

  const [activeVersionEnv, setActiveVersionEnv] = useState<'dev' | 'prod' | null>(null);

  const loadDevVersions = useCallback(async () => {
    if (!devScriptId) { setDevVersions([]); return; }
    setIsLoadingDevVersions(true);
    try {
      const result = await callTool('apps_script_list_versions', { projectId: devScriptId });
      if (result && !result.error) {
        let list: any[] = [];
        if (result.content?.[0]?.text) try { const parsed = JSON.parse(result.content[0].text); list = parsed.versions || parsed || []; } catch { list = []; }
        else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) list = result.content.versions || [];
        else if (result.versions) list = result.versions;
        else if (Array.isArray(result)) list = result;
        list.sort((a: any, b: any) => (b.versionNumber || 0) - (a.versionNumber || 0));
        setDevVersions(list);
      }
    } catch (err) { console.error('Error loading DEV versions:', err); }
    finally { setIsLoadingDevVersions(false); }
  }, [devScriptId, callTool]);

  const loadProdVersions = useCallback(async () => {
    setIsLoadingProdVersions(true);
    try {
      const result = await callTool('apps_script_list_versions', { projectId });
      if (result && !result.error) {
        let list: any[] = [];
        if (result.content?.[0]?.text) try { const parsed = JSON.parse(result.content[0].text); list = parsed.versions || parsed || []; } catch { list = []; }
        else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) list = result.content.versions || [];
        else if (result.versions) list = result.versions;
        else if (Array.isArray(result)) list = result;
        list.sort((a: any, b: any) => (b.versionNumber || 0) - (a.versionNumber || 0));
        setProdVersions(list);
      }
    } catch (err) { console.error('Error loading PROD versions:', err); }
    finally { setIsLoadingProdVersions(false); }
  }, [projectId, callTool]);

  const loadVersions = useCallback(async () => {
    setIsLoadingVersions(true);
    try {
      const result = await callTool('apps_script_list_versions', { projectId });
      if (result && !result.error) {
        setIsAuthError(false);
        let list: any[] = [];
        if (result.content?.[0]?.text) try { const parsed = JSON.parse(result.content[0].text); list = parsed.versions || parsed || []; } catch { list = []; }
        else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) list = result.content.versions || [];
        else if (result.versions) list = result.versions;
        else if (Array.isArray(result)) list = result;
        list.sort((a: any, b: any) => (b.versionNumber || 0) - (a.versionNumber || 0));
        setVersions(list);
      }
    } catch (err: any) {
      console.error('Error loading versions:', err);
      if (err.message?.includes('No Google OAuth token available') || err.message?.includes('sign in with Google')) setIsAuthError(true);
    } finally { setIsLoadingVersions(false); }
  }, [projectId, callTool, setIsAuthError]);

  const handleVersionSelect = useCallback(async (version: number | null, env: 'dev' | 'prod' | 'legacy' = 'prod') => {
    const targetProjectId = env === 'dev' ? devScriptId : projectId;
    if (!targetProjectId) return;

    if (env === 'dev') { setSelectedDevVersion(version); setSelectedProdVersion(null); setSelectedVersion(null); setActiveVersionEnv(version ? 'dev' : null); setShowDevVersionDropdown(false); }
    else if (env === 'prod') { setSelectedProdVersion(version); setSelectedDevVersion(null); setSelectedVersion(null); setActiveVersionEnv(version ? 'prod' : null); setShowProdVersionDropdown(false); }
    else { setSelectedVersion(version); setSelectedDevVersion(null); setSelectedProdVersion(null); setActiveVersionEnv(null); setShowVersionDropdown(false); }

    if (version === null) { await loadFiles(); return; }

    setError(null);
    try {
      const result = await callTool('apps_script_get_version_content', { projectId: targetProjectId, versionNumber: version });
      if (result && !result.error) {
        let filesData: any[] = [];
        if (result.content?.[0]?.text) try { const parsed = JSON.parse(result.content[0].text); filesData = parsed.files || []; } catch { filesData = []; }
        else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) filesData = result.content.files || [];
        else if (result.files) filesData = result.files;
        
        const versionFiles = filesData.map((f: any) => ({ name: f.name, type: f.type, source: f.source }));
        setFiles(versionFiles);
        if (versionFiles.length > 0) { setSelectedFile(versionFiles[0].name); setFileContent(versionFiles[0].source || ''); }
        else { setSelectedFile(null); setFileContent(''); }
      } else setError(result?.error || 'Failed to load version content');
    } catch (err) {
      console.error('Error loading version content:', err);
      setError(err instanceof Error ? err.message : 'Error loading version content');
    }
  }, [projectId, devScriptId, callTool, loadFiles, setFiles, setSelectedFile, setFileContent, setError]);

  return {
    devVersions,
    selectedDevVersion,
    isLoadingDevVersions,
    showDevVersionDropdown,
    setShowDevVersionDropdown,
    prodVersions,
    selectedProdVersion,
    isLoadingProdVersions,
    showProdVersionDropdown,
    setShowProdVersionDropdown,
    versions,
    selectedVersion,
    isLoadingVersions,
    showVersionDropdown,
    setShowVersionDropdown,
    activeVersionEnv,
    setActiveVersionEnv,
    loadDevVersions,
    loadProdVersions,
    loadVersions,
    handleVersionSelect,
    setSelectedDevVersion,
    setSelectedProdVersion,
    setSelectedVersion
  };
}

