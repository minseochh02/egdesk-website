'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UploadedFile } from './FileUpload';
import FileSystemBrowser from './FileSystemBrowser';
import { useMCPTools } from '@/hooks/useMCPTools';
import { useMCPServices } from '@/hooks/useMCPServices';
import { useMCPServiceTools } from '@/hooks/useMCPServiceTools';
import { useUserServers } from '@/hooks/useUserServers';
import { useServerHealth } from '@/hooks/useServerHealth';
import { Server, RefreshCw, CheckCircle, Clock, Ban } from 'lucide-react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
  files?: UploadedFile[];
  projects?: any[];
  toolCalls?: Array<{
    name: string;
    args: any;
    result?: any;
  }>;
}

interface ChatAreaProps {
  tabId: string;
  onOpenProject?: (projectId: string, projectName: string, serverKey: string, serviceName: string) => void;
}

interface MCPServiceCardProps {
  serverName: string;
  serviceName: string;
  description: string;
  serverKey: string;
}

function MCPServiceCard({ serverName, serviceName, description, serverKey }: MCPServiceCardProps) {
  const { tools, loading } = useMCPServiceTools(serverKey, serviceName);

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <Server className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        <div className="flex items-center justify-between flex-1 min-w-0 gap-2">
          <span className="font-mono text-sm text-blue-400 font-semibold truncate">{serviceName}</span>
          {loading ? (
            <span className="text-xs text-zinc-500">...</span>
          ) : (
            <span className="text-xs text-zinc-400 whitespace-nowrap">{tools.length} tools</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatArea({ tabId, onOpenProject }: ChatAreaProps) {
  const { user, session } = useAuth();
  const [showFileTree, setShowFileTree] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedServerName, setSelectedServerName] = useState<string>('');
  const [filesystemServiceName, setFilesystemServiceName] = useState('filesystem');
  
  // Apps Script Projects State
  const [appsScriptProjects, setAppsScriptProjects] = useState<any[]>([]);
  const [appsScriptServiceName, setAppsScriptServiceName] = useState<string | null>(null);

  // Fetch user's servers
  const { servers, loading: serversLoading, error: serversError, refresh: refreshServers } = useUserServers();
  const { healthStatus, checking: checkingHealth, refresh: refreshHealth } = useServerHealth(
    servers.map(s => s.server_key)
  );
  
  // MCP Service Discovery
  const { services } = useMCPServices(selectedServer || '');
  
  // Detect filesystem service
  useEffect(() => {
    console.log('🕵️‍♀️ Detecting services...', { 
      selectedServer, 
      servicesCount: services?.length, 
      services: services?.map(s => s.name) 
    });

    const detectFsService = async () => {
      if (!selectedServer || !services || services.length === 0) {
        console.log('⚠️ No server or services available for FS detection');
        return;
      }

      // Fast path: if 'filesystem' exists, use it
      if (services.some(s => s.name === 'filesystem')) {
        console.log('✅ Found standard "filesystem" service');
        setFilesystemServiceName('filesystem');
        return;
      }

      console.log('🔍 "filesystem" not found, checking tools of other services...');
      // Slow path: check tools of each service to find fs_list_directory
      const tunnelUrl = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';
      
      for (const service of services) {
        try {
            console.log(`🔎 Checking tools for service: ${service.name}`);
            const response = await fetch(`${tunnelUrl}/t/${selectedServer}/${service.name}/tools`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                }
            });
            if (response.ok) {
                const tools = await response.json();
                console.log(`🛠️ Tools for ${service.name}:`, tools.map((t: any) => t.name));
                if (Array.isArray(tools) && tools.some((t: any) => t.name === 'fs_list_directory')) {
                    console.log(`✅ Found filesystem tools in service: ${service.name}`);
                    setFilesystemServiceName(service.name);
                    break;
                }
            } else {
                console.warn(`⚠️ Failed to fetch tools for ${service.name}: ${response.status}`);
            }
        } catch (err) {
            console.error(`❌ Error checking tools for ${service.name}:`, err);
        }
      }
    };
    
    const detectAppsScriptService = async () => {
       if (!selectedServer) {
         return;
       }
       
       // Default to 'apps-script' if services list is empty or not found
       let scriptServiceName = 'apps-script';
       
       if (services && services.length > 0) {
         const found = services.find(s => s.name.includes('apps-script') || s.name.includes('appsscript'));
         if (found) {
            scriptServiceName = found.name;
            console.log('✅ Found Apps Script service in discovery:', scriptServiceName);
         } else {
            console.log('⚠️ Apps Script service not found in discovery list, trying default "apps-script"');
         }
       } else {
          console.log('⚠️ Services list empty or not loaded, assuming default "apps-script" service');
       }
       
       setAppsScriptServiceName(scriptServiceName);
         
       try {
          const tunnelUrl = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';
          console.log(`🚀 Fetching projects from ${scriptServiceName} via ${tunnelUrl}...`);
          
          const response = await fetch(`${tunnelUrl}/t/${selectedServer}/${scriptServiceName}/tools/call`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              tool: 'apps_script_list_projects',
              arguments: {}
            })
          });
          
          console.log(`📨 Apps Script list response status: ${response.status}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📦 Raw Apps Script response:', data);
            
            // Parse result
            let content = data.result?.content?.[0]?.text || data.content?.[0]?.text;
            let projects = [];
            
            if (content) {
               try {
                 const parsed = JSON.parse(content);
                 if (Array.isArray(parsed)) projects = parsed;
                 else if (parsed.entries) projects = parsed.entries;
                 else if (parsed.projects) projects = parsed.projects;
               } catch (e) { console.error('❌ Failed to parse projects list JSON:', e); }
            } else if (Array.isArray(data.result)) {
               projects = data.result;
            } else if (data.result && Array.isArray(data.result.projects)) {
               projects = data.result.projects;
            }
            
            console.log('📜 Parsed Apps Script Projects:', projects);
            setAppsScriptProjects(projects);
            
            // Add a message to chat with the projects
            if (projects.length > 0) {
              setMessages(prev => {
                // Check if we already have a project message to avoid duplicates
                if (prev.some(m => m.projects && m.projects.length > 0)) return prev;
                
                return [...prev, {
                  id: 'projects-' + Date.now(),
                  role: 'assistant',
                  content: `I found ${projects.length} Apps Script projects in your workspace.`,
                  timestamp: new Date(),
                  projects: projects
                }];
              });
            }
          } else {
              const errorText = await response.text();
              console.error(`❌ Failed to fetch apps script projects: ${response.status} ${errorText}`);
          }
       } catch (err) {
         console.error('❌ Error fetching apps script projects:', err);
       }
    };

    detectFsService();
    detectAppsScriptService();
  }, [selectedServer, services, session]);
  
  // MCP Tools (dynamically use the detected filesystem service)
  const { callTool, listDirectory, readFile, getFileInfo, loading: mcpLoading } = useMCPTools(selectedServer || '', filesystemServiceName);
  
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
  const [contextMessageCount, setContextMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const attachedFilesRef = useRef<UploadedFile[]>([]);
  // Maintain conversation history for context across messages
  const conversationHistoryRef = useRef<Array<{ role: string; content: string; }>>([]);

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
    
    // Reset conversation history when server changes
    conversationHistoryRef.current = [];
    setContextMessageCount(0);
    setFilesystemServiceName('filesystem');
    setAppsScriptProjects([]);
    setAppsScriptServiceName(null);
    
    // Hide file tree when no server is selected
    if (!selectedServer) {
      setShowFileTree(false);
    } else {
      setShowFileTree(true);
    }
  }, [user, selectedServer, selectedServerName]);

  const handleProjectClick = (project: any) => {
    if (onOpenProject && selectedServer && appsScriptServiceName) {
      let projectId = '';
      let projectName = '';
      
      if (typeof project === 'string') {
        // Try to extract ID from format "Name [ID]"
        const match = project.match(/^(.*?) \[([a-zA-Z0-9_-]+)\]$/);
        if (match) {
          projectName = match[1];
          projectId = match[2];
        } else {
          projectName = project;
          projectId = project; // Fallback
        }
      } else {
        projectId = project.id || project.scriptId;
        projectName = project.name || project.title;
      }
      
      if (projectId) {
        onOpenProject(projectId, projectName, selectedServer, appsScriptServiceName);
        return;
      }
    }
    
    // Fallback to chat input if not connected or no handler
    setInput(`I want to work on project: ${project.name || project}`);
  };

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
        const fileDescriptions = currentFiles.map((file, idx) => {
          const fileType = file.file.type.startsWith('image/') ? 'Image' : 'File';
          const fileSize = (file.file.size / 1024).toFixed(2);
          return `  ${idx + 1}. "${file.file.name}" - ${fileType}, ${fileSize} KB (${file.file.type})`;
        });
        fileInfo = `\n\n[ATTACHED FILES - ${currentFiles.length} file(s) ready for processing:]\n${fileDescriptions.join('\n')}\n\n[CONTEXT: When user says "this file", "the file", "upload it", "save it", they are referring to the attached file(s) above. Use fs_upload_file to save them to the server, or use conversion tools if they ask to convert them.]`;
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
          description: '🔍 PRIMARY TOOL for finding files! When user says "download X" or "read Y", use this FIRST (don\'t ask for path!). Searches the entire filesystem for files matching a pattern. Returns full paths needed for download/read operations. Use path="/" to search everywhere. Example: User says "download report.xlsx" → immediately call fs_search_files(pattern="report.xlsx", path="/") → get full path → then download.',
          parameters: { 
            path: 'string (root directory to search from, use "/" for system-wide)',
            pattern: 'string (filename or pattern to match)',
            searchContent: 'boolean (optional, search inside file contents)',
            maxResults: 'number (optional, default 100)'
          },
          service: 'filesystem'
        },
        {
          name: 'fs_list_directory',
          description: 'List all files and folders in a directory. Use when user wants to see what files are available or browse directories.',
          parameters: { path: 'string' },
          service: 'filesystem'
        },
        {
          name: 'fs_read_file', 
          description: 'Read and display the contents of a file from the server. Use when user wants to view or examine a file.',
          parameters: { path: 'string' },
          service: 'filesystem'
        },
        {
          name: 'fs_get_file_info',
          description: 'Get detailed metadata about a file or directory (size, type, permissions, etc.). Use when user asks about file properties.',
          parameters: { path: 'string' },
          service: 'filesystem'
        },
        {
          name: 'fs_download_file',
          description: 'Download a file from the server to user\'s local device. Use when user says "download", "get", or "save to my computer". Returns file in base64 format.',
          parameters: { path: 'string' },
          service: 'filesystem'
        },
        {
          name: 'fs_upload_file',
          description: 'Upload and save a file to the server\'s Downloads folder. Use when user says "upload", "save", "send this file", or attaches a file asking to save it.',
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
      // Create a comprehensive system instruction for the AI (only add once if history is empty)
      const systemInstruction = `ACTION FIRST, TALK SECOND:
If user message contains "download [filename]" - your response MUST start with a tool call, NOT text.

🚨 MANDATORY PATTERN:
User: "download image.png"
Your response: [fs_search_files tool call] (no text before this)
Then after tool results: "I found X files..." (explanation comes after action)

FORBIDDEN: Starting response with "I can help", "Let me locate", "I need to" etc.

You are an AI assistant that helps users interact with their MCP (Model Context Protocol) server and its services.

AVAILABLE CAPABILITIES:
${availableTools.map(tool => `- ${tool.name} (${tool.service}): ${tool.description}`).join('\n')}

BEHAVIOR OVERRIDE - CRITICAL:
If user asks to download/read a file with just a filename:
1. NEVER ask "where is it?" or "specify directory"  
2. ALWAYS start with fs_search_files tool call
3. This overrides all other conversation patterns

IMPORTANT INSTRUCTIONS:
1. Understand natural language commands and map them to appropriate tool calls
2. Common user commands and their tool mappings:
   - "upload this file" / "save this file" → use fs_upload_file
   - "download [filename]" → FIRST fs_search_files to find it, THEN fs_download_file with full path
   - "read [filename]" → FIRST fs_search_files to find it, THEN fs_read_file with full path
   - "convert this file to X" → use file-conversion service tools (if available)
   - "list files" / "show directory" → use fs_list_directory
   - "search for X" → use fs_search_files

3. When user says "this file" or "the file", refer to files they have attached to their message
4. When converting files, use the appropriate conversion tool based on source and target formats
5. Always provide clear feedback about what actions you're taking
6. If a file is attached and user asks to upload/save it, use fs_upload_file with the attached file's data
7. **CRITICAL FOR DOWNLOADS - AUTOMATIC SEARCH REQUIRED**: 
   - Users will provide INCOMPLETE file names like "download report.xlsx" or "download image.png"
   - DO NOT ask user for the full path - AUTOMATICALLY search for it!
   - When user says "download [filename]" or "read [filename]":
     * IMMEDIATELY use fs_search_files with the filename as pattern
     * Search in "/" or "~" (user's home directory) to cover all locations
     * DO NOT ask "where is the file?" - JUST SEARCH!
   - Only use fs_download_file or fs_read_file AFTER getting the full path from search results
   - If multiple matches found, list them and ask user which one
   - If NO matches found, THEN tell user you couldn't find it
   - Example flow: User says "download report.xlsx" → You immediately call fs_search_files → Then download
8. Be proactive in chaining operations: ALWAYS search first, then download/read/convert
9. **CONTEXT AWARENESS**: Maintain context across the conversation
   - If you asked the user a question (e.g., "which file?"), remember it for their next response
   - When user says "the 3rd one" or "number 2", refer back to the list you just provided
   - If user gives a short answer like "yes", "no", "3rd one", interpret it in context of your previous message

Be proactive and helpful in interpreting user intent. If a command is ambiguous, ask for clarification.`;

      // Initialize conversation history with system instruction if empty
      if (conversationHistoryRef.current.length === 0) {
        conversationHistoryRef.current.push({ role: 'system', content: systemInstruction });
        console.log('🆕 Starting new conversation with system instruction');
        console.log('📋 System instruction preview:', systemInstruction.substring(0, 200) + '...');
      } else {
        console.log(`💬 Continuing conversation (${conversationHistoryRef.current.length} messages in history)`);
      }
      
      // Add current user message to conversation history
      conversationHistoryRef.current.push({ role: 'user', content: message });
      
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
            message: conversationHistoryRef.current,
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
            if (serviceName === 'filesystem' || serviceName === filesystemServiceName) {
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
                  // Handle file upload with renaming support
                  if (toolCall.args.content) {
                    // Use provided content (for other scenarios)
                    result = await uploadFile(
                      toolCall.args.filename,
                      toolCall.args.content,
                      toolCall.args.encoding || 'base64'
                    );
                  } else if (attachedFilesRef.current.length > 0) {
                    // Use the first attached file (support renaming)
                    const attachedFile = attachedFilesRef.current[0];
                    if (attachedFile && attachedFile.base64) {
                      result = await uploadFile(
                        toolCall.args.filename, // Use the AI's specified filename (allows renaming)
                        attachedFile.base64,
                        'base64'
                      );
                    } else {
                      result = { error: `Attached file has no content data` };
                    }
                  } else {
                    result = { error: `No attached files found and no content provided` };
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
      }

      console.log('🎬 Final response - allToolCalls:', allToolCalls);
      
      // Add final assistant response to conversation history for context continuity
      // (Only add if not already added in the last iteration)
      const lastMessage = conversationHistoryRef.current[conversationHistoryRef.current.length - 1];
      if (lastMessage.role !== 'assistant' || lastMessage.content !== finalContent) {
        conversationHistoryRef.current.push({
          role: 'assistant',
          content: finalContent
        });
      }
      
      // Update context message count for UI
      setContextMessageCount(conversationHistoryRef.current.length);
      
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
        {/* Messages Area */}
        {!selectedServer ? (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl flex items-center justify-center border border-zinc-700">
                  <Server className="w-10 h-10 text-zinc-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Welcome to EGDesk</h3>
                <p className="text-sm text-zinc-400">
                  Select an MCP server to start chatting with your AI assistant
                </p>
              </div>

              {/* Server Cards */}
              {serversLoading ? (
                <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm py-12">
                  <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading servers...</span>
                </div>
              ) : serversError ? (
                <div className="max-w-md mx-auto">
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <p className="text-red-400 text-sm font-medium">Failed to load servers</p>
                    <p className="text-red-300 text-xs mt-1">{serversError}</p>
                    <button
                      onClick={() => {
                        refreshServers();
                        refreshHealth();
                      }}
                      className="mt-3 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                  </div>
                </div>
              ) : servers.length === 0 ? (
                <div className="max-w-md mx-auto">
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 text-center">
                    <Server className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-300 text-sm font-medium mb-2">No servers available</p>
                    <p className="text-zinc-500 text-xs">
                      Ask a server owner to grant you access to their MCP server
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-zinc-300">
                      Available Servers ({servers.length})
                    </h4>
                    <button
                      onClick={() => {
                        refreshServers();
                        refreshHealth();
                      }}
                      disabled={serversLoading || checkingHealth}
                      className="p-1.5 rounded hover:bg-zinc-700 transition-colors disabled:opacity-50"
                      title="Refresh servers"
                    >
                      <RefreshCw className={`w-4 h-4 text-zinc-400 hover:text-white ${(serversLoading || checkingHealth) ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {servers.map((server) => {
                      const getStatusIcon = (status: string) => {
                        switch (status) {
                          case 'active':
                            return <CheckCircle className="w-5 h-5 text-green-500" />;
                          case 'pending':
                            return <Clock className="w-5 h-5 text-yellow-500" />;
                          case 'revoked':
                          case 'expired':
                            return <Ban className="w-5 h-5 text-red-500" />;
                          default:
                            return <Server className="w-5 h-5 text-zinc-500" />;
                        }
                      };

                      const getAccessLevelColor = (level: string) => {
                        switch (level) {
                          case 'admin':
                            return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
                          case 'read_write':
                            return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
                          case 'read_only':
                            return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
                          default:
                            return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
                        }
                      };

                      return (
                        <button
                          key={server.id}
                          onClick={() => {
                            setSelectedServer(server.server_key);
                            setSelectedServerName(server.name);
                          }}
                          className="text-left p-4 rounded-lg border bg-zinc-800 border-zinc-700 hover:bg-zinc-750 hover:border-zinc-600 hover:shadow-lg transition-all group"
                        >
                          {/* Server Header */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                                {server.name}
                              </h4>
                              <p className="text-xs text-zinc-500 truncate mt-0.5 font-mono">
                                {server.server_key}
                              </p>
                            </div>
                            {getStatusIcon(server.permission_status)}
                          </div>

                          {/* Description */}
                          {server.description && (
                            <p className="text-xs text-zinc-400 mb-3 line-clamp-2">
                              {server.description}
                            </p>
                          )}

                          {/* Status Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded-full border ${getAccessLevelColor(server.access_level)}`}>
                              {server.access_level.replace('_', ' ')}
                            </span>
                            {healthStatus[server.server_key] && (
                              <div className="flex items-center gap-1.5 text-xs">
                                {healthStatus[server.server_key].online ? (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-green-400">online</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                    <span className="text-gray-500" title={healthStatus[server.server_key].error}>
                                      offline
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">
                  {selectedServerName}
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
                {contextMessageCount > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {contextMessageCount - 1} messages in context
                    </span>
                    <button
                      onClick={() => {
                        conversationHistoryRef.current = [];
                        setContextMessageCount(0);
                        console.log('🗑️ Conversation context cleared');
                      }}
                      className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                      title="Clear conversation context"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFileTree(!showFileTree)}
                  className={`p-1.5 rounded transition-colors ${
                    showFileTree ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                  title={showFileTree ? 'Hide Panel' : 'Show Panel'}
                >
                  <svg 
                    className={`w-4 h-4 transition-transform ${showFileTree ? '' : 'rotate-180'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <MessageList 
              messages={messages} 
              isTyping={isTyping} 
              messagesEndRef={messagesEndRef}
              onOpenProject={onOpenProject ? (id, name) => handleProjectClick({ id, name }) : undefined}
            />

            {/* Input Area */}
            <ChatInput
              input={input}
              setInput={setInput}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
              handleSend={handleSend}
              mcpLoading={mcpLoading}
              triggerFilePicker={triggerFilePicker}
              fileInputRef={fileInputRef}
              handleFilePickerChange={handleFilePickerChange}
              handleKeyPress={handleKeyPress}
              handlePaste={handlePaste}
            />
          </>
        )}
      </div>

      {/* Right Side Panel - Only show when server is selected */}
      {selectedServer && showFileTree && (
        <div className="w-80 flex-shrink-0 border-l border-zinc-700">
          <div className="h-full flex flex-col">
            {/* File System Tree */}
            <div className="flex-shrink-0 border-b border-zinc-700" style={{ height: '400px' }}>
              <FileSystemBrowser 
                key={`${selectedServer}-${filesystemServiceName}`}
                serverKey={selectedServer}
                onLoadDirectory={async (path: string) => {
                  return await listDirectory(path);
                }}
                onFileSelect={(path, type) => {
                  console.log('File selected:', path, type);
                  // You can add file preview or download logic here
                }}
              />
            </div>
              
            {/* MCP Services - Display All as Cards */}
            {services.length > 0 && (
              <div className="flex-1 overflow-y-auto p-4">
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
