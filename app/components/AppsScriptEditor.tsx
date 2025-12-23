'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMCPTools } from '@/hooks/useMCPTools';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';

import { 
  ScriptFile, 
  SpreadsheetContext, 
  ChatMessage 
} from './AppsScriptEditor/types';
import { EditorHeader } from './AppsScriptEditor/EditorHeader';
import { FileList } from './AppsScriptEditor/FileList';
import { CodeEditor } from './AppsScriptEditor/CodeEditor';
import { ChatInterface } from './AppsScriptEditor/ChatInterface';
import { RunDialog } from './AppsScriptEditor/RunDialog';
import { formatToolResult as formatToolResultHelper } from './AppsScriptEditor/formatToolResult';

// Hooks
import { useAppsScriptFiles } from './AppsScriptEditor/useAppsScriptFiles';
import { useAppsScriptVersions } from './AppsScriptEditor/useAppsScriptVersions';
import { useSpreadsheetContext } from './AppsScriptEditor/useSpreadsheetContext';
import { useAppsScriptAI } from './AppsScriptEditor/useAppsScriptAI';

interface AppsScriptEditorProps {
  projectId: string;  // This is the PROD script ID
  projectName?: string;
  serverKey: string;
  serviceName?: string;
  // DEV environment (Local → DEV → PROD workflow)
  devScriptId?: string;
  devSpreadsheetId?: string;
  devSpreadsheetUrl?: string;
  prodSpreadsheetId?: string;
  prodSpreadsheetUrl?: string;
  onConversationChange?: (conversationId: string | undefined) => void;
}

