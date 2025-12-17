'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { useUserServers } from '@/hooks/useUserServers';
import { MessageSquare, FileCode, Search, Plus, Cloud, CloudOff, Loader2, RefreshCw, PanelLeftClose, PanelLeft } from 'lucide-react';

interface SidebarProps {
  onNewChat: () => void;
  onSelectConversation?: (conversation: Conversation) => void;
  activeConversationId?: string;
  onSignOut?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Helper to format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

export default function Sidebar({ onNewChat, onSelectConversation, activeConversationId, onSignOut, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { user, signOut: authSignOut } = useAuth();
  const { servers } = useUserServers();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use the first available server for conversations
  const primaryServerKey = servers[0]?.server_key || '';
  
  const {
    conversations,
    isConnected,
    isLoading,
    listConversations,
  } = useConversations(primaryServerKey);

  // Load conversations on mount
  useEffect(() => {
    if (primaryServerKey) {
      listConversations().catch(err => {
        console.warn('Failed to load conversations:', err.message);
        // Silently fail - conversations service might not be enabled
      });
    }
  }, [primaryServerKey]);

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(c => 
      c.title.toLowerCase().includes(query) ||
      c.summary?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const groups: { [key: string]: Conversation[] } = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    for (const conv of filteredConversations) {
      const date = new Date(conv.updated_at);
      if (date >= today) {
        groups['Today'].push(conv);
      } else if (date >= yesterday) {
        groups['Yesterday'].push(conv);
      } else if (date >= weekAgo) {
        groups['This Week'].push(conv);
      } else {
        groups['Older'].push(conv);
      }
    }

    return groups;
  }, [filteredConversations]);

  const handleConversationClick = (conversation: Conversation) => {
    if (onSelectConversation) {
      onSelectConversation(conversation);
    }
  };

  const handleSignOutClick = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      authSignOut();
    }
  };

  return (
    <div className={`flex h-full flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-zinc-800`}>
        {!isCollapsed && <h1 className="text-xl font-semibold text-white">EGDesk</h1>}
        <div className="flex items-center gap-2">
          {/* Connection status - only show when expanded */}
          {!isCollapsed && (
            isConnected ? (
              <span title="Connected">
                <Cloud className="w-4 h-4 text-green-400" />
              </span>
            ) : (
              <span title="Offline">
                <CloudOff className="w-4 h-4 text-yellow-400" />
              </span>
            )
          )}
          {!isCollapsed && (
            <button
              onClick={onNewChat}
              className="rounded-lg p-2 hover:bg-zinc-800 transition-colors"
              title="New Chat"
            >
              <Plus className="w-5 h-5 text-zinc-400" />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="rounded-lg p-2 hover:bg-zinc-800 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeft className="w-5 h-5 text-zinc-400" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      {isCollapsed ? (
        <div className="p-3 flex justify-center">
          <button
            onClick={onNewChat}
            className="rounded-lg p-2 hover:bg-zinc-800 transition-colors"
            title="New Chat"
          >
            <Plus className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full rounded-lg bg-zinc-900 px-4 py-2 pl-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          </div>
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          !isCollapsed && (
            <div className="text-center py-8 px-4">
              <div className="text-zinc-500 text-sm">
                {searchQuery ? 'No matching chats' : (
                  !isConnected ? (
                    <div className="space-y-2">
                      <p>Connect to see chats</p>
                      <p className="text-xs text-zinc-600">Enable "conversations" in your desktop app's MCP settings</p>
                    </div>
                  ) : 'No chats yet'
                )}
              </div>
            </div>
          )
        ) : isCollapsed ? (
          /* Collapsed view - just icons */
          <div className="space-y-1 py-2">
            {filteredConversations.slice(0, 10).map((conversation) => {
              // Check by project_id presence (more reliable than source for legacy conversations)
              const meta = conversation.metadata as { source?: string; project_id?: string } | undefined;
              const isAppsScript = meta?.source === 'appsscript-editor' || !!meta?.project_id;
              const isActive = activeConversationId === conversation.id;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation)}
                  className={`flex w-full items-center justify-center rounded-lg p-2 transition-colors ${
                    isActive 
                      ? 'bg-zinc-800 text-white' 
                      : 'hover:bg-zinc-800/50 text-zinc-300'
                  }`}
                  title={conversation.title}
                >
                  {isAppsScript ? (
                    <FileCode className="w-4 h-4 text-blue-400" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-zinc-400" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Expanded view - full list */
          <div className="space-y-4">
            {Object.entries(groupedConversations).map(([group, convs]) => 
              convs.length > 0 && (
                <div key={group}>
                  <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {group}
                  </div>
                  <div className="space-y-1">
                    {convs.map((conversation) => {
                      // Check by project_id presence (more reliable than source for legacy conversations)
                      const meta = conversation.metadata as { source?: string; project_id?: string } | undefined;
                      const isAppsScript = meta?.source === 'appsscript-editor' || !!meta?.project_id;
                      const isActive = activeConversationId === conversation.id;
                      
                      return (
                        <button
                          key={conversation.id}
                          onClick={() => handleConversationClick(conversation)}
                          className={`group flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                            isActive 
                              ? 'bg-zinc-800 text-white' 
                              : 'hover:bg-zinc-800/50 text-zinc-300'
                          }`}
                        >
                          {isAppsScript ? (
                            <FileCode className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {conversation.title}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {formatRelativeTime(conversation.updated_at)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}
        
        {/* Refresh button */}
        {primaryServerKey && !isCollapsed && (
          <div className="py-4 flex justify-center">
            <button
              onClick={() => listConversations()}
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
              disabled={isLoading}
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className={`border-t border-zinc-800 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div 
            className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
            title={isCollapsed ? (user?.email || 'Not signed in') : undefined}
          >
            {user?.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              user?.email?.[0].toUpperCase() || 'U'
            )}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-zinc-500 truncate">{user?.email || 'Not signed in'}</p>
              </div>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSignOutClick();
                }}
                className="relative z-10 cursor-pointer rounded-lg p-1 hover:bg-zinc-800 transition-colors"
                title="Sign out"
              >
                <svg
                  className="w-4 h-4 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
