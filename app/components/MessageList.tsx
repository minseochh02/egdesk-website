'use client';

import { Message } from './ChatArea';
import { UploadedFile } from './FileUpload';
import { Code, ExternalLink } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onOpenProject?: (projectId: string, projectName: string) => void;
}

export default function MessageList({ messages, isTyping, messagesEndRef, onOpenProject }: MessageListProps) {
  const handleProjectClick = (project: any) => {
    if (onOpenProject) {
      let projectId = '';
      let projectName = '';
      
      if (typeof project === 'string') {
        const match = project.match(/^(.*?) \[([a-zA-Z0-9_-]+)\]$/);
        if (match) {
          projectName = match[1];
          projectId = match[2];
        } else {
          projectName = project;
          projectId = project;
        }
      } else {
        projectId = project.id || project.scriptId;
        projectName = project.name || project.title;
      }
      
      if (projectId) {
        onOpenProject(projectId, projectName);
      }
    }
  };

  return (
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
              
              {/* Display Apps Script Projects (in messages) */}
              {message.projects && message.projects.length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {message.projects.map((project: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-lg hover:bg-black/30 transition-colors cursor-pointer group"
                      onClick={() => handleProjectClick(project)}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                        <Code className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-zinc-200 truncate">
                          {project.name || project}
                        </h4>
                        <p className="text-[10px] text-zinc-500 truncate">
                          Click to open editor
                        </p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}

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
                                    const byteCharacters = atob(fileData!);
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
  );
}