export default function AppsScriptEditor({ 
  projectId, 
  projectName, 
  serverKey, 
  serviceName = 'apps-script',
  devScriptId,
  devSpreadsheetId,
  devSpreadsheetUrl,
  prodSpreadsheetId,
  prodSpreadsheetUrl,
  onConversationChange
}: AppsScriptEditorProps) {
  // Model Selection State
  const [availableModels, setAvailableModels] = useState<Array<{ modelId: string; displayName: string }>>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // MCP Hooks
  const { callTool, loading: mcpLoading } = useMCPTools(serverKey, serviceName);
  const { callTool: callSheetsTool } = useMCPTools(serverKey, 'sheets');
  
  // Google Sheets Hook
  const { createSpreadsheetWithScript } = useGoogleSheets();

  // Auth context
  const { user } = useAuth();

  // File Management Hook
  const {
    files, setFiles, selectedFile, setSelectedFile, fileContent, setFileContent,
    isLoadingFiles, isLoadingContent, isSaving, isPushing, isPulling, isDeploying,
    isPullingDev, isPushingProd, isPullingProd,
    error, setError, saveStatus, syncStatus, lastPushedVersion, isAuthError, setIsAuthError,
    loadFiles, handleFileSelect, handleSave, handlePushToGoogle, handlePullFromGoogle,
    handlePushToDev, handlePullFromDev, handlePushDevToProd, handlePullFromProd, hasDevEnvironment, handleRestoreVersion
  } = useAppsScriptFiles({ projectId, projectName, devScriptId, callTool, createSpreadsheetWithScript });

  // Versions Hook
  const {
    devVersions, selectedDevVersion, isLoadingDevVersions, showDevVersionDropdown, setShowDevVersionDropdown,
    prodVersions, selectedProdVersion, isLoadingProdVersions, showProdVersionDropdown, setShowProdVersionDropdown,
    versions, selectedVersion, isLoadingVersions, showVersionDropdown, setShowVersionDropdown,
    activeVersionEnv, setActiveVersionEnv, loadDevVersions, loadProdVersions, loadVersions, handleVersionSelect,
    setSelectedDevVersion, setSelectedProdVersion, setSelectedVersion
  } = useAppsScriptVersions({ projectId, devScriptId, callTool, setIsAuthError, loadFiles, setFiles, setSelectedFile, setFileContent, setError });

  // Spreadsheet Context Hook
  const { spreadsheetContext, loadSpreadsheetContext } = useSpreadsheetContext({ projectId, callTool, callSheetsTool });

  // Conversations hook for persistence
  const {
    currentConversation, messages: persistedMessages, isLoading: conversationsLoading,
    isConnected: conversationsConnected, pendingCount, createConversation, loadConversation, saveMessage, listConversations,
  } = useConversations(serverKey);

  // AI Chat Hook
  const {
    chatMessages, setChatMessages, chatInput, setChatInput, isChatLoading,
    handleSendMessage, clearConversationContext, conversationHistoryRef
  } = useAppsScriptAI({
    projectId, projectName, selectedFile, fileContent, devScriptId, devSpreadsheetId, devSpreadsheetUrl,
    prodSpreadsheetId, prodSpreadsheetUrl, spreadsheetContext, files, selectedModel,
    callTool, setFileContent, loadFiles, loadVersions, user, currentConversation, saveMessage
  });

  // State
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ success: boolean; result?: any; error?: string; logs?: string[] } | null>(null);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [functionToRun, setFunctionToRun] = useState('');
  const [availableFunctions, setAvailableFunctions] = useState<string[]>([]);

  const [isChatOpen, setIsChatOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    loadFiles();
    const loadAllVersions = async () => {
      await Promise.all([
        devScriptId ? loadDevVersions() : Promise.resolve(),
        loadProdVersions()
      ]);
      loadVersions();
    };
    loadAllVersions();
  }, [projectId, serverKey, serviceName, devScriptId]);

  // Fetch available Gemini models on mount
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const response = await fetch('/api/gemini');
        if (response.ok) {
          const data = await response.json();
          const contentModels = (data.models || []).filter((m: any) => 
            m.supportedGenerationMethods?.includes('generateContent')
          );
          setAvailableModels(contentModels);
          setDefaultModel(data.defaultModel || '');
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
      setAvailableFunctions([]);
      return;
    }

    const functions: string[] = [];
    const functionRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;

    for (const file of files) {
      const isGsFile = file.type?.toLowerCase() === 'server_js' || file.name?.endsWith('.gs') || file.type === 'SERVER_JS';
      let sourceToScan = file.source;
      if (!sourceToScan && file.name === selectedFile && fileContent) {
        sourceToScan = fileContent;
      }
      
      if (isGsFile && sourceToScan) {
        functionRegex.lastIndex = 0;
        let match;
        while ((match = functionRegex.exec(sourceToScan)) !== null) {
          const funcName = match[1];
          if (!funcName.startsWith('_') && !functions.includes(funcName)) {
            functions.push(funcName);
          }
        }
      }
    }

    const priorityFunctions = ['doGet', 'doPost', 'onOpen', 'onEdit', 'onInstall', 'main', 'run'];
    functions.sort((a, b) => {
      const aIdx = priorityFunctions.indexOf(a);
      const bIdx = priorityFunctions.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });

    setAvailableFunctions(functions);
  }, [files, selectedFile, fileContent]);

  useEffect(() => {
    extractFunctions();
  }, [extractFunctions]);

  useEffect(() => {
    loadSpreadsheetContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, serverKey]); // loadSpreadsheetContext is stable via refs

  useEffect(() => {
    const initConversation = async () => {
      if (!user?.email || !serverKey) return;
      try {
        const conversations = await listConversations();
        const existing = conversations.find(c => {
          const meta = c.metadata as { project_id?: string; user_email?: string } | undefined;
          return meta?.project_id === projectId && meta?.user_email === user.email;
        });

        if (existing) {
          await loadConversation(existing.id);
          onConversationChange?.(existing.id);
        } else {
          const conv = await createConversation(`Apps Script: ${projectName || projectId}`, {
            project_id: projectId, project_name: projectName, user_email: user.email, source: 'appsscript-editor',
          });
          if (conv) {
            await loadConversation(conv.id);
            onConversationChange?.(conv.id);
          }
        }
      } catch (err: any) {
        console.warn('Conversation persistence unavailable:', err?.message || err);
      }
    };
    initConversation();
  }, [projectId, user?.email, serverKey, listConversations, loadConversation, createConversation, onConversationChange, projectName]);

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
  }, [persistedMessages, setChatMessages]);

  const handleRunFunction = async () => {
    if (!functionToRun.trim()) {
      setError('Please enter a function name');
      return;
    }

    setIsRunning(true);
    setRunResult(null);
    setError(null);

    try {
      const result = await callTool('apps_script_run_function', { 
        projectId, 
        functionName: functionToRun.trim() 
      });

      if (result) {
        let parsed = result;
        if (result.content?.[0]?.text) {
          try { parsed = JSON.parse(result.content[0].text); } catch { parsed = result; }
        } else if (result.content && typeof result.content === 'object' && !Array.isArray(result.content)) {
          parsed = result.content;
        }
        
        if (typeof parsed?.success !== 'boolean') {
          parsed = { success: true, result: parsed, logs: [] };
        }
        
        setRunResult(parsed);
        if (!parsed.success) setError(parsed.error || 'Function execution failed');
      }
    } catch (err) {
      console.error('Error running function:', err);
      setError(err instanceof Error ? err.message : 'Error running function');
      setRunResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAuthRetry = () => {
    setIsAuthError(false);
    loadFiles();
    loadVersions();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-200">
      <EditorHeader
        projectName={projectName}
        projectId={projectId}
        devScriptId={devScriptId}
        devSpreadsheetUrl={devSpreadsheetUrl}
        prodSpreadsheetUrl={prodSpreadsheetUrl}
        spreadsheetContext={spreadsheetContext}
        selectedFile={selectedFile}
        onSave={handleSave}
        saveStatus={saveStatus}
        isSaving={isSaving}
        isLoadingContent={isLoadingContent}
        isPushing={isPushing}
        isPulling={isPulling}
        onPushToGoogle={handlePushToGoogle}
        onPullFromGoogle={handlePullFromGoogle}
        syncStatus={syncStatus}
        lastPushedVersion={lastPushedVersion}
        isDeploying={isDeploying}
        isPullingDev={isPullingDev}
        isPushingProd={isPushingProd}
        isPullingProd={isPullingProd}
        onPushToDev={handlePushToDev}
        onPullFromDev={handlePullFromDev}
        onPushDevToProd={handlePushDevToProd}
        onPullFromProd={handlePullFromProd}
        hasDevEnvironment={hasDevEnvironment}
        isRunning={isRunning}
        onOpenRunDialog={() => {
          setShowRunDialog(true);
          setFunctionToRun(availableFunctions.length > 0 ? availableFunctions[0] : '');
          setRunResult(null);
        }}
        isLoadingFiles={isLoadingFiles}
        onRefreshFiles={loadFiles}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
        isAuthError={isAuthError}
        onAuthRetry={handleAuthRetry}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <FileList
          files={files}
          selectedFile={selectedFile}
          isLoadingFiles={isLoadingFiles}
          selectedVersion={selectedVersion}
          onFileSelect={handleFileSelect}
          devScriptId={devScriptId}
          devVersions={devVersions}
          selectedDevVersion={selectedDevVersion}
          isLoadingDevVersions={isLoadingDevVersions}
          showDevVersionDropdown={showDevVersionDropdown}
          setShowDevVersionDropdown={setShowDevVersionDropdown}
          onDevVersionSelect={(v) => {
            setSelectedDevVersion(v);
            setSelectedProdVersion(null);
            setActiveVersionEnv(v === null ? null : 'dev');
            setShowDevVersionDropdown(false);
          }}
          prodVersions={prodVersions}
          selectedProdVersion={selectedProdVersion}
          isLoadingProdVersions={isLoadingProdVersions}
          showProdVersionDropdown={showProdVersionDropdown}
          setShowProdVersionDropdown={setShowProdVersionDropdown}
          onProdVersionSelect={(v) => {
            setSelectedProdVersion(v);
            setSelectedDevVersion(null);
            setActiveVersionEnv(v === null ? null : 'prod');
            setShowProdVersionDropdown(false);
          }}
          versions={versions}
          showVersionDropdown={showVersionDropdown}
          setShowVersionDropdown={setShowVersionDropdown}
          isLoadingVersions={isLoadingVersions}
          onVersionSelect={handleVersionSelect}
          activeVersionEnv={activeVersionEnv}
          handleRestoreVersion={() => handleRestoreVersion(selectedVersion!, files)}
          isSaving={isSaving}
        />

        <CodeEditor
          fileContent={fileContent}
          setFileContent={setFileContent}
          selectedFile={selectedFile}
          isLoadingContent={isLoadingContent}
          error={error}
          setError={setError}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          textareaRef={textareaRef}
          lineNumbersRef={lineNumbersRef}
        />

        <ChatInterface
          chatMessages={chatMessages}
          chatInput={chatInput}
          isChatLoading={isChatLoading}
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
          setChatInput={setChatInput}
          onSendMessage={handleSendMessage}
          onChatKeyDown={handleChatKeyDown}
          onClearContext={clearConversationContext}
          conversationHistoryLength={conversationHistoryRef.current.length > 1 ? conversationHistoryRef.current.length - 1 : 0}
          conversationsConnected={conversationsConnected}
          pendingCount={pendingCount}
          availableModels={availableModels}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          defaultModel={defaultModel}
          isLoadingModels={isLoadingModels}
          showModelDropdown={showModelDropdown}
          setShowModelDropdown={setShowModelDropdown}
          chatEndRef={chatEndRef}
          formatToolResult={formatToolResultHelper}
        />
      </div>

      <RunDialog
        showRunDialog={showRunDialog}
        onClose={() => setShowRunDialog(false)}
        availableFunctions={availableFunctions}
        functionToRun={functionToRun}
        setFunctionToRun={setFunctionToRun}
        runResult={runResult}
        setRunResult={setRunResult}
        isRunning={isRunning}
        onRun={handleRunFunction}
      />
    </div>
  );
}
