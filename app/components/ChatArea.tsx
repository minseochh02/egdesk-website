'use client';

import { useState, useRef, useEffect } from 'react';
import FileTree from './FileTree';
import ServerList from './ServerList';
import DirectoryTree from './DirectoryTree';
import { useAuth } from '@/contexts/AuthContext';
import AuthButton from './AuthButton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
}

interface ChatAreaProps {
  tabId: string;
}

const TUNNEL_SERVICE_URL = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';
const MCP_SERVER_KEY = process.env.NEXT_PUBLIC_MCP_SERVER_KEY || 'test';

export default function ChatArea({ tabId }: ChatAreaProps) {
  const { session, user } = useAuth();
  const [showFileTree, setShowFileTree] = useState(true);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedServerName, setSelectedServerName] = useState<string>('');
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, [user, selectedServer, selectedServerName]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check if user is authenticated
    if (!session?.access_token) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Please sign in to send messages to the MCP server.',
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    // Use selected server or fall back to env variable
    const serverKey = selectedServer || MCP_SERVER_KEY;

    try {
      // Make authenticated request to MCP server through tunnel
      const response = await fetch(`${TUNNEL_SERVICE_URL}/t/${serverKey}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: input,
          method: 'chat',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.content || JSON.stringify(data),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setConnectionStatus('connected');
      
    } catch (error) {
      console.error('Error sending message to MCP server:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error connecting to MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      setConnectionStatus('error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full">
      {/* Chat Section */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-zinc-300">Chat</h2>
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
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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

        {/* Input Area */}
        <div className="border-t border-zinc-700 bg-zinc-800 p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-zinc-700 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
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
            disabled={!input.trim()}
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
          <div className="flex gap-2">
            <button className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <span className="text-xs text-zinc-500">
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>
        </div>
      </div>

      {/* Right Side Panel */}
      {showFileTree && (
        <div className="w-80 flex-shrink-0 border-l border-zinc-700">
          <div className="h-full flex flex-col">
            {/* Servers Section */}
            <div className={selectedServer ? 'h-1/3 border-b border-zinc-700' : 'flex-1'}>
              <ServerList 
                selectedServer={selectedServer || undefined}
                onServerSelect={(serverKey) => {
                  console.log('Selected server:', serverKey);
                  // Find the server to get its name
                  setSelectedServer(serverKey);
                  setSelectedServerName(serverKey);
                }}
              />
            </div>
            
            {/* Directory Tree Section */}
            {selectedServer && (
              <div className="flex-1 overflow-hidden">
                <DirectoryTree 
                  serverKey={selectedServer}
                  serverName={selectedServerName}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

