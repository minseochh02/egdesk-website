'use client';

import { useState, useRef, useEffect } from 'react';
import { useMCPTools } from '@/hooks/useMCPTools';
import FileDownloader from './FileDownloader';
import { Send, Bot, User, Loader2, FileText, Folder, Search } from 'lucide-react';

interface Message {
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

interface AIChatProps {
  serverKey: string;
  serverName: string;
}

export default function AIChat({ serverKey, serverName }: AIChatProps) {
  const { callTool, listDirectory, readFile, getFileInfo, loading } = useMCPTools(serverKey);
  
  const searchFiles = async (path: string, pattern: string, searchContent: boolean = false, maxResults: number = 100) => {
    return await callTool('fs_search_files', { path, pattern, searchContent, maxResults });
  };
  
  const downloadFile = async (path: string) => {
    return await callTool('fs_download_file', { path });
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Simple AI logic - you can replace this with actual AI API
      const response = await processUserMessage(input.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        toolCalls: response.toolCalls,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const processUserMessage = async (message: string): Promise<{ content: string; toolCalls?: any[] }> => {
    const availableTools = [
      {
        name: 'fs_search_files',
        description: 'Search for files matching a pattern (supports regex). Use this to FIND files by name without listing all directories.',
        parameters: { 
          path: 'string (directory to search in, e.g., /Users/minseocha)',
          pattern: 'string (search pattern/regex, e.g., "*.png" or "transkeyServlet.*")',
          searchContent: 'boolean (optional, search inside file contents)',
          maxResults: 'number (optional, default 100)'
        }
      },
      {
        name: 'fs_list_directory',
        description: 'List contents of a directory',
        parameters: { path: 'string' }
      },
      {
        name: 'fs_read_file', 
        description: 'Read contents of a file',
        parameters: { path: 'string' }
      },
      {
        name: 'fs_get_file_info',
        description: 'Get metadata about a file or directory',
        parameters: { path: 'string' }
      },
      {
        name: 'fs_download_file',
        description: 'Download a file (read as binary/base64). Use this when user asks to "download" a file.',
        parameters: { path: 'string (full path to the file)' }
      }
    ];

    try {
      let conversationHistory = [{ role: 'user', content: message }];
      let allToolCalls: any[] = [];
      let maxIterations = 5; // Prevent infinite loops
      let finalContent = '';

      // Agentic loop: Keep calling AI until it's done or max iterations reached
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
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        finalContent = data.content;
        
        // If no tool calls, AI is done
        if (!data.toolCalls || data.toolCalls.length === 0) {
          break;
        }

        // Execute tool calls
        const executedTools = [];
        for (const toolCall of data.toolCalls) {
          try {
            let result;
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

        // Add tool results to conversation history
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


  const formatToolResult = (toolCall: any) => {
    if (toolCall.name === 'fs_download_file') {
      const result = toolCall.result;
      const filename = toolCall.args.path.split('/').pop() || 'download';
      
      // Handle different response structures
      let text = '';
      let data = '';
      
      if (result?.content?.[0]?.text) {
        text = result.content[0].text;
        data = result.content[0].data || '';
      } else if (result?.content) {
        // If content is a string (not array)
        text = result.content;
      }
      
      // Extract file size from the text if available
      const sizeMatch = text.match(/(\d+)\s*bytes?/i);
      const fileSize = sizeMatch ? parseInt(sizeMatch[1]) : undefined;
      
      // Determine MIME type from filename
      const getMimeType = (filename: string) => {
        const extension = filename.split('.').pop()?.toLowerCase();
        const mimeTypes: { [key: string]: string } = {
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml',
          'pdf': 'application/pdf',
          'txt': 'text/plain',
          'md': 'text/markdown',
          'json': 'application/json',
          'zip': 'application/zip',
        };
        return mimeTypes[extension || ''] || 'application/octet-stream';
      };
      
      return (
        <div className="mt-2">
          <p className="text-sm text-zinc-300 mb-3">{text}</p>
          {data && (
            <FileDownloader
              filename={filename}
              base64Data={data}
              fileSize={fileSize}
              mimeType={getMimeType(filename)}
              onDownload={() => console.log('File downloaded:', filename)}
            />
          )}
        </div>
      );
    }
    
    if (toolCall.name === 'fs_search_files') {
      const items = toolCall.result?.content || [];
      return (
        <div className="mt-2 p-3 bg-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Search Results</span>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-400">No files found matching the pattern.</p>
          ) : (
            <div className="space-y-1">
              {items.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {item.type === 'directory' ? (
                    <Folder className="w-4 h-4 text-blue-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-zinc-400" />
                  )}
                  <span className="text-zinc-300 font-mono text-xs">{item.path}</span>
                  {item.size && (
                    <span className="text-zinc-500 text-xs ml-auto">
                      {item.size} bytes
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    if (toolCall.name === 'fs_list_directory') {
      const items = toolCall.result?.content || [];
      return (
        <div className="mt-2 p-3 bg-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Directory Contents</span>
          </div>
          <div className="space-y-1">
            {items.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {item.type === 'directory' ? (
                  <Folder className="w-4 h-4 text-blue-400" />
                ) : (
                  <FileText className="w-4 h-4 text-zinc-400" />
                )}
                <span className="text-zinc-300">{item.name}</span>
                {item.size && (
                  <span className="text-zinc-500 text-xs ml-auto">
                    {item.size} bytes
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (toolCall.name === 'fs_read_file') {
      return (
        <div className="mt-2 p-3 bg-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">File Content</span>
          </div>
          <pre className="text-sm text-zinc-300 whitespace-pre-wrap overflow-x-auto">
            {toolCall.result?.content || toolCall.result}
          </pre>
        </div>
      );
    }

    if (toolCall.name === 'fs_get_file_info') {
      const info = toolCall.result?.content || toolCall.result;
      return (
        <div className="mt-2 p-3 bg-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">File Information</span>
          </div>
          <pre className="text-sm text-zinc-300 whitespace-pre-wrap">
            {JSON.stringify(info, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="mt-2 p-3 bg-zinc-800 rounded-lg">
        <pre className="text-sm text-zinc-300">
          {JSON.stringify(toolCall.result, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          AI Assistant - {serverName}
        </h3>
        <p className="text-sm text-zinc-400">Ask me to help with file operations</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
            <p className="text-lg font-medium mb-2">Welcome to AI Assistant!</p>
            <p className="text-sm">I can help you with file operations using MCP tools.</p>
            <div className="mt-4 text-left max-w-md mx-auto">
              <p className="text-sm font-medium mb-2">Try these commands:</p>
              <ul className="text-xs space-y-1 text-zinc-400">
                <li>• "List directory" - Show files and folders</li>
                <li>• "Read filename.txt" - Read a file</li>
                <li>• "Info filename" - Get file information</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-600' 
                  : 'bg-zinc-700'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-zinc-300" />
                )}
              </div>
              
              <div className={`rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-200'
              }`}>
                <p className="text-sm">{message.content}</p>
                
                {message.toolCalls && message.toolCalls.map((toolCall, index) => (
                  <div key={index}>
                    {formatToolResult(toolCall)}
                  </div>
                ))}
                
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-zinc-300" />
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                <span className="text-sm text-zinc-400">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me to help with files..."
            className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
