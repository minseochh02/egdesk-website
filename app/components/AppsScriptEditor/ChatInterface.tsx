import React from 'react';
import { 
  Sparkles, 
  Cloud, 
  CloudOff, 
  Bot, 
  ChevronDown, 
  MessageSquare, 
  User, 
  Send, 
  Loader2,
  Settings,
  Play
} from 'lucide-react';
import { ChatMessage } from './types';

interface ChatInterfaceProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  isChatLoading: boolean;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  setChatInput: (input: string) => void;
  onSendMessage: () => void;
  onChatKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onClearContext: () => void;
  conversationHistoryLength: number;
  conversationsConnected: boolean;
  pendingCount: number;
  availableModels: Array<{ modelId: string; displayName: string }>;
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  defaultModel: string;
  isLoadingModels: boolean;
  showModelDropdown: boolean;
  setShowModelDropdown: (show: boolean) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  formatToolResult: (toolCall: any) => React.ReactNode;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatMessages,
  chatInput,
  isChatLoading,
  isChatOpen,
  setIsChatOpen,
  setChatInput,
  onSendMessage,
  onChatKeyDown,
  onClearContext,
  conversationHistoryLength,
  conversationsConnected,
  pendingCount,
  availableModels,
  selectedModel,
  onModelSelect,
  defaultModel,
  isLoadingModels,
  showModelDropdown,
  setShowModelDropdown,
  chatEndRef,
  formatToolResult
}) => {
  if (!isChatOpen) return null;

  return (
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
            {conversationHistoryLength > 0 && (
              <button
                onClick={onClearContext}
                className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
                title="Clear conversation context"
              >
                ({conversationHistoryLength} msgs) Clear
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
                      onModelSelect(model.modelId);
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
            onKeyDown={onChatKeyDown}
            placeholder="Create HTML, modify code, ask questions..."
            rows={1}
            className="flex-1 bg-zinc-800 text-zinc-200 text-sm px-3 py-2 rounded-lg border border-zinc-600 focus:border-violet-500 focus:outline-none resize-none placeholder:text-zinc-500"
          />
          <button
            onClick={onSendMessage}
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
  );
};

