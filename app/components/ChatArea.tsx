'use client';

import { useState, useRef, useEffect } from 'react';
import ServerList from './ServerList';
import { useAuth } from '@/contexts/AuthContext';
import AuthButton from './AuthButton';
import FileUpload, { UploadedFile } from './FileUpload';
import { useMCPTools } from '@/hooks/useMCPTools';
import { useMCPServices } from '@/hooks/useMCPServices';
import { useMCPServiceTools } from '@/hooks/useMCPServiceTools';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
  files?: UploadedFile[];
  toolCalls?: Array<{
    name: string;
    args: any;
    result?: any;
  }>;
}

interface ChatAreaProps {
  tabId: string;
}

interface MCPServiceCardProps {
  serverName: string;
  serviceName: string;
  description: string;
  serverKey: string;
}

function MCPServiceCard({ serverName, serviceName, description, serverKey }: MCPServiceCardProps) {
  const { tools, loading } = useMCPServiceTools(serverKey, serviceName);
  
  const getServiceIcon = (name: string) => {
    if (name === 'file-conversion') return '🔄';
    if (name === 'gmail') return '📧';
    return '📁';
  };

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
      {/* Card Header */}
      <div className="bg-zinc-900 p-3 border-b border-zinc-700">
        <div className="flex items-start gap-2">
          <span className="text-lg">{getServiceIcon(serviceName)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-zinc-500">MCP Server</div>
            <div className="font-semibold text-sm text-zinc-200">{serverName}</div>
            <div className="text-xs text-zinc-500 mt-1">Service Type</div>
            <div className="font-mono text-xs text-blue-400">{serviceName}</div>
          </div>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="p-3">
        {loading ? (
          <div className="text-xs text-zinc-500">Loading endpoints...</div>
        ) : tools.length > 0 ? (
          <details className="group" open>
            <summary className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-zinc-300 flex items-center gap-2 mb-2">
              <span className="group-open:rotate-90 transition-transform">▶</span>
              Available Endpoints ({tools.length})
            </summary>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {tools.map((tool) => (
                <div key={tool.name} className="bg-zinc-900 rounded p-2 border border-zinc-700">
                  <div className="font-mono text-[10px] text-blue-400">
                    {tool.name}
                  </div>
                  {tool.description && (
                    <div className="text-[9px] text-zinc-500 mt-0.5 line-clamp-2">
                      {tool.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        ) : (
          <div className="text-xs text-zinc-500">No endpoints available</div>
        )}
      </div>
    </div>
  );
}

export default function ChatArea({ tabId }: ChatAreaProps) {
  const { user } = useAuth();
  const [showFileTree, setShowFileTree] = useState(true);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedServerName, setSelectedServerName] = useState<string>('');
  const [isServerListCollapsed, setIsServerListCollapsed] = useState(false);
  
  // MCP Service Discovery
  const { services } = useMCPServices(selectedServer || '');
  
  // MCP Tools (default to filesystem for backward compatibility)
  const { callTool, listDirectory, readFile, getFileInfo, loading: mcpLoading } = useMCPTools(selectedServer || '', 'filesystem');
  
  const searchFiles = async (path: string, pattern: string, searchContent: boolean = false, maxResults: number = 100) => {
    return await callTool('fs_search_files', { path, pattern, searchContent, maxResults });
  };
  
  const downloadFile = async (path: string) => {
    return await callTool('fs_download_file', { path });
  };
  
  const uploadFile = async (filename: string, content: string, encoding: 'utf8' | 'base64' = 'base64') => {
    return await callTool('fs_upload_file', { filename, content, encoding });
  };
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: user 
        ? `Hello ${user.email}! I'm connected to your remote MCP server. How can I assist you today?`
        : 'Welcome! Please sign in with OAuth to connect to the remote MCP server.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const attachedFilesRef = useRef<UploadedFile[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update welcome message when auth or server selection changes
  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: user 
        ? selectedServer 
          ? `Connected to ${selectedServerName}. You can browse files in the right panel or chat with the server here.`
          : `Hello ${user.email}! Select an MCP server from the right panel to browse its file system.`
        : 'Welcome! Please sign in with OAuth to connect to the remote MCP server.',
      timestamp: new Date(),
    }]);
    setConnectionStatus(user && selectedServer ? 'connected' : user ? 'disconnected' : 'disconnected');
    
    // Expand the server list when no server is selected
    if (!selectedServer) {
      setIsServerListCollapsed(false);
    }
  }, [user, selectedServer, selectedServerName]);

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || mcpLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    const currentFiles = [...uploadedFiles];
    
    // Store files in ref so they can be accessed during AI processing
    attachedFilesRef.current = currentFiles;
    
    setInput('');
    setUploadedFiles([]);
    setIsTyping(true);

    try {
      // Build file information for AI (but don't upload yet)
      let fileInfo = '';
      if (currentFiles.length > 0) {
        const fileDescriptions = currentFiles.map(file => {
          const fileType = file.file.type.startsWith('image/') ? 'Image' : 'File';
          const fileSize = (file.file.size / 1024).toFixed(2);
          return `- ${fileType}: "${file.file.name}" (${fileSize} KB, type: ${file.file.type})`;
        });
        fileInfo = `\n\n[User has attached ${currentFiles.length} file(s) to this message:]\n${fileDescriptions.join('\n')}\n[Note: Files are ready to be uploaded if needed. Use fs_upload_file to save them.]`;
      }

      // Process with AI - include file info
      let messageWithFiles = currentInput || "User sent files without a message.";
      messageWithFiles += fileInfo;

      const response = await processUserMessage(messageWithFiles, currentFiles);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        toolCalls: response.toolCalls,
      };
      
      console.log('💬 Assistant message created with toolCalls:', assistantMessage.toolCalls);

      setMessages(prev => [...prev, assistantMessage]);
      setConnectionStatus('connected');
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      setConnectionStatus('error');
    } finally {
      setIsTyping(false);
      // Clear attached files after processing
      attachedFilesRef.current = [];
    }
  };

  const processUserMessage = async (message: string, files?: UploadedFile[]): Promise<{ content: string; toolCalls?: any[] }> => {
    // Dynamically fetch all available tools from all services
    const availableTools: any[] = [];
    
    // Fetch tools from all discovered services
    if (services && services.length > 0) {
      for (const service of services) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com'}/t/${selectedServer}/${service.name}/tools`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${user ? (await (async () => {
                const { data } = await (await import('@/lib/supabase')).supabase.auth.getSession();
                return data.session?.access_token;
              })()) : ''}`,
            },
          });
          
          if (response.ok) {
            const tools = await response.json();
            if (Array.isArray(tools)) {
              // Add service name prefix to distinguish tools from different services
              tools.forEach(tool => {
                availableTools.push({
                  name: tool.name,
                  description: tool.description || `Tool from ${service.name} service`,
                  parameters: tool.inputSchema?.properties || {},
                  service: service.name,
                  inputSchema: tool.inputSchema
                });
              });
            }
          }
        } catch (err) {
          console.error(`Failed to fetch tools for ${service.name}:`, err);
        }
      }
    } else {
      // Fallback to filesystem tools if no services discovered
      availableTools.push(
        {
          name: 'fs_search_files',
          description: 'Search for files matching a pattern (supports regex)',
          parameters: { 
            path: 'string',
            pattern: 'string',
            searchContent: 'boolean (optional)',
            maxResults: 'number (optional)'
          },
          service: 'filesystem'
        },
        {
          name: 'fs_list_directory',
          description: 'List contents of a directory',
          parameters: { path: 'string' },
          service: 'filesystem'
        },
        {
          name: 'fs_read_file', 
          description: 'Read contents of a file',
          parameters: { path: 'string' },
          service: 'filesystem'
        },
        {
          name: 'fs_get_file_info',
          description: 'Get metadata about a file or directory',
          parameters: { path: 'string' },
          service: 'filesystem'
        },
        {
          name: 'fs_download_file',
          description: 'Download a file (read as binary/base64)',
          parameters: { path: 'string' },
          service: 'filesystem'
        },
        {
          name: 'fs_upload_file',
          description: 'Upload file to Downloads folder',
          parameters: { 
            filename: 'string',
            content: 'string (base64 or utf8)',
            encoding: 'string (base64 or utf8)'
          },
          service: 'filesystem'
        }
      );
    }
    
    console.log(`🔧 Discovered ${availableTools.length} tools across ${services.length} services:`, 
      availableTools.map(t => `${t.service}:${t.name}`).join(', '));

    try {
      let conversationHistory: Array<{
        role: string;
        content: string;
      }> = [{ role: 'user', content: message }];
      let maxIterations = 5;
      let finalContent = '';
      let allToolCalls: any[] = [];

      for (let iteration = 0; iteration < maxIterations; iteration++) {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: conversationHistory,
            context: { availableTools }
          })
        });

        if (!response.ok) {
          throw new Error(`AI error: ${response.status}`);
        }

        const data = await response.json();
        finalContent = data.content;
        
        if (!data.toolCalls || data.toolCalls.length === 0) {
          break;
        }

        // Execute tool calls
        const executedTools = [];
        for (const toolCall of data.toolCalls) {
          try {
            let result;
            
            // Find which service this tool belongs to
            const toolInfo = availableTools.find(t => t.name === toolCall.name);
            const serviceName = toolInfo?.service || 'filesystem';
            
            // Handle filesystem tools with existing logic
            if (serviceName === 'filesystem') {
              switch (toolCall.name) {
                case 'fs_search_files':
                  result = await searchFiles(
                    toolCall.args.path,
                    toolCall.args.pattern,
                    toolCall.args.searchContent || false,
                    toolCall.args.maxResults || 100
                  );
                  break;
                case 'fs_list_directory':
                  result = await listDirectory(toolCall.args.path);
                  break;
                case 'fs_read_file':
                  result = await readFile(toolCall.args.path);
                  break;
                case 'fs_get_file_info':
                  result = await getFileInfo(toolCall.args.path);
                  break;
                case 'fs_download_file':
                  result = await downloadFile(toolCall.args.path);
                  console.log('🔍 fs_download_file result:', JSON.stringify(result, null, 2));
                  break;
                case 'fs_upload_file':
                  // Check if this is an attached file by filename
                  const attachedFile = attachedFilesRef.current.find(
                    f => f.file.name === toolCall.args.filename
                  );
                  
                  if (attachedFile && attachedFile.base64) {
                    // Use the attached file's base64 content
                    result = await uploadFile(
                      attachedFile.file.name,
                      attachedFile.base64,
                      'base64'
                    );
                  } else if (toolCall.args.content) {
                    // Use provided content (for other scenarios)
                    result = await uploadFile(
                      toolCall.args.filename,
                      toolCall.args.content,
                      toolCall.args.encoding || 'base64'
                    );
                  } else {
                    result = { error: `File "${toolCall.args.filename}" not found in attached files and no content provided` };
                  }
                  break;
                default:
                  result = { error: `Unknown filesystem tool: ${toolCall.name}` };
              }
            } else {
              // Handle tools from other services (file-conversion, gmail, etc.)
              // Make direct API call to the service
              const tunnelUrl = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';
              const { data: sessionData } = await (await import('@/lib/supabase')).supabase.auth.getSession();
              const token = sessionData.session?.access_token;
              
              const response = await fetch(`${tunnelUrl}/t/${selectedServer}/${serviceName}/tools/call`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  tool: toolCall.name,
                  arguments: toolCall.args,
                }),
              });
              
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                result = { error: errorData.message || errorData.error || `HTTP ${response.status}` };
              } else {
                const data = await response.json();
                result = data.result || data;
              }
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

        // Only keep "action" tool calls for UI display (not search/list operations)
        const actionTools = executedTools.filter(t => 
          ['fs_upload_file', 'fs_download_file', 'fs_write_file', 'fs_delete_file'].includes(t.name)
        );
        console.log('📊 Action tools filtered:', actionTools.length, 'tools:', actionTools.map(t => t.name));
        if (actionTools.length > 0) {
          allToolCalls.push(...actionTools);
          console.log('✅ Added to allToolCalls. Total count:', allToolCalls.length);
        }

        conversationHistory.push({
          role: 'assistant',
          content: data.content
        });
        conversationHistory.push({
          role: 'tool',
          content: JSON.stringify(executedTools.map(t => ({
            tool: t.name,
            result: t.result
          })))
        });
      }

      console.log('🎬 Final response - allToolCalls:', allToolCalls);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File processing logic
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: UploadedFile[] = [];
    const maxFiles = 10;
    const maxSizeMB = 100;
    const maxBytes = maxSizeMB * 1024 * 1024;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      if (file.size > maxBytes) {
        alert(`File "${file.name}" is too large. Maximum size is ${maxSizeMB}MB.`);
        continue;
      }

      if (uploadedFiles.length + newFiles.length >= maxFiles) {
        alert(`Maximum ${maxFiles} files allowed.`);
        break;
      }

      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${i}`,
        file,
      };

      if (file.type.startsWith('image/')) {
        uploadedFile.preview = URL.createObjectURL(file);
      }

      const base64 = await fileToBase64(file);
      uploadedFile.base64 = base64;

      newFiles.push(uploadedFile);
    }

    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDraggingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleFilePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      const fileList = new DataTransfer();
      files.forEach(file => fileList.items.add(file));
      processFiles(fileList.files);
    }
  };

  return (
    <div className="flex h-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*"
        onChange={handleFilePickerChange}
        className="hidden"
      />

      {/* Chat Section */}
      <div 
        className="flex flex-1 flex-col relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay - High z-index to appear above AI chat and all content */}
        {isDraggingFile && (
          <div className="fixed inset-0 z-[9999] bg-blue-600/20 backdrop-blur-sm border-4 border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
            <div className="bg-zinc-900/90 rounded-2xl p-8 text-center shadow-2xl">
              <svg
                className="w-20 h-20 text-blue-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <h3 className="text-2xl font-bold text-white mb-2">Drop files here</h3>
              <p className="text-zinc-400">Up to 10 files, 100MB each</p>
            </div>
          </div>
        )}
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">
              AI Assistant {selectedServerName && `- ${selectedServerName}`}
            </h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 
                'bg-gray-500'
              }`} />
              <span className="text-xs text-zinc-400">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'error' ? 'Error' : 
                 'Not Connected'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AuthButton />
            <button
              onClick={() => setShowFileTree(!showFileTree)}
              className={`p-1.5 rounded transition-colors ${
                showFileTree ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
              title={showFileTree ? 'Hide Servers' : 'Show Servers'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        {!selectedServer ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Select a Server</h3>
              <p className="text-sm">Choose an MCP server from the right panel to start</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                AI
              </div>
            )}
            
            <div
              className={`flex flex-col max-w-[70%] ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
            <div
              className={`rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.error
                  ? 'bg-red-900/50 text-red-200 border border-red-700'
                  : 'bg-zinc-700 text-white'
              }`}
            >
              {/* Display attached files */}
              {message.files && message.files.length > 0 && (
                <div className="mb-2 space-y-2">
                  {message.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 p-2 bg-black/20 rounded-lg"
                    >
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <span className="text-xs truncate flex-1">
                        {file.file.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              
              {/* Display Tool Call Results */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.toolCalls.map((toolCall, idx) => {
                    console.log(`🎨 Rendering tool call ${idx}:`, toolCall.name, 'result:', toolCall.result);
                    return (
                    <div key={idx} className="bg-black/20 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-green-400">
                          {toolCall.name === 'fs_upload_file' ? '📤 File Uploaded' :
                           toolCall.name === 'fs_download_file' ? '📥 File Downloaded' :
                           toolCall.name === 'fs_search_files' ? '🔍 Files Found' :
                           toolCall.name === 'fs_list_directory' ? '📁 Directory Listed' :
                           toolCall.name === 'fs_read_file' ? '📄 File Read' :
                           `🔧 ${toolCall.name}`}
                        </span>
                      </div>
                      
                      {/* Special handling for file downloads */}
                      {toolCall.name === 'fs_download_file' && (() => {
                        try {
                          console.log('🎯 Download button rendering, toolCall.result:', toolCall.result);
                          console.log('🎯 Download button rendering, toolCall.args:', toolCall.args);
                          
                          // Parse the download result
                          let fileData: string | undefined;
                          let fileName: string | undefined;
                          let mimeType: string | undefined;
                          
                          // Check if data is in content[0].data (MCP standard format)
                          const contentItem = toolCall.result?.content?.[0];
                          if (contentItem?.data) {
                            // Direct base64 data in content[0].data
                            fileData = contentItem.data;
                            fileName = toolCall.args.path?.split('/').pop() || 'downloaded-file';
                            
                            // Try to infer MIME type from filename extension
                            const ext = fileName?.split('.').pop()?.toLowerCase();
                            const mimeTypes: Record<string, string> = {
                              'pdf': 'application/pdf',
                              'png': 'image/png',
                              'jpg': 'image/jpeg',
                              'jpeg': 'image/jpeg',
                              'gif': 'image/gif',
                              'txt': 'text/plain',
                              'json': 'application/json',
                              'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                              'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            };
                            mimeType = (ext && mimeTypes[ext]) || 'application/octet-stream';
                          } else {
                            // Fallback: try to parse text as JSON
                            const resultText = contentItem?.text;
                            if (resultText) {
                              try {
                                const parsed = JSON.parse(resultText);
                                fileData = parsed.data || parsed.content || parsed.base64;
                                fileName = parsed.filename || parsed.name || toolCall.args.path?.split('/').pop() || 'downloaded-file';
                                mimeType = parsed.mimeType || parsed.type || 'application/octet-stream';
                              } catch {
                                // Not JSON, might be plain text message
                                return (
                                  <p className="text-xs text-zinc-300 font-mono">
                                    {resultText}
                                  </p>
                                );
                              }
                            }
                          }
                          
                          if (fileData) {
                            console.log('✅ Creating download button for:', fileName, 'MIME:', mimeType, 'Data length:', fileData.length);
                            // Create download button
                            return (
                              <button
                                onClick={() => {
                                  try {
                                    // Convert base64 to blob
                                    const byteCharacters = atob(fileData);
                                    const byteNumbers = new Array(byteCharacters.length);
                                    for (let i = 0; i < byteCharacters.length; i++) {
                                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    const blob = new Blob([byteArray], { type: mimeType });
                                    
                                    // Create download link
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = fileName || 'downloaded-file';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  } catch (err) {
                                    console.error('Download failed:', err);
                                    alert('Failed to download file');
                                  }
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-medium"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download {fileName}
                              </button>
                            );
                          }
                          
                          // Fallback to text display
                          return (
                            <p className="text-xs text-zinc-300">
                              {JSON.stringify(toolCall.result, null, 2)}
                            </p>
                          );
                        } catch (err) {
                          return (
                            <p className="text-xs text-red-300">
                              Error parsing download result: {err instanceof Error ? err.message : 'Unknown error'}
                            </p>
                          );
                        }
                      })()}
                      
                      {/* Regular result display for other tools */}
                      {toolCall.name !== 'fs_download_file' && toolCall.result?.content?.[0]?.text && (
                        <p className="text-xs text-zinc-300 font-mono">
                          {toolCall.result.content[0].text}
                        </p>
                      )}
                      {toolCall.name !== 'fs_download_file' && toolCall.result?.content && !toolCall.result.content[0]?.text && (
                        <p className="text-xs text-zinc-300">
                          {typeof toolCall.result.content === 'string' 
                            ? toolCall.result.content 
                            : JSON.stringify(toolCall.result.content, null, 2)}
                        </p>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
              <span className="text-xs text-zinc-500 mt-1 px-2">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                U
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
              AI
            </div>
            <div className="bg-zinc-700 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>
        )}

        {/* Input Area */}
        {selectedServer && (
          <div className="border-t border-zinc-700 bg-zinc-800 p-4">
        {/* File Upload Area - Shows attached files before sending */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3">
            <FileUpload
              files={uploadedFiles}
              onFilesChange={setUploadedFiles}
              onTriggerPicker={triggerFilePicker}
              maxFiles={10}
              maxSizeMB={100}
              accept="*"
            />
          </div>
        )}

        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-zinc-700 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder={uploadedFiles.length > 0 ? `Message with ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}...` : "Type a message..."}
              className="w-full bg-transparent text-white placeholder-zinc-400 resize-none focus:outline-none text-sm"
              rows={1}
              style={{
                maxHeight: '120px',
                minHeight: '24px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={(!input.trim() && uploadedFiles.length === 0) || mcpLoading}
            className="flex-shrink-0 h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 px-2">
          <div className="flex gap-2 items-center">
            <button 
              onClick={triggerFilePicker}
              className={`text-xs transition-colors ${
                uploadedFiles.length > 0
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
              title="Attach files (click, drag & drop, or paste)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            {uploadedFiles.length > 0 && (
              <span className="text-xs text-blue-400">
                {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} attached
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500">
            Press Enter to send • Drag & drop or paste files
          </span>
        </div>
        </div>
        )}
      </div>

      {/* Right Side Panel */}
      {showFileTree && (
        <div className="w-80 flex-shrink-0 border-l border-zinc-700">
          <div className="h-full flex flex-col overflow-y-auto">
            {/* Servers Section */}
            <div className="flex-shrink-0">
              {selectedServer && isServerListCollapsed ? (
                // Collapsed Header - Show selected server with expand button
                <div 
                  className="p-3 border-b border-zinc-700 bg-zinc-900 cursor-pointer hover:bg-zinc-800 transition-colors"
                  onClick={() => setIsServerListCollapsed(false)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-500">Selected Server</div>
                      <div className="font-semibold text-sm text-zinc-200 truncate">{selectedServerName}</div>
                    </div>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ) : (
                // Expanded Server List
                <ServerList 
                  selectedServer={selectedServer || undefined}
                  onServerSelect={(serverKey) => {
                    console.log('Selected server:', serverKey);
                    setSelectedServer(serverKey);
                    setSelectedServerName(serverKey);
                    // Collapse the list when a server is selected and it has services
                    if (serverKey) {
                      setIsServerListCollapsed(true);
                    }
                  }}
                />
              )}
            </div>
              
            {/* MCP Services - Display All as Cards */}
            {selectedServer && services.length > 0 && (
              <div className="flex-1 border-t border-zinc-700 p-4">
                <h3 className="text-xs font-semibold text-zinc-300 mb-3">
                  Available MCP Services ({services.length})
                </h3>
                <div className="space-y-3">
                  {services.map((service) => (
                    <MCPServiceCard
                      key={service.name}
                      serverName={selectedServerName}
                      serviceName={service.name}
                      description={service.description}
                      serverKey={selectedServer}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

