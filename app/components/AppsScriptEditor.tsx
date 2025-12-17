'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMCPTools } from '@/hooks/useMCPTools';
import { useConversations, ConversationMessage } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Code, 
  FileCode, 
  Save, 
  RefreshCw, 
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Send,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  User,
  Bot,
  Table2,
  Cloud,
  CloudOff,
  Upload,
  Download,
  Play,
  History,
  ChevronDown,
  ChevronUp,
  GitBranch,
  RotateCcw,
  Settings
} from 'lucide-react';

interface AppsScriptEditorProps {
  projectId: string;
  projectName?: string;
  serverKey: string;
  serviceName?: string;
  onConversationChange?: (conversationId: string | undefined) => void;
}

interface ScriptFile {
  name: string;
  type: string;
  source?: string;
  id?: string;
}

interface SpreadsheetContext {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetName?: string;
  sheets: Array<{
    sheetTitle: string;
    headers: string[];
    sampleData: string[][];
    rowCount: number;
    columnCount: number;
  }>;
  isLoading: boolean;
  error?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    name: string;
    args: any;
    result?: any;
  }>;
}

export default function AppsScriptEditor({ 
  projectId, 
  projectName, 
  serverKey, 
  serviceName = 'apps-script',
  onConversationChange
}: AppsScriptEditorProps) {
  // State
  const [files, setFiles] = useState<ScriptFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ success: boolean; result?: any; error?: string; logs?: string[] } | null>(null);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [functionToRun, setFunctionToRun] = useState('');
  const [availableFunctions, setAvailableFunctions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pushed' | 'pulled' | 'error'>('idle');
  const [lastPushedVersion, setLastPushedVersion] = useState<number | null>(null);

  // Version History State
  const [versions, setVersions] = useState<Array<{ versionNumber: number; description?: string; createTime: string }>>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  // Maintain conversation history for AI context across messages
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

  // Model Selection State
  const [availableModels, setAvailableModels] = useState<Array<{ modelId: string; displayName: string }>>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // MCP Hooks
  const { callTool, loading: mcpLoading } = useMCPTools(serverKey, serviceName);
  const { callTool: callSheetsTool } = useMCPTools(serverKey, 'sheets');

  // Auth context
  const { user } = useAuth();

  // Conversations hook for persistence
  const {
    currentConversation,
    messages: persistedMessages,
    isLoading: conversationsLoading,
    isConnected: conversationsConnected,
    pendingCount,
    createConversation,
    loadConversation,
    saveMessage,
    listConversations,
  } = useConversations(serverKey);

  // Spreadsheet context state
  const [spreadsheetContext, setSpreadsheetContext] = useState<SpreadsheetContext>({
    spreadsheetId: '',
    spreadsheetUrl: '',
    sheets: [],
    isLoading: true,
  });

  // Fetch files on mount
  useEffect(() => {
    loadFiles();
    loadVersions();
  }, [projectId, serverKey, serviceName]);

  // Fetch available Gemini models on mount
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const response = await fetch('/api/gemini');
        if (response.ok) {
          const data = await response.json();
          // Filter to only show generateContent-capable models
          const contentModels = (data.models || []).filter((m: any) => 
            m.supportedGenerationMethods?.includes('generateContent')
          );
          setAvailableModels(contentModels);
          setDefaultModel(data.defaultModel || '');
          // Set initial selection to default model
          if (!selectedModel && data.defaultModel) {
            setSelectedModel(data.defaultModel);
          }
        }
      } catch (err) {
        console.error('Failed to fetch Gemini models:', err);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  // Extract function names from script files
  const extractFunctions = useCallback(() => {
    if (!files || files.length === 0) {
      console.log('🔍 No script files found for function detection');
      setAvailableFunctions([]);
      return;
    }

    const functions: string[] = [];
    const functionRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;

    console.log('🔍 Scanning files for functions:', files.map(f => ({ name: f.name, type: f.type, hasSource: !!f.source })));

    for (const file of files) {
      // Check for .gs files - type could be 'server_js', 'SERVER_JS', or file name ends with .gs
      const isGsFile = 
        file.type?.toLowerCase() === 'server_js' || 
        file.name?.endsWith('.gs') ||
        file.type === 'SERVER_JS';
      
      // Use file.source if available, or use fileContent if this is the selected file
      let sourceToScan = file.source;
      if (!sourceToScan && file.name === selectedFile && fileContent) {
        sourceToScan = fileContent;
      }
      
      if (isGsFile && sourceToScan) {
        // Reset regex lastIndex for each file
        functionRegex.lastIndex = 0;
        let match;
        while ((match = functionRegex.exec(sourceToScan)) !== null) {
          const funcName = match[1];
          // Skip private functions (starting with _)
          if (!funcName.startsWith('_') && !functions.includes(funcName)) {
            functions.push(funcName);
          }
        }
        console.log(`📄 Found functions in ${file.name}:`, functions.length);
      }
    }

    // Sort alphabetically, but put common entry points first
    const priorityFunctions = ['doGet', 'doPost', 'onOpen', 'onEdit', 'onInstall', 'main', 'run'];
    functions.sort((a, b) => {
      const aIdx = priorityFunctions.indexOf(a);
      const bIdx = priorityFunctions.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });

    console.log('✅ Total functions detected:', functions);
    setAvailableFunctions(functions);
  }, [files, selectedFile, fileContent]);

  // Update available functions when files or file content changes
  useEffect(() => {
    extractFunctions();
  }, [extractFunctions]);

  // Fetch project details and spreadsheet context on mount
  useEffect(() => {
    loadSpreadsheetContext();
  }, [projectId, serverKey]);

  // Initialize/load conversation for this project
  useEffect(() => {
    const initConversation = async () => {
      if (!user?.email || !serverKey) return;

      try {
        // Look for existing conversation for this project+user
        const conversations = await listConversations();
        const existing = conversations.find(c => {
          const meta = c.metadata as { project_id?: string; user_email?: string } | undefined;
          return meta?.project_id === projectId && meta?.user_email === user.email;
        });

        if (existing) {
          console.log('📂 Loading existing conversation for project:', projectId);
          await loadConversation(existing.id);
          // Notify parent about the conversation ID
          onConversationChange?.(existing.id);
        } else {
          // Create new conversation for this project
          console.log('📝 Creating new conversation for project:', projectId);
          const conv = await createConversation(`Apps Script: ${projectName || projectId}`, {
            project_id: projectId,
            project_name: projectName,
            user_email: user.email,
            source: 'appsscript-editor',
          });
          if (conv) {
            await loadConversation(conv.id);
            // Notify parent about the conversation ID
            onConversationChange?.(conv.id);
          }
        }
      } catch (err: any) {
        // Silently fail - conversations service might not be enabled
        console.warn('Conversation persistence unavailable:', err?.message || err);
      }
    };

    initConversation();
  }, [projectId, user?.email, serverKey]);

  // Sync persisted messages to local state
  useEffect(() => {
    if (persistedMessages.length > 0) {
      const mapped: ChatMessage[] = persistedMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content || '',
        timestamp: new Date(msg.timestamp),
        toolCalls: msg.metadata?.toolCalls,
      }));
      setChatMessages(mapped);
    }
  }, [persistedMessages]);

  const loadVersions = async () => {
    setIsLoadingVersions(true);
    try {
      console.log('📜 Loading versions...');
      const result = await callTool('apps_script_list_versions', { projectId });
      
      if (result && !result.error) {
        setIsAuthError(false);
        let versionsList: any[] = [];
        
        // Parse result - handle different response formats:
        // 1. Raw MCP format: { content: [{ text: '{"versions": [...]}' }] }
        if (result.content?.[0]?.text) {
          try {
            const parsed = JSON.parse(result.content[0].text);
            versionsList = parsed.versions || parsed || [];
          } catch {
            versionsList = [];
          }
        } 
        // 2. useMCPTools parsed format: { content: { versions: [...] } }
        else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) {
          versionsList = result.content.versions || [];
        }
        // 3. Direct versions property
        else if (result.versions) {
          versionsList = result.versions;
        } 
        // 4. Direct array
        else if (Array.isArray(result)) {
          versionsList = result;
        }

        // Sort by version number descending
        versionsList.sort((a: any, b: any) => (b.versionNumber || 0) - (a.versionNumber || 0));
        
        setVersions(versionsList);
        console.log(`✅ Loaded ${versionsList.length} versions`);
      }
    } catch (err: any) {
      console.error('Error loading versions:', err);
      if (err.message?.includes('No Google OAuth token available') || err.message?.includes('sign in with Google')) {
        setIsAuthError(true);
      }
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleVersionSelect = async (version: number | null) => {
    setSelectedVersion(version);
    setShowVersionDropdown(false);

    if (version === null) {
      // Switch back to HEAD (current working copy)
      await loadFiles();
    } else {
      // Load specific version content
      setIsLoadingFiles(true);
      setError(null);
      
      try {
        console.log(`📜 Loading content for version ${version}...`);
        const result = await callTool('apps_script_get_version_content', {
          projectId,
          versionNumber: version
        });

        if (result && !result.error) {
          let versionFiles: ScriptFile[] = [];
          let filesData: any[] = [];
          
          // Parse result - handle different response formats:
          // 1. Raw MCP format: { content: [{ text: '{"files": [...]}' }] }
          if (result.content?.[0]?.text) {
            try {
              const parsed = JSON.parse(result.content[0].text);
              filesData = parsed.files || [];
            } catch (e) {
              console.error('Failed to parse version content:', e);
            }
          } 
          // 2. useMCPTools parsed format: { content: { files: [...] } }
          else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) {
            filesData = result.content.files || [];
          }
          // 3. Direct files property
          else if (result.files) {
            filesData = result.files;
          }
          
          versionFiles = filesData.map((f: any) => ({
            name: f.name,
            type: f.type,
            source: f.source
          }));

          console.log(`✅ Loaded ${versionFiles.length} files from version ${version}`);
          setFiles(versionFiles);
          
          // Auto-select first file
          if (versionFiles.length > 0) {
            setSelectedFile(versionFiles[0].name);
            setFileContent(versionFiles[0].source || '');
          } else {
            setSelectedFile(null);
            setFileContent('');
          }
        } else {
          setError(result?.error || 'Failed to load version content');
        }
      } catch (err) {
        console.error('Error loading version content:', err);
        setError(err instanceof Error ? err.message : 'Error loading version content');
      } finally {
        setIsLoadingFiles(false);
      }
    }
  };

  const handleRestoreVersion = async () => {
    if (selectedVersion === null) return;
    
    if (!confirm(`Are you sure you want to restore version ${selectedVersion} to your local workspace? This will overwrite your current local files.`)) {
      return;
    }

    // Since we already have the version files loaded in `files` state (with sources),
    // we can iterate through them and write them to the project.
    // However, this is a "client-side" restore (overwriting HEAD with version content).
    
    setIsSaving(true);
    try {
      console.log(`↺ Restoring version ${selectedVersion}...`);
      
      // We need to write each file. This might be slow if there are many files.
      // A better way would be if the server supported restore, but we'll do it iteratively for now.
      
      let successCount = 0;
      let failCount = 0;

      for (const file of files) {
        if (!file.source) continue;
        
        try {
          await callTool('apps_script_write_file', {
            projectId,
            fileName: file.name,
            content: file.source
          });
          successCount++;
        } catch (e) {
          console.error(`Failed to restore file ${file.name}:`, e);
          failCount++;
        }
      }

      if (failCount === 0) {
        alert(`Successfully restored ${successCount} files from version ${selectedVersion}.`);
        // Switch back to HEAD mode effectively (since we just overwrote HEAD)
        setSelectedVersion(null);
        await loadFiles(); // Reload to be sure
      } else {
        alert(`Restored ${successCount} files, but failed to restore ${failCount} files.`);
      }
    } catch (err) {
      console.error('Error restoring version:', err);
      setError(err instanceof Error ? err.message : 'Error restoring version');
    } finally {
      setIsSaving(false);
    }
  };

  const loadSpreadsheetContext = async () => {
    setSpreadsheetContext(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      // Step 1: Get project details (includes spreadsheetId)
      console.log('📊 Fetching project details for spreadsheet context...');
      const projectResult = await callTool('apps_script_get_project', { projectId });
      
      let spreadsheetId = '';
      let spreadsheetUrl = '';
      
      // Parse the project result
      if (projectResult?.content?.[0]?.text) {
        try {
          const parsed = JSON.parse(projectResult.content[0].text);
          spreadsheetId = parsed.spreadsheetId || '';
          spreadsheetUrl = parsed.spreadsheetUrl || '';
        } catch (e) {
          console.warn('Failed to parse project details:', e);
        }
      } else if (projectResult?.spreadsheetId) {
        spreadsheetId = projectResult.spreadsheetId;
        spreadsheetUrl = projectResult.spreadsheetUrl || '';
      }

      if (!spreadsheetId) {
        console.log('📝 No bound spreadsheet found for this project');
        setSpreadsheetContext({
          spreadsheetId: '',
          spreadsheetUrl: '',
          sheets: [],
          isLoading: false,
        });
        return;
      }

      console.log(`📊 Found bound spreadsheet: ${spreadsheetId}`);

      // Step 2: Get full spreadsheet context (metadata + sample data)
      const sheetsResult = await callSheetsTool('sheets_get_full_context', { 
        spreadsheetId,
        sampleRows: 5 
      });

      let spreadsheetName = '';
      let sheetsData: SpreadsheetContext['sheets'] = [];

      // Parse the sheets result
      if (sheetsResult?.content?.[0]?.text) {
        try {
          const parsed = JSON.parse(sheetsResult.content[0].text);
          spreadsheetName = parsed.metadata?.title || '';
          sheetsData = parsed.sheetsData || [];
        } catch (e) {
          console.warn('Failed to parse sheets context:', e);
        }
      } else if (sheetsResult?.metadata) {
        spreadsheetName = sheetsResult.metadata.title || '';
        sheetsData = sheetsResult.sheetsData || [];
      }

      console.log(`✅ Loaded spreadsheet context: "${spreadsheetName}" with ${sheetsData.length} sheets`);

      setSpreadsheetContext({
        spreadsheetId,
        spreadsheetUrl,
        spreadsheetName,
        sheets: sheetsData,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error loading spreadsheet context:', err);
      setSpreadsheetContext(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load spreadsheet context',
      }));
    }
  };

  const loadFiles = async () => {
    setIsLoadingFiles(true);
    setError(null);
    try {
      console.log(`📂 Fetching files for project ${projectId}...`);
      const result = await callTool('apps_script_list_files', { projectId });
      
      if (result && !result.error) {
        // Parse result if needed (similar to FileSystemBrowser)
        let parsedFiles: ScriptFile[] = [];
        
        // Helper to normalize file objects
        const normalizeFile = (file: any): ScriptFile => {
          if (typeof file === 'string') {
            // Infer type from extension
            let type = 'server_js';
            if (file.endsWith('.html')) type = 'html';
            else if (file.endsWith('.json')) type = 'json';
            else if (file.endsWith('.gs')) type = 'server_js';
            return { name: file, type };
          }
          // Already an object with name and type
          return {
            name: file.name,
            type: file.type || (file.name.endsWith('.html') ? 'html' : file.name.endsWith('.json') ? 'json' : 'server_js'),
            id: file.id
          };
        };

        // Handle direct array response
        if (Array.isArray(result)) {
           parsedFiles = result.map(normalizeFile);
        }
        // Handle raw MCP content wrapper (array format)
        else if (result.content && Array.isArray(result.content)) {
           if (typeof result.content[0] === 'string') {
             parsedFiles = result.content.map(normalizeFile);
           } else if (typeof result.content[0] === 'object') {
             // Check if it's a text content item that needs parsing
             if (result.content[0].text) {
               try {
                 const parsed = JSON.parse(result.content[0].text);
                 const list = Array.isArray(parsed) ? parsed : parsed.files || [];
                 parsedFiles = list.map(normalizeFile);
               } catch (e) {
                 console.error('Failed to parse files list:', e);
               }
             } else {
               // Already an object array
               parsedFiles = result.content.map(normalizeFile);
             }
           }
        }
        // Handle useMCPTools parsed format: { content: { files: [...] } }
        else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) {
          const list = result.content.files || [];
          parsedFiles = list.map(normalizeFile);
        }
        else if (result.files) {
           parsedFiles = result.files.map(normalizeFile);
        }

        console.log('📄 Files loaded:', parsedFiles);
        setFiles(parsedFiles);
        setIsAuthError(false);
        
        // Auto-select first file
        if (parsedFiles.length > 0 && !selectedFile) {
          handleFileSelect(parsedFiles[0].name);
        }
      } else {
        setError(result?.error || 'Failed to load files');
      }
    } catch (err: any) {
      console.error('Error loading files:', err);
      if (err.message?.includes('No Google OAuth token available') || err.message?.includes('sign in with Google')) {
        setIsAuthError(true);
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error loading files');
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleFileSelect = async (fileName: string) => {
    // Don't reload if already selected
    if (selectedFile === fileName && fileContent) return;

    setSelectedFile(fileName);
    setIsLoadingContent(true);
    setSaveStatus('idle');
    
    // Check if content is already available in the file object
    const fileObj = files.find(f => f.name === fileName);
    if (fileObj?.source) {
      setFileContent(fileObj.source);
      setIsLoadingContent(false);
      return;
    }

    try {
      console.log(`📖 Reading file ${fileName}...`);
      const result = await callTool('apps_script_read_file', { 
        projectId, 
        fileName 
      });

      if (result && !result.error) {
        let content = '';
        if (typeof result === 'string') {
            content = result;
        } else if (result.content?.[0]?.text) {
            // Standard MCP array format: { content: [{ type: 'text', text: '...' }] }
            const text = result.content[0].text;
            content = typeof text === 'object' ? JSON.stringify(text, null, 2) : text;
        } else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) {
            // useMCPTools returns { content: parsedObject } for JSON file contents
            content = JSON.stringify(result.content, null, 2);
        } else if (result.data) {
            content = typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data;
        } else if (typeof result === 'object') {
            // Result itself might be the content object
            content = JSON.stringify(result, null, 2);
        } else {
            // Fallback for direct text return or other formats
            content = String(result);
        }
        
        setFileContent(content);
      } else {
        setError(result?.error || `Failed to read ${fileName}`);
      }
    } catch (err) {
      console.error('Error reading file:', err);
      setError(err instanceof Error ? err.message : `Error reading ${fileName}`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      console.log(`💾 Saving ${selectedFile}...`);
      const result = await callTool('apps_script_write_file', {
        projectId,
        fileName: selectedFile,
        content: fileContent
      });

      if (result && !result.error) {
        setSaveStatus('success');
        // Refresh file list to ensure sync (optional)
        // loadFiles(); 
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setError(result?.error || 'Failed to save file');
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Error saving file:', err);
      setError(err instanceof Error ? err.message : 'Error saving file');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const handlePushToGoogle = async () => {
    const confirmMsg = 'Push local changes to Google Apps Script and create a new version?\n\nThis will overwrite the cloud version with your local changes and create an immutable snapshot.';
    
    if (!confirm(confirmMsg)) {
      return;
    }

    setIsPushing(true);
    setSyncStatus('idle');
    setError(null);

    try {
      console.log(`⬆️ Pushing to Google Apps Script with version...`);
      const result = await callTool('apps_script_push_to_google', { 
        projectId,
        createVersion: true,
        versionDescription: `Push from EGDesk at ${new Date().toLocaleString()}`
      });

      if (result && !result.error) {
        // Parse result if needed
        let parsed = result;
        if (result.content?.[0]?.text) {
          try {
            parsed = JSON.parse(result.content[0].text);
          } catch {
            parsed = result;
          }
        }
        
        setSyncStatus('pushed');
        
        // Show version info if created
        if (parsed.versionNumber) {
          setLastPushedVersion(parsed.versionNumber);
          console.log(`✅ Pushed and created version ${parsed.versionNumber}`);
        } else {
          setLastPushedVersion(null);
        }
        
        setTimeout(() => {
          setSyncStatus('idle');
          setLastPushedVersion(null);
        }, 4000);
      } else {
        setError(result?.error || 'Failed to push to Google');
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Error pushing to Google:', err);
      setError(err instanceof Error ? err.message : 'Error pushing to Google');
      setSyncStatus('error');
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullFromGoogle = async () => {
    if (!confirm('Pull latest from Google Apps Script?\n\nThis will overwrite your local changes with the cloud version.')) {
      return;
    }

    setIsPulling(true);
    setSyncStatus('idle');
    setError(null);

    try {
      console.log(`⬇️ Pulling from Google Apps Script...`);
      const result = await callTool('apps_script_pull_from_google', { projectId });

      if (result && !result.error) {
        setSyncStatus('pulled');
        // Refresh local files to show updated content
        await loadFiles();
        // Force reload the selected file if any
        if (selectedFile) {
          const currentFile = selectedFile;
          setSelectedFile(null); // Clear selection to force reload
          setFileContent('');
          // Re-select after a tick to trigger full reload
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
    } finally {
      setIsPulling(false);
    }
  };

  const handleDeployDevVersion = async () => {
    setIsDeploying(true);
    setError(null);
    try {
      alert('Deploy Dev Version functionality coming soon!');
    } catch (err) {
      console.error('Error deploying dev version:', err);
      setError(err instanceof Error ? err.message : 'Error deploying dev version');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRunFunction = async () => {
    if (!functionToRun.trim()) {
      setError('Please enter a function name');
      return;
    }

    setIsRunning(true);
    setRunResult(null);
    setError(null);

    try {
      console.log(`▶️ Running function: ${functionToRun}...`);
      const result = await callTool('apps_script_run_function', { 
        projectId, 
        functionName: functionToRun.trim() 
      });

      if (result) {
        // Parse the result from various possible formats
        let parsed = result;
        
        // Format 1: Raw MCP format { content: [{ text: "..." }] }
        if (result.content?.[0]?.text) {
          try {
            parsed = JSON.parse(result.content[0].text);
          } catch {
            parsed = result;
          }
        }
        // Format 2: useMCPTools parsed format { content: { success: true, ... } }
        else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) {
          parsed = result.content;
        }
        
        // Ensure we have a proper result object with success property
        // If parsed doesn't have a 'success' property, wrap it
        if (typeof parsed?.success !== 'boolean') {
          // This might be the raw function return value, assume success
          parsed = {
            success: true,
            result: parsed,
            logs: []
          };
        }
        
        setRunResult(parsed);
        if (!parsed.success) {
          setError(parsed.error || 'Function execution failed');
        }
      }
    } catch (err) {
      console.error('Error running function:', err);
      setError(err instanceof Error ? err.message : 'Error running function');
      setRunResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsRunning(false);
    }
  };

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const processUserMessage = async (message: string): Promise<{ content: string; toolCalls?: any[] }> => {
    // DEBUG: Log spreadsheet context
    console.log('🔍 DEBUG - Spreadsheet Context:', {
      hasSpreadsheetId: !!spreadsheetContext.spreadsheetId,
      spreadsheetId: spreadsheetContext.spreadsheetId,
      spreadsheetName: spreadsheetContext.spreadsheetName,
      isLoading: spreadsheetContext.isLoading,
      sheetsCount: spreadsheetContext.sheets.length,
      sheets: spreadsheetContext.sheets.map(s => ({
        title: s.sheetTitle,
        headers: s.headers,
      }))
    });
    
    const availableTools = [
      {
        name: 'apps_script_list_files',
        description: 'List all files in the current Apps Script project. Use this to see what files exist.',
        parameters: { projectId: 'string (The project ID)' }
      },
      {
        name: 'apps_script_read_file',
        description: 'Read the contents of a file in the Apps Script project. Use this to examine code before modifying.',
        parameters: { 
          projectId: 'string (The project ID)',
          fileName: 'string (The file name, e.g., "Code.gs", "index.html")'
        }
      },
      {
        name: 'apps_script_write_file',
        description: 'Create a NEW file or update an EXISTING file in the Apps Script project. Use this to create HTML files, modify code, add new functions, etc.',
        parameters: {
          projectId: 'string (The project ID)',
          fileName: 'string (The file name - can be new or existing, e.g., "NewPage.html", "Utils.gs")',
          content: 'string (The complete file content to write)'
        }
      },
      // Function execution
      {
        name: 'apps_script_run_function',
        description: 'Execute a function in the Apps Script project remotely. Runs against the most recent saved version. Use this to test functions, retrieve data, or trigger operations like listing triggers, getting spreadsheet data, etc.',
        parameters: {
          projectId: 'string (The project ID)',
          functionName: 'string (Name of the function to execute, e.g., "listAllTriggers", "myFunction")',
          parameters: 'array (Optional - array of parameters to pass to the function)'
        }
      },
      // Deployment tools
      {
        name: 'apps_script_list_deployments',
        description: 'List all deployments of the Apps Script project. Shows web app URLs, deployment IDs, and configuration.',
        parameters: { projectId: 'string (The project ID)' }
      },
      {
        name: 'apps_script_create_version',
        description: 'Create a new version (snapshot) of the Apps Script project. Versions are required before creating deployments.',
        parameters: {
          projectId: 'string (The project ID)',
          description: 'string (Optional description for the version)'
        }
      },
      {
        name: 'apps_script_create_deployment',
        description: 'Deploy the Apps Script project as a web app. Creates a new version if none specified. Returns the web app URL that users can access.',
        parameters: {
          projectId: 'string (The project ID)',
          versionNumber: 'number (Optional - version number to deploy, creates new version if not provided)',
          description: 'string (Optional description for the deployment)',
          access: 'string (Who can access: "MYSELF", "DOMAIN", "ANYONE", "ANYONE_ANONYMOUS")',
          executeAs: 'string (Who runs the script: "USER_ACCESSING" or "USER_DEPLOYING")'
        }
      },
      {
        name: 'apps_script_update_deployment',
        description: 'Update an existing deployment to use a new version. Useful for publishing code changes to an existing web app URL.',
        parameters: {
          projectId: 'string (The project ID)',
          deploymentId: 'string (The deployment ID to update)',
          versionNumber: 'number (Optional - new version number, creates new version if not provided)',
          description: 'string (Optional new description)'
        }
      },
      // Version history tools
      {
        name: 'apps_script_list_versions',
        description: 'List all saved versions (snapshots) of the Apps Script project. Returns version numbers, descriptions, and creation dates.',
        parameters: { 
          projectId: 'string (The project ID)' 
        }
      },
      {
        name: 'apps_script_get_version_content',
        description: 'Get the file contents of a specific version. Use this to view or compare code from a previous snapshot.',
        parameters: {
          projectId: 'string (The project ID)',
          versionNumber: 'number (The version number to retrieve)'
        }
      },
      // Sheets tools (only if spreadsheet is bound)
      ...(spreadsheetContext.spreadsheetId ? [
        {
          name: 'sheets_get_range',
          description: 'Read a range of cells from the bound Google Spreadsheet. Use this to get actual data.',
          parameters: {
            spreadsheetId: 'string (The spreadsheet ID)',
            range: 'string (A1 notation range, e.g., "Sheet1!A1:D10")'
          }
        },
        {
          name: 'sheets_get_headers',
          description: 'Get the header row (first row) of a sheet in the bound spreadsheet.',
          parameters: {
            spreadsheetId: 'string (The spreadsheet ID)',
            sheetName: 'string (Optional, defaults to "Sheet1")'
          }
        }
      ] : [])
    ];

    // Build spreadsheet context section for system instruction
    let spreadsheetSection = '';
    if (spreadsheetContext.spreadsheetId && !spreadsheetContext.isLoading) {
      spreadsheetSection = `
🔴 CRITICAL - BOUND SPREADSHEET (YOU ALREADY HAVE ACCESS TO THIS DATA):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Spreadsheet Name: "${spreadsheetContext.spreadsheetName || 'Untitled Spreadsheet'}"
- Spreadsheet ID: ${spreadsheetContext.spreadsheetId}
- URL: ${spreadsheetContext.spreadsheetUrl}

📊 ACTUAL DATA STRUCTURE (THIS IS REAL DATA FROM THE SPREADSHEET):
${spreadsheetContext.sheets.map(sheet => `
Sheet: "${sheet.sheetTitle}" (${sheet.rowCount} rows × ${sheet.columnCount} cols)
  Column Headers: [${sheet.headers.map(h => `"${h}"`).join(', ') || 'No headers'}]
  Sample Data Row 1: [${sheet.sampleData[0]?.map(d => `"${d}"`).join(', ') || 'No data'}]
  ${sheet.sampleData[1] ? `Sample Data Row 2: [${sheet.sampleData[1]?.map(d => `"${d}"`).join(', ')}]` : ''}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT: DO NOT tell the user to "upload a file" or "convert to CSV" or "provide data".
The spreadsheet is ALREADY CONNECTED. You can read it directly using Apps Script.

When user asks to "view the data", "show Excel content", "create HTML for the spreadsheet", "엑셀 내용을 볼 수 있는":
1. DO NOT ask for files - the data is already available above!
2. IMMEDIATELY create the files using the ACTUAL column names shown above
3. Create Code.gs with a getData() function using SpreadsheetApp.getActiveSpreadsheet()
4. Create an HTML file that displays the data in a table

APPS SCRIPT CODE TO ACCESS THIS DATA:
\`\`\`javascript
// This spreadsheet is already bound - use getActiveSpreadsheet()
function getData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  return data;
}
\`\`\`
`;
    } else if (!spreadsheetContext.spreadsheetId && !spreadsheetContext.isLoading) {
      spreadsheetSection = `
NO BOUND SPREADSHEET:
This script is not bound to a spreadsheet. If the user wants to work with spreadsheet data:
1. They need to provide a spreadsheet ID, or
2. Create functions that accept spreadsheet ID as parameter
`;
    }

    // Comprehensive system instruction for Apps Script assistant
    const systemInstruction = `You are an expert Google Apps Script developer assistant. You help users write, debug, and improve their Apps Script code.

PROJECT CONTEXT:
- Project: "${projectName || projectId}"
- Currently open file: ${selectedFile || 'None selected'}
${fileContent ? `- Current file content preview (first 1500 chars):\n\`\`\`\n${fileContent.substring(0, 1500)}\n\`\`\`` : ''}
${spreadsheetSection}
SCRIPT FILES:
${files.map(f => `- ${f.name} (${f.type})`).join('\n') || 'No files loaded yet'}

AVAILABLE TOOLS:
${availableTools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

CAPABILITIES:
1. **Create new files**: Use apps_script_write_file with a new fileName to create .gs (server-side) or .html (client-side) files
2. **Modify existing files**: Use apps_script_write_file to update code
3. **Read files**: Use apps_script_read_file to examine code before suggesting changes
4. **List project files**: Use apps_script_list_files to see all files in the project
5. **Deploy as Web App**: Use apps_script_create_deployment to deploy the script and get a public URL
6. **List deployments**: Use apps_script_list_deployments to see existing deployments and their URLs
7. **Update deployment**: Use apps_script_update_deployment to update an existing deployment with new code
8. **Create versions**: Use apps_script_create_version to create a snapshot before deployment
9. **Run functions remotely**: Use apps_script_run_function to execute any function in the script
   - Use this for operations like: listing triggers, testing functions, getting data
   - Example: To list triggers, call a function like "listAllTriggers" if it exists in the code
   - The function must exist in the script files - check with apps_script_read_file first if unsure
${spreadsheetContext.spreadsheetId ? `10. **Read spreadsheet data**: Use sheets_get_range or sheets_get_headers to get live data` : ''}

🔄 AFTER EXECUTING TOOLS:
Always explain what the tool results mean in plain language:
- For list_files: "I found X files in your project: ..."
- For run_function: Explain what the function returned and what it means
- For deployments: Highlight the web URL and access instructions
- Don't just show raw data - provide helpful context!

DEPLOYMENT INSTRUCTIONS:
When user asks to "deploy", "get a URL", "make it accessible", "배포해줘":
1. First ensure the code has a doGet() or doPost() function for web apps
2. ALWAYS use apps_script_create_deployment (NOT update_deployment) - this creates a NEW web app URL
3. Use access: "ANYONE" for public access, or "MYSELF" for private access
4. The tool will automatically create a new version and deploy it
5. Return the webAppUrl to the user - this is the URL they can access

⚠️ NEVER use apps_script_update_deployment unless updating a SPECIFIC non-HEAD deployment ID
   The HEAD deployment is READ-ONLY and cannot be modified!

IMPORTANT BEHAVIORS:
1. When user asks to "create HTML" or "make a page", IMMEDIATELY create the file using apps_script_write_file
2. When user asks to modify code, first read the current file if not already shown, then write the updated version
3. For HTML files in Apps Script, use proper Apps Script HTML service patterns (<?= ?> scriptlets, google.script.run, etc.)
4. Always generate COMPLETE, working code - don't use placeholders like "// your code here"
5. If user's request is unclear, ask ONE clarifying question, then proceed
${spreadsheetContext.spreadsheetId ? `
🔴 SPREADSHEET-SPECIFIC RULES (VERY IMPORTANT):
6. NEVER say "upload a file", "provide the data", "convert to CSV", or ask for Excel files
7. The spreadsheet data is ALREADY AVAILABLE - see the headers and sample data above
8. When user asks to "view data", "show spreadsheet", "엑셀 볼 수 있게", IMMEDIATELY create HTML using the actual column names
9. Use SpreadsheetApp.getActiveSpreadsheet() - the spreadsheet is already bound to this script
10. Create BOTH: Code.gs (with getData function) AND an HTML file (with table displaying the data)` : ''}

APPS SCRIPT SPECIFIC KNOWLEDGE:
- .gs files are server-side JavaScript (Google's V8 runtime)
- .html files can include CSS/JS and use scriptlets: <?= ?>, <? ?>, <?!= ?>
- Use google.script.run.functionName() to call server functions from HTML
- SpreadsheetApp, DriveApp, GmailApp, etc. are available server-side
- HtmlService.createHtmlOutputFromFile('filename') serves HTML pages

📋 PROJECT DOCUMENTATION APPROACH:
When user shares a script project or asks you to build one, FIRST create a checklist:
1. Document what the project requires (inputs, outputs, data sources)
2. Outline the logic needed to address each requirement
3. Then implement with the best practices below

🏆 APPS SCRIPT BEST PRACTICES (ALWAYS FOLLOW):

1. **PropertiesService for Dynamic Variables**
   - NEVER hardcode file IDs, folder IDs, or API keys in code
   - Use PropertiesService.getScriptProperties() or .getUserProperties()
   - Example: \`PropertiesService.getScriptProperties().setProperty('FOLDER_ID', folderId)\`

2. **Self-Initializing Setup (One-Click Ready)**
   - Create a setupEnvironment() function that initializes everything
   - If folder/file doesn't exist, CREATE it automatically - don't ask user for IDs
   - Store created resource IDs in PropertiesService for future use
   - User should be able to copy the project and run with ONE button click

3. **Proper appsscript.json Manifest**
   - Always generate/update appsscript.json with correct oauthScopes
   - Include timeZone, exceptionLogging, runtimeVersion: "V8"
   - Add webapp config if deploying as web app

4. **Official Google APIs**
   - Use web search to find official Google API documentation
   - Prefer built-in services (SpreadsheetApp, DriveApp) over REST APIs when possible
   - For advanced features, use UrlFetchApp with official Google APIs

5. **Logging with Logger**
   - Use Logger.log() for debugging and audit trails
   - Use console.log() for V8 runtime debugging
   - Add meaningful log messages at key steps

6. **Triggers for Automation**
   - Use ScriptApp.newTrigger() for scheduled/continuous tasks
   - Add 'https://www.googleapis.com/auth/script.scriptapp' scope for trigger management
   - Provide install/remove trigger functions for user control

7. **Immediate File Generation**
   - When starting a project, IMMEDIATELY create appsscript.json and Code.gs
   - Don't just explain - actually write the files using apps_script_write_file

📐 STANDARD UI MENU PATTERN (Use for Spreadsheet-bound scripts):
\`\`\`javascript
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🧩 Project Name');
  
  // ZONE 1: Primary Actions (Daily Use)
  menu.addItem('▶️ Run Main Task', 'mainFunction')
      .addItem('📊 Generate Report', 'reportFunction');
  
  // ZONE 2: Automation (Triggers)
  menu.addSeparator()
      .addItem('⏰ Enable Auto-Run', 'installTrigger')
      .addItem('🛑 Disable Auto-Run', 'removeTrigger');
  
  // ZONE 3: Settings (Sub-menu for cleaner UI)
  const settingsMenu = ui.createMenu('⚙️ Settings');
  settingsMenu.addItem('🚀 Initial Setup', 'setupEnvironment')
              .addSeparator()
              .addItem('🔑 Set API Key', 'setApiKey')
              .addItem('👀 View Status', 'checkStatus')
              .addItem('🗑️ Clear Data', 'clearData');
  
  menu.addSeparator().addSubMenu(settingsMenu);
  menu.addToUi();
}
\`\`\`

EXAMPLE - Creating an HTML page to display spreadsheet data:
User: "이 엑셀 내용을 볼 수 있는 HTML 코드 만들어주세요" or "Create an HTML page to display data"
You: 
✅ CORRECT: "I can see your spreadsheet '${spreadsheetContext.spreadsheetName || 'Spreadsheet'}' has columns: ${spreadsheetContext.sheets[0]?.headers?.join(', ') || 'various columns'}. I'll create the files now."
   Then IMMEDIATELY call apps_script_write_file twice:
   1. Create Code.gs with getData() function
   2. Create DataView.html with table

❌ WRONG: "Please upload your Excel file" or "I need you to provide the data first"
   (The data is already available! Never ask for uploads!)

Be proactive, write clean code, and always use the tools to actually create/modify files - don't just show code in chat.

🚨 OUTPUT FORMAT (CRITICAL):
You MUST respond with valid JSON only. No markdown code fences.
{
  "content": "Your response (escape quotes with \\", newlines with \\n)",
  "toolCalls": [{"name": "tool_name", "args": {"key": "value"}}]
}
- Use toolCalls: [] when no tools needed
- Keep content SHORT when calling tools
- NEVER include unescaped newlines or quotes in JSON strings`;

    // Add context about current file
    const context = {
      availableTools,
      systemInstruction,
      currentProject: projectId,
      currentProjectName: projectName,
      currentFile: selectedFile,
      currentFileContent: fileContent ? fileContent.substring(0, 2000) : null // Limit context size
    };

    try {
      // Initialize conversation history with system instruction if empty
      if (conversationHistoryRef.current.length === 0) {
        conversationHistoryRef.current.push({ role: 'system', content: systemInstruction });
        console.log('🆕 Starting new conversation with system instruction');
      } else {
        // Update system instruction with latest context (files, spreadsheet data, etc.)
        conversationHistoryRef.current[0] = { role: 'system', content: systemInstruction };
        console.log(`💬 Continuing conversation (${conversationHistoryRef.current.length} messages in history)`);
      }
      
      // Add current user message to conversation history
      conversationHistoryRef.current.push({ role: 'user', content: message });
      
      let allToolCalls: any[] = [];
      let maxIterations = 5;
      let finalContent = '';

      for (let iteration = 0; iteration < maxIterations; iteration++) {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: conversationHistoryRef.current,
            context,
            model: selectedModel || undefined
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        finalContent = data.content;
        
        if (!data.toolCalls || data.toolCalls.length === 0) {
          break;
        }

        const executedTools = [];
        let shouldBreakLoop = false; // Flag for terminal operations
        
        for (const toolCall of data.toolCalls) {
          try {
            let result;
            switch (toolCall.name) {
              case 'apps_script_list_files':
                result = await callTool('apps_script_list_files', { 
                  projectId: toolCall.args.projectId || projectId 
                });
                break;
              case 'apps_script_read_file':
                result = await callTool('apps_script_read_file', {
                  projectId: toolCall.args.projectId || projectId,
                  fileName: toolCall.args.fileName
                });
                break;
              case 'apps_script_write_file':
                result = await callTool('apps_script_write_file', {
                  projectId: toolCall.args.projectId || projectId,
                  fileName: toolCall.args.fileName,
                  content: toolCall.args.content
                });
                // If writing to current file, update the editor
                if (toolCall.args.fileName === selectedFile) {
                  setFileContent(toolCall.args.content);
                }
                // Check if this is a new file (not in current files list)
                const isNewFile = !files.some(f => f.name === toolCall.args.fileName);
                if (isNewFile) {
                  // Refresh file list to show the new file
                  loadFiles();
                }
                break;
              // Deployment tools
              case 'apps_script_list_deployments':
                result = await callTool('apps_script_list_deployments', {
                  projectId: toolCall.args.projectId || projectId
                });
                break;
              case 'apps_script_create_version':
                result = await callTool('apps_script_create_version', {
                  projectId: toolCall.args.projectId || projectId,
                  description: toolCall.args.description
                });
                // Check success in various response formats
                // useMCPTools returns: { content: { success: true, versionNumber: X } }
                const versionData = result?.content || result;
                const versionSuccess = versionData?.success !== false && !result?.error;
                if (versionSuccess) {
                  loadVersions();
                  shouldBreakLoop = true; // Terminal operation - don't repeat
                }
                break;
              case 'apps_script_create_deployment':
                result = await callTool('apps_script_create_deployment', {
                  projectId: toolCall.args.projectId || projectId,
                  versionNumber: toolCall.args.versionNumber,
                  description: toolCall.args.description,
                  access: toolCall.args.access || 'ANYONE',
                  executeAs: toolCall.args.executeAs || 'USER_DEPLOYING'
                });
                // Terminal operation - don't repeat
                if (result && !result.error) {
                  shouldBreakLoop = true;
                }
                break;
              case 'apps_script_update_deployment':
                result = await callTool('apps_script_update_deployment', {
                  projectId: toolCall.args.projectId || projectId,
                  deploymentId: toolCall.args.deploymentId,
                  versionNumber: toolCall.args.versionNumber,
                  description: toolCall.args.description
                });
                // Terminal operation - don't repeat
                if (result && !result.error) {
                  shouldBreakLoop = true;
                }
                break;
              // Version history tools
              case 'apps_script_list_versions':
                result = await callTool('apps_script_list_versions', {
                  projectId: toolCall.args.projectId || projectId
                });
                break;
              case 'apps_script_get_version_content':
                result = await callTool('apps_script_get_version_content', {
                  projectId: toolCall.args.projectId || projectId,
                  versionNumber: toolCall.args.versionNumber
                });
                break;
              // Sheets tools
              case 'sheets_get_range':
                result = await callSheetsTool('sheets_get_range', {
                  spreadsheetId: toolCall.args.spreadsheetId || spreadsheetContext.spreadsheetId,
                  range: toolCall.args.range
                });
                break;
              case 'sheets_get_headers':
                result = await callSheetsTool('sheets_get_headers', {
                  spreadsheetId: toolCall.args.spreadsheetId || spreadsheetContext.spreadsheetId,
                  sheetName: toolCall.args.sheetName || 'Sheet1'
                });
                break;
              case 'sheets_get_sample_data':
                result = await callSheetsTool('sheets_get_sample_data', {
                  spreadsheetId: toolCall.args.spreadsheetId || spreadsheetContext.spreadsheetId,
                  sheetName: toolCall.args.sheetName || 'Sheet1',
                  rows: toolCall.args.rows || 5
                });
                break;
              // Function execution
              case 'apps_script_run_function':
                result = await callTool('apps_script_run_function', {
                  projectId: toolCall.args.projectId || projectId,
                  functionName: toolCall.args.functionName,
                  parameters: toolCall.args.parameters
                });
                break;
              default:
                result = { error: `Unknown tool: ${toolCall.name}` };
            }
            
            executedTools.push({
              name: toolCall.name,
              args: toolCall.args,
              result: result
            });
          } catch (error) {
            executedTools.push({
              name: toolCall.name,
              args: toolCall.args,
              result: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
          }
        }

        allToolCalls.push(...executedTools);

        conversationHistoryRef.current.push({
          role: 'assistant',
          content: data.content
        });
        conversationHistoryRef.current.push({
          role: 'tool',
          content: JSON.stringify(executedTools.map(t => ({
            tool: t.name,
            result: t.result
          })))
        });
        
        // Break loop for terminal operations (create version, deployment, etc.)
        // These are one-and-done actions that shouldn't be repeated
        if (shouldBreakLoop) {
          console.log('🛑 Breaking loop - terminal operation completed');
          // Set finalContent to describe what was done
          const successfulTools = executedTools.filter(t => !t.result?.error);
          if (successfulTools.length > 0) {
            finalContent = data.content || `Successfully executed: ${successfulTools.map(t => t.name).join(', ')}`;
          }
          break;
        }
      }

      // Add final assistant response to conversation history for context continuity
      const lastMessage = conversationHistoryRef.current[conversationHistoryRef.current.length - 1];
      if (lastMessage?.role !== 'assistant' || lastMessage?.content !== finalContent) {
        conversationHistoryRef.current.push({
          role: 'assistant',
          content: finalContent
        });
      }
      
      console.log(`📝 Conversation history now has ${conversationHistoryRef.current.length} messages`);
      
      return {
        content: finalContent,
        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined
      };
    } catch (error) {
      return {
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process message'}`
      };
    }
  };
  
  // Function to clear conversation context
  const clearConversationContext = () => {
    conversationHistoryRef.current = [];
    console.log('🗑️ Conversation context cleared');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    // Save user message to MCP service (fire-and-forget)
    if (currentConversation?.id) {
      saveMessage({
        conversation_id: currentConversation.id,
        role: 'user',
        content: userMessage.content,
        metadata: {
          source: 'appsscript-editor',
          project_id: projectId,
          project_name: projectName,
          user_email: user?.email,
          current_file: selectedFile || undefined,
        }
      }).catch(err => console.warn('Failed to save user message:', err));
    }

    try {
      const response = await processUserMessage(chatInput.trim());
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        toolCalls: response.toolCalls
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to MCP service (fire-and-forget)
      if (currentConversation?.id) {
        saveMessage({
          conversation_id: currentConversation.id,
          role: 'assistant',
          content: response.content,
          metadata: {
            source: 'appsscript-editor',
            project_id: projectId,
            project_name: projectName,
            user_email: user?.email,
            toolCalls: response.toolCalls,
          }
        }).catch(err => console.warn('Failed to save assistant message:', err));
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatToolResult = (toolCall: any) => {
    if (toolCall.name === 'apps_script_list_files') {
      let files: any[] = [];
      
      // Parse MCP content format
      if (typeof toolCall.result?.content?.[0]?.text === 'string') {
        try {
          files = JSON.parse(toolCall.result.content[0].text);
        } catch (e) {
          files = [];
        }
      } else if (Array.isArray(toolCall.result?.content)) {
        files = toolCall.result.content;
      } else if (Array.isArray(toolCall.result)) {
        files = toolCall.result;
      }
      
      return (
        <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-blue-400 font-medium">
            <FileCode className="w-3 h-3" />
            📁 Files in Project ({files.length})
          </div>
          <div className="space-y-1">
            {files.map((file: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-zinc-300 font-mono p-1 bg-zinc-900 rounded">
                <span className="text-zinc-400">{file.type === 'server_js' ? '📄' : file.type === 'html' ? '🌐' : '📋'}</span>
                <span>{file.displayName || file.name}</span>
                <span className="text-zinc-500 text-[10px]">({file.type})</span>
              </div>
            ))}
            {files.length === 0 && (
              <p className="text-zinc-500">No files found</p>
            )}
          </div>
        </div>
      );
    }

    if (toolCall.name === 'apps_script_read_file') {
      let content = '';
      if (typeof toolCall.result === 'string') {
        content = toolCall.result;
      } else if (toolCall.result?.content?.[0]?.text) {
        content = toolCall.result.content[0].text;
      } else if (toolCall.result?.content && typeof toolCall.result.content === 'object') {
        content = JSON.stringify(toolCall.result.content, null, 2);
      }
      return (
        <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-green-400 font-medium">
            <Code className="w-3 h-3" />
            {toolCall.args.fileName}
          </div>
          <pre className="text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
            {content.substring(0, 500)}{content.length > 500 ? '...' : ''}
          </pre>
        </div>
      );
    }

    if (toolCall.name === 'apps_script_write_file') {
      return (
        <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
          <div className="flex items-center gap-1.5 text-green-400 font-medium">
            <CheckCircle className="w-3 h-3" />
            Saved {toolCall.args.fileName}
          </div>
        </div>
      );
    }

    // Deployment tools
    if (toolCall.name === 'apps_script_create_deployment' || toolCall.name === 'apps_script_update_deployment') {
      let data: any = toolCall.result;
      
      // Parse MCP content format
      if (typeof data?.content?.[0]?.text === 'string') {
        try {
          data = JSON.parse(data.content[0].text);
        } catch (e) {
          // Keep original
        }
      }
      
      // Extract deployment object and URL from various possible locations
      const deployment = data?.deployment || data;
      let webAppUrl = deployment?.webAppUrl 
        || deployment?.entryPoints?.find((e: any) => e.webApp?.url)?.webApp?.url
        || data?.webAppUrl;
      
      // Also try to extract URL from message string if present
      if (!webAppUrl && data?.message) {
        const urlMatch = data.message.match(/https:\/\/script\.google\.com\/[^\s"]+/);
        if (urlMatch) {
          webAppUrl = urlMatch[0];
        }
      }
      
      const deploymentId = deployment?.deploymentId || data?.deploymentId;
      
      console.log('🚀 Deployment result:', { data, deployment, webAppUrl, deploymentId });
      
      return (
        <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-violet-400 font-medium">
            <ExternalLink className="w-3 h-3" />
            {toolCall.name === 'apps_script_create_deployment' ? '🚀 Deployed!' : '✅ Deployment Updated'}
          </div>
          {webAppUrl ? (
            <div className="space-y-1">
              <p className="text-zinc-400">Web App URL:</p>
              <a 
                href={webAppUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 break-all underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                {webAppUrl}
              </a>
            </div>
          ) : (
            <p className="text-zinc-400">Deployment ID: {deploymentId || 'Unknown'}</p>
          )}
        </div>
      );
    }

    if (toolCall.name === 'apps_script_list_deployments') {
      let data: any = toolCall.result;
      // Handle different response formats:
      // 1. Raw MCP format: { content: [{ text: "..." }] }
      if (typeof data?.content?.[0]?.text === 'string') {
        try {
          data = JSON.parse(data.content[0].text);
        } catch (e) {
          // Keep original
        }
      }
      // 2. useMCPTools parsed format: { content: { deployments: [...] } }
      else if (data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
        data = data.content;
      }
      const deployments = data?.deployments || data || [];
      
      return (
        <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-violet-400 font-medium">
            <Cloud className="w-3 h-3" />
            Deployments ({Array.isArray(deployments) ? deployments.length : 0})
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(Array.isArray(deployments) ? deployments : []).map((dep: any, idx: number) => {
              const webUrl = dep.entryPoints?.find((e: any) => e.webApp?.url)?.webApp?.url;
              return (
                <div key={idx} className="p-1.5 bg-zinc-900 rounded">
                  <p className="text-zinc-300 font-mono text-[10px]">{dep.deploymentId}</p>
                  {dep.description && <p className="text-zinc-500">{dep.description}</p>}
                  {webUrl && (
                    <a href={webUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-[10px] break-all">
                      {webUrl}
                    </a>
                  )}
                </div>
              );
            })}
            {(!deployments || deployments.length === 0) && (
              <p className="text-zinc-500">No deployments yet</p>
            )}
          </div>
        </div>
      );
    }

    if (toolCall.name === 'apps_script_create_version') {
      let data: any = toolCall.result;
      
      // Handle different response formats:
      // 1. Raw MCP format: { content: [{ text: "..." }] }
      if (typeof data?.content?.[0]?.text === 'string') {
        try {
          data = JSON.parse(data.content[0].text);
        } catch (e) {
          // Keep original
        }
      }
      // 2. useMCPTools parsed format: { content: { versionNumber: 1, ... } }
      else if (data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
        data = data.content;
      }
      
      // Extract version number from various possible locations
      const versionNumber = data?.versionNumber 
        || data?.version?.versionNumber 
        || data?.result?.versionNumber;
      const description = data?.description || data?.version?.description || '';
      
      return (
        <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <History className="w-3 h-3" />
            Created Version {versionNumber || '?'}
          </div>
          {description && <p className="text-zinc-400 mt-1">{description}</p>}
        </div>
      );
    }

    // Version history tools
    if (toolCall.name === 'apps_script_list_versions') {
      let data: any = toolCall.result;
      // Handle different response formats:
      // 1. Raw MCP format: { content: [{ text: "..." }] }
      if (typeof data?.content?.[0]?.text === 'string') {
        try {
          data = JSON.parse(data.content[0].text);
        } catch (e) {
          // Keep original
        }
      }
      // 2. useMCPTools parsed format: { content: { versions: [...] } }
      else if (data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
        data = data.content;
      }
      const versions = data?.versions || data || [];
      
      return (
        <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-amber-400 font-medium">
            <History className="w-3 h-3" />
            Versions ({Array.isArray(versions) ? versions.length : 0})
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {(Array.isArray(versions) ? versions : []).map((v: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-zinc-300 p-1 bg-zinc-900 rounded">
                <span className="font-mono">v{v.versionNumber}</span>
                <span className="text-zinc-500 text-[10px]">
                  {v.createTime ? new Date(v.createTime).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
            {(!versions || versions.length === 0) && (
              <p className="text-zinc-500">No versions found</p>
            )}
          </div>
        </div>
      );
    }

    if (toolCall.name === 'apps_script_get_version_content') {
      let data: any = toolCall.result;
      // Handle different response formats:
      // 1. Raw MCP format: { content: [{ text: "..." }] }
      if (typeof data?.content?.[0]?.text === 'string') {
        try {
          data = JSON.parse(data.content[0].text);
        } catch (e) {
          // Keep original
        }
      }
      // 2. useMCPTools parsed format: { content: { files: [...] } }
      else if (data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
        data = data.content;
      }
      const files = data?.files || [];
      
      return (
        <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-cyan-400 font-medium">
            <FileCode className="w-3 h-3" />
            Version {toolCall.args.versionNumber} Content ({files.length} files)
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {files.map((f: any, idx: number) => (
              <div key={idx} className="p-1.5 bg-zinc-900 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-mono text-[11px]">{f.name}</span>
                  <span className="text-zinc-500 text-[10px]">{f.type}</span>
                </div>
                {f.source && (
                  <pre className="text-zinc-400 text-[10px] mt-1 whitespace-pre-wrap overflow-hidden max-h-16">
                    {f.source.substring(0, 200)}{f.source.length > 200 ? '...' : ''}
                  </pre>
                )}
              </div>
            ))}
            {files.length === 0 && (
              <p className="text-zinc-500">No files in this version</p>
            )}
          </div>
        </div>
      );
    }

    // Sheets tools
    if (toolCall.name === 'sheets_get_range' || toolCall.name === 'sheets_get_headers' || toolCall.name === 'sheets_get_sample_data') {
      let data: any = toolCall.result;
      if (typeof data?.content?.[0]?.text === 'string') {
        try {
          data = JSON.parse(data.content[0].text);
        } catch (e) {
          // Keep original
        }
      }
      
      const headers = data?.headers || data?.values?.[0] || [];
      const values = data?.values || data?.sampleData || [];
      
      return (
        <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-green-400 font-medium">
            <Table2 className="w-3 h-3" />
            {toolCall.name === 'sheets_get_headers' ? 'Headers' : `Data from ${data?.range || toolCall.args.range || 'Spreadsheet'}`}
          </div>
          {headers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="text-zinc-300 text-[10px] border-collapse">
                <thead>
                  <tr>
                    {headers.map((h: string, i: number) => (
                      <th key={i} className="border border-zinc-600 px-1 py-0.5 bg-zinc-700 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                {values.length > 1 && (
                  <tbody>
                    {values.slice(1, 4).map((row: string[], rowIdx: number) => (
                      <tr key={rowIdx}>
                        {row.map((cell: string, cellIdx: number) => (
                          <td key={cellIdx} className="border border-zinc-600 px-1 py-0.5">
                            {String(cell).substring(0, 30)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
              {values.length > 4 && (
                <p className="text-zinc-500 mt-1">... and {values.length - 4} more rows</p>
              )}
            </div>
          )}
        </div>
      );
    }

    // Run function results
    if (toolCall.name === 'apps_script_run_function') {
      let data: any = toolCall.result;
      
      // Parse MCP content format: { content: [{ text: "..." }] }
      if (typeof data?.content?.[0]?.text === 'string') {
        try {
          data = JSON.parse(data.content[0].text);
        } catch (e) {
          // Keep original
        }
      }
      // Parse useMCPTools format: { content: { success: true, ... } }
      else if (data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
        data = data.content;
      }
      
      // If data doesn't have success property, it might be the raw result - wrap it
      if (typeof data?.success !== 'boolean') {
        data = {
          success: true,
          result: data,
          logs: []
        };
      }
      
      const success = data?.success;
      const functionName = data?.functionName || toolCall.args?.functionName || 'function';
      const result = data?.result;
      const error = data?.error;
      const logs = data?.logs || [];
      
      return (
        <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
          <div className={`flex items-center gap-1.5 mb-1.5 ${success ? 'text-green-400' : 'text-red-400'} font-medium`}>
            <Play className="w-3 h-3" />
            {success ? `✅ ${functionName}()` : `❌ ${functionName}() failed`}
          </div>
          {error && (
            <div className="p-1.5 bg-red-900/30 rounded text-red-300 mb-2">
              {error}
            </div>
          )}
          {result !== undefined && result !== null && (
            <div className="space-y-1">
              <p className="text-zinc-400">Result:</p>
              <pre className="text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto bg-zinc-900 p-2 rounded">
                {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
              </pre>
            </div>
          )}
          {logs.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-zinc-400">Logs:</p>
              <div className="bg-zinc-900 p-1.5 rounded max-h-24 overflow-y-auto">
                {logs.map((log: string, idx: number) => (
                  <p key={idx} className="text-zinc-500 text-[10px] font-mono">{log}</p>
                ))}
              </div>
            </div>
          )}
          {success && result === undefined && !error && (
            <p className="text-zinc-400 italic">Function executed successfully (no return value)</p>
          )}
        </div>
      );
    }

    // Default fallback - try to parse JSON and show nicely
    let displayData = toolCall.result;
    if (typeof displayData?.content?.[0]?.text === 'string') {
      try {
        displayData = JSON.parse(displayData.content[0].text);
      } catch (e) {
        displayData = displayData.content[0].text;
      }
    }
    
    return (
      <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
        <div className="flex items-center gap-1.5 mb-1.5 text-zinc-400 font-medium">
          <Settings className="w-3 h-3" />
          {toolCall.name.replace(/_/g, ' ')}
        </div>
        <pre className="text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
          {typeof displayData === 'object' 
            ? JSON.stringify(displayData, null, 2) 
            : String(displayData).substring(0, 500)}
        </pre>
      </div>
    );
  };

  const handleAuthRetry = () => {
    setIsAuthError(false);
    loadFiles();
    loadVersions();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-200">
      {/* Auth Error Banner */}
      {isAuthError && (
        <div className="bg-blue-900/30 border-b border-blue-500/30 px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2 fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-full">
              <AlertCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-200">Authentication Required</h3>
              <p className="text-xs text-blue-300/80">Please sign in with Google to access this Apps Script project.</p>
            </div>
          </div>
          <button 
            onClick={handleAuthRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Code className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              {projectName || 'Apps Script Project'}
            </h2>
            <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-400 font-mono">
              ID: {projectId}
            </p>
              {spreadsheetContext.spreadsheetId && !spreadsheetContext.isLoading && (
                <a 
                  href={spreadsheetContext.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                  title={`Open ${spreadsheetContext.spreadsheetName || 'Spreadsheet'}`}
                >
                  <Table2 className="w-3 h-3" />
                  <span className="max-w-[150px] truncate">
                    {spreadsheetContext.spreadsheetName || 'Bound Spreadsheet'}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {spreadsheetContext.isLoading && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading spreadsheet...
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-green-400 text-xs mr-2 animate-in fade-in slide-in-from-right-4">
              <CheckCircle className="w-3.5 h-3.5" />
              Saved
            </div>
          )}
          
          <button
            onClick={handleSave}
            disabled={!selectedFile || isSaving || isLoadingContent}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save locally (Cmd/Ctrl+S)"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
          
          <div className="w-px h-5 bg-zinc-700 mx-1" />

          {/* Google Sync Buttons */}
          <button
            onClick={handlePushToGoogle}
            disabled={isPushing || isPulling}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Push and create version"
          >
            {isPushing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Push
          </button>
          
          <button
            onClick={handlePullFromGoogle}
            disabled={isPushing || isPulling}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Pull latest from Google Apps Script"
          >
            {isPulling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Pull
          </button>

          {syncStatus === 'pushed' && (
            <div className="flex items-center gap-1 text-green-400 text-xs animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5" />
              {lastPushedVersion ? `Pushed! (v${lastPushedVersion})` : 'Pushed!'}
            </div>
          )}
          {syncStatus === 'pulled' && (
            <div className="flex items-center gap-1 text-amber-400 text-xs animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5" />
              Pulled!
            </div>
          )}

          <button
            onClick={handleDeployDevVersion}
            disabled={isDeploying || isPushing || isPulling}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Deploy Dev Version"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5" />
                Deploy Dev
              </>
            )}
          </button>

          <div className="w-px h-5 bg-zinc-700 mx-1" />

          {/* Run & Version Buttons */}
          <button
            onClick={() => {
              setShowRunDialog(true);
              // Auto-select first function if available
              setFunctionToRun(availableFunctions.length > 0 ? availableFunctions[0] : '');
              setRunResult(null);
            }}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Run a function"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Run
          </button>

          <div className="w-px h-5 bg-zinc-700 mx-1" />
          
          <button
            onClick={loadFiles}
            disabled={isLoadingFiles}
            className="p-1.5 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white"
            title="Refresh Files"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="w-px h-5 bg-zinc-700 mx-1" />
          
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-1.5 rounded transition-colors ${
              isChatOpen 
                ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' 
                : 'hover:bg-zinc-700 text-zinc-400 hover:text-white'
            }`}
            title={isChatOpen ? 'Close AI Chat' : 'Open AI Chat'}
          >
            {isChatOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - File List */}
        <div className="w-64 border-r border-zinc-700 flex flex-col bg-zinc-850">
          <div className="p-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Files {selectedVersion !== null && `(v${selectedVersion})`}
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingFiles ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin mb-2" />
                <span className="text-xs">Loading...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-xs">
                No files found
              </div>
            ) : (
              <div className="px-2 space-y-0.5">
                {files.map((file) => (
                  <button
                    key={file.id || file.name}
                    onClick={() => handleFileSelect(file.name)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                      selectedFile === file.name
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
                    }`}
                  >
                    <FileCode className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="ml-auto text-[10px] opacity-50 font-mono">
                      {file.type === 'server_js' || file.type === 'SERVER_JS' ? 'gs' : 
                       file.type === 'html' || file.type === 'HTML' ? 'html' : 
                       file.type === 'json' || file.type === 'JSON' ? 'json' : 
                       file.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Version History Selector */}
          <div className="border-t border-zinc-700">
            <button
              onClick={() => setShowVersionDropdown(!showVersionDropdown)}
              className="w-full flex items-center justify-between p-3 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5" />
                <span>
                  {selectedVersion ? `v${selectedVersion}` : 'Current (HEAD)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isLoadingVersions && <Loader2 className="w-3 h-3 animate-spin" />}
                {showVersionDropdown ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {showVersionDropdown && (
              <div className="max-h-48 overflow-y-auto bg-zinc-900 border-b border-zinc-700 shadow-inner">
                <button
                  onClick={() => handleVersionSelect(null)}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between ${
                    selectedVersion === null 
                      ? 'bg-blue-600/20 text-blue-400' 
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <span className="font-medium">Current (HEAD)</span>
                  <span className="opacity-50">Local</span>
                </button>
                
                {versions.map((v) => (
                  <button
                    key={v.versionNumber}
                    onClick={() => handleVersionSelect(v.versionNumber)}
                    className={`w-full text-left px-4 py-2 text-xs border-t border-zinc-800/50 ${
                      selectedVersion === v.versionNumber
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono font-medium">v{v.versionNumber}</span>
                      <span className="opacity-50 text-[10px]">
                        {new Date(v.createTime).toLocaleDateString()}
                      </span>
                    </div>
                    {v.description && (
                      <div className="truncate opacity-70 text-[10px]">
                        {v.description}
                      </div>
                    )}
                  </button>
                ))}
                
                {versions.length === 0 && !isLoadingVersions && (
                  <div className="px-4 py-3 text-xs text-zinc-600 text-center italic">
                    No versions created yet
                  </div>
                )}
              </div>
            )}

            {selectedVersion !== null && (
              <div className="p-2 bg-zinc-900 border-t border-zinc-700">
                <button
                  onClick={handleRestoreVersion}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded border border-zinc-700 transition-colors"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                  Restore to Local
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-zinc-900 relative">
          {error && (
            <div className="absolute top-4 right-4 left-4 z-10 bg-red-900/80 border border-red-700 text-red-200 px-4 py-2 rounded-md shadow-lg flex items-start gap-2 text-sm backdrop-blur-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">{error}</div>
              <button 
                onClick={() => setError(null)}
                className="ml-2 hover:text-white"
              >
                ×
              </button>
            </div>
          )}

          {isLoadingContent ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-sm">Reading file...</p>
              </div>
            </div>
          ) : selectedFile ? (
            <div className="flex-1 flex overflow-hidden relative">
              <div
                ref={lineNumbersRef}
                className="h-full py-4 pr-3 pl-2 text-right bg-zinc-900 border-r border-zinc-800 select-none overflow-hidden text-zinc-600 font-mono text-sm leading-relaxed"
                style={{ minWidth: '3rem' }}
              >
                {fileContent.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                className="flex-1 w-full h-full bg-zinc-900 text-zinc-300 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed custom-scrollbar whitespace-pre"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
              <Code className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Select a file to start editing</p>
            </div>
          )}
        </div>

        {/* AI Chat Panel */}
        {isChatOpen && (
          <div className="w-80 border-l border-zinc-700 flex flex-col bg-zinc-850">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-zinc-700 flex items-center gap-2">
              <div className="p-1.5 bg-violet-500/20 rounded-md">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                <div className="flex items-center gap-2">
                <p className="text-[10px] text-zinc-500">Ask about your code</p>
                  {conversationHistoryRef.current.length > 1 && (
                    <button
                      onClick={clearConversationContext}
                      className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
                      title="Clear conversation context"
                    >
                      ({conversationHistoryRef.current.length - 1} msgs) Clear
                    </button>
                  )}
                  {conversationsConnected ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-400">
                      <Cloud className="w-3 h-3" />
                      Synced
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-yellow-400">
                      <CloudOff className="w-3 h-3" />
                      Offline
                      {pendingCount > 0 && ` (${pendingCount})`}
                    </span>
                  )}
                </div>
              </div>
              {/* Model Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded text-zinc-300 transition-colors"
                  title="Select AI Model"
                >
                  <Bot className="w-3 h-3" />
                  <span className="max-w-[60px] truncate">
                    {selectedModel ? selectedModel.replace('gemini-', '').replace('-preview', '') : 'Model'}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showModelDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    {isLoadingModels ? (
                      <div className="p-3 text-center text-zinc-500 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                        Loading models...
                      </div>
                    ) : availableModels.length === 0 ? (
                      <div className="p-3 text-center text-zinc-500 text-xs">
                        No models available
                      </div>
                    ) : (
                      availableModels.map((model) => (
                        <button
                          key={model.modelId}
                          onClick={() => {
                            setSelectedModel(model.modelId);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-700 transition-colors flex items-center justify-between ${
                            selectedModel === model.modelId ? 'bg-violet-600/20 text-violet-300' : 'text-zinc-300'
                          }`}
                        >
                          <span className="truncate">{model.displayName || model.modelId}</span>
                          {model.modelId === defaultModel && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded ml-2">
                              default
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="p-3 bg-violet-500/10 rounded-full mb-3">
                    <MessageSquare className="w-6 h-6 text-violet-400" />
                  </div>
                  <p className="text-sm text-zinc-400 mb-2">Apps Script AI Assistant</p>
                  <div className="text-xs text-zinc-500 space-y-1">
                    <p>✨ "Create an HTML page to display data"</p>
                    <p>🔧 "Add a function to get sheet data"</p>
                    <p>🐛 "Debug this code"</p>
                    <p>📝 "Explain what this does"</p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-zinc-700 text-zinc-200 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.toolCalls && msg.toolCalls.map((toolCall, idx) => (
                        <div key={idx}>
                          {formatToolResult(toolCall)}
                        </div>
                      ))}
                      
                      <p className={`text-[10px] mt-1 ${
                        msg.role === 'user' ? 'text-blue-200' : 'text-zinc-500'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="bg-zinc-700 text-zinc-200 px-3 py-2 rounded-lg rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-zinc-700">
              <div className="flex gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Create HTML, modify code, ask questions..."
                  rows={1}
                  className="flex-1 bg-zinc-800 text-zinc-200 text-sm px-3 py-2 rounded-lg border border-zinc-600 focus:border-violet-500 focus:outline-none resize-none placeholder:text-zinc-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Run Function Dialog */}
      {showRunDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-xl border border-zinc-700 shadow-2xl w-full max-w-md mx-4">
            <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-violet-400" />
                Run Function
              </h3>
              <button
                onClick={() => {
                  setShowRunDialog(false);
                  setRunResult(null);
                  setFunctionToRun('');
                }}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Select Function</label>
                <div className="relative">
                  <select
                    value={functionToRun}
                    onChange={(e) => setFunctionToRun(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none appearance-none cursor-pointer pr-10"
                    autoFocus
                  >
                    <option value="">-- Select a function --</option>
                    {availableFunctions.map((func) => (
                      <option key={func} value={func}>
                        {func}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 pointer-events-none" />
                </div>
                {availableFunctions.length === 0 ? (
                  <p className="text-[10px] text-amber-400 mt-1.5">
                    No functions detected. Make sure your .gs files contain valid function declarations.
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-500 mt-1.5">
                    Found {availableFunctions.length} function{availableFunctions.length !== 1 ? 's' : ''} in project. Runs in devMode.
                  </p>
                )}
              </div>

              {runResult && (
                <div className={`p-3 rounded-lg text-xs ${
                  runResult.success 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className={`font-medium mb-1 ${runResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {runResult.success ? '✅ Success' : '❌ Error'}
                  </div>
                  {runResult.success ? (
                    <pre className="text-zinc-300 whitespace-pre-wrap overflow-auto max-h-40">
                      {runResult.result !== undefined 
                        ? JSON.stringify(runResult.result, null, 2) 
                        : '(no return value)'}
                    </pre>
                  ) : (
                    <p className="text-red-300">{runResult.error}</p>
                  )}
                  {runResult.logs && runResult.logs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-700">
                      <div className="text-zinc-400 mb-1">Logs:</div>
                      {runResult.logs.map((log, i) => (
                        <div key={i} className="text-zinc-300">{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRunDialog(false);
                    setRunResult(null);
                    setFunctionToRun('');
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRunFunction}
                  disabled={!functionToRun.trim() || isRunning}
                  className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

