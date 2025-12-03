'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMCPTools } from '@/hooks/useMCPTools';
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
  Bot
} from 'lucide-react';

interface AppsScriptEditorProps {
  projectId: string;
  projectName?: string;
  serverKey: string;
  serviceName?: string;
}

interface ScriptFile {
  name: string;
  type: string;
  source?: string;
  id?: string;
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
  serviceName = 'apps-script' 
}: AppsScriptEditorProps) {
  // State
  const [files, setFiles] = useState<ScriptFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // MCP Hooks
  const { callTool, loading: mcpLoading } = useMCPTools(serverKey, serviceName);

  // Fetch files on mount
  useEffect(() => {
    loadFiles();
  }, [projectId, serverKey, serviceName]);

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
        // Handle content wrapper
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
        } else if (result.files) {
           parsedFiles = result.files.map(normalizeFile);
        }

        console.log('📄 Files loaded:', parsedFiles);
        setFiles(parsedFiles);
        
        // Auto-select first file
        if (parsedFiles.length > 0 && !selectedFile) {
          handleFileSelect(parsedFiles[0].name);
        }
      } else {
        setError(result?.error || 'Failed to load files');
      }
    } catch (err) {
      console.error('Error loading files:', err);
      setError(err instanceof Error ? err.message : 'Unknown error loading files');
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

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const processUserMessage = async (message: string): Promise<{ content: string; toolCalls?: any[] }> => {
    const availableTools = [
      {
        name: 'apps_script_list_files',
        description: 'List all files in the current Apps Script project',
        parameters: { projectId: 'string (The project ID)' }
      },
      {
        name: 'apps_script_read_file',
        description: 'Read the contents of a file in the Apps Script project',
        parameters: { 
          projectId: 'string (The project ID)',
          fileName: 'string (The file name, e.g., "Code.gs")'
        }
      },
      {
        name: 'apps_script_write_file',
        description: 'Write/update a file in the Apps Script project',
        parameters: {
          projectId: 'string (The project ID)',
          fileName: 'string (The file name)',
          content: 'string (The new file content)'
        }
      }
    ];

    // Add context about current file
    const context = {
      availableTools,
      currentProject: projectId,
      currentProjectName: projectName,
      currentFile: selectedFile,
      currentFileContent: fileContent ? fileContent.substring(0, 2000) : null // Limit context size
    };

    try {
      let conversationHistory: Array<{
        role: string;
        content: string;
        toolCalls?: any[];
      }> = [{ role: 'user', content: message }];
      let allToolCalls: any[] = [];
      let maxIterations = 5;
      let finalContent = '';

      for (let iteration = 0; iteration < maxIterations; iteration++) {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: conversationHistory,
            context
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

        conversationHistory.push({
          role: 'assistant',
          content: data.content,
          toolCalls: executedTools
        });
        conversationHistory.push({
          role: 'tool',
          content: JSON.stringify(executedTools.map(t => ({
            tool: t.name,
            result: t.result
          })))
        });
      }

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
      const files = toolCall.result?.content || toolCall.result || [];
      return (
        <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-blue-400 font-medium">
            <FileCode className="w-3 h-3" />
            Files in Project
          </div>
          <div className="space-y-0.5">
            {(Array.isArray(files) ? files : []).map((file: any, idx: number) => (
              <div key={idx} className="text-zinc-300 font-mono">
                {typeof file === 'string' ? file : file.name}
              </div>
            ))}
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

    return (
      <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
        <pre className="text-zinc-300 whitespace-pre-wrap">
          {JSON.stringify(toolCall.result, null, 2).substring(0, 300)}
        </pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-200">
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
            <p className="text-xs text-zinc-400 font-mono">
              ID: {projectId}
            </p>
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
            title="Save (Cmd/Ctrl+S)"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
          
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
            Files
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
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 w-full h-full bg-zinc-900 text-zinc-300 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed custom-scrollbar"
              spellCheck={false}
            />
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
                <p className="text-[10px] text-zinc-500">Ask about your code</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="p-3 bg-violet-500/10 rounded-full mb-3">
                    <MessageSquare className="w-6 h-6 text-violet-400" />
                  </div>
                  <p className="text-sm text-zinc-400 mb-1">No messages yet</p>
                  <p className="text-xs text-zinc-500">
                    Ask me to explain, refactor, or debug your Apps Script code
                  </p>
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
                  placeholder="Ask about your code..."
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
    </div>
  );
}

