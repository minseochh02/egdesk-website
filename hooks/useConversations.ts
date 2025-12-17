'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TUNNEL_SERVICE_URL = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';
const PENDING_MESSAGES_KEY = 'egdesk_pending_messages';
const CONVERSATION_MAPPING_KEY = 'egdesk_tab_conversations';

// ========================================
// Types
// ========================================

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  result?: any;
}

export interface MessageMetadata {
  source: 'website' | 'desktop' | 'appsscript-editor';
  tab_id?: string;
  user_email?: string;
  toolCalls?: ToolCall[];
  files?: Array<{ name: string; type: string; size: number }>;
  projects?: any[];
  error?: boolean;
  // AppsScript-specific fields
  project_id?: string;
  project_name?: string;
  current_file?: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export interface Conversation {
  id: string;
  title: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    source: 'website' | 'desktop' | 'appsscript-editor';
    user_email: string;
    tab_id?: string;
    // AppsScript-specific fields
    project_id?: string;
    project_name?: string;
  };
}

interface PendingMessage {
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: MessageMetadata;
  timestamp: string;
  retry_count: number;
}

// ========================================
// Hook
// ========================================

export function useConversations(serverKey: string) {
  const { session, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Track if we're currently syncing to avoid duplicate syncs
  const isSyncingRef = useRef(false);

  // Get user email from session
  const userEmail = user?.email || session?.user?.email;

  // ========================================
  // Helper: Call MCP Tool
  // ========================================

  const callConversationTool = useCallback(async (
    toolName: string, 
    args: Record<string, any>
  ): Promise<any> => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    if (!userEmail) {
      throw new Error('User email not available');
    }

    // Always include user_email in args
    const enrichedArgs = {
      ...args,
      user_email: userEmail
    };

    try {
      const response = await fetch(
        `${TUNNEL_SERVICE_URL}/t/${serverKey}/conversations/tools/call`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tool: toolName,
            arguments: enrichedArgs,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      // Parse MCP response
      const mcpResponse = data.result || data;
      if (mcpResponse.content?.[0]?.text) {
        try {
          return JSON.parse(mcpResponse.content[0].text);
        } catch {
          return mcpResponse;
        }
      }

      return data;
    } catch (err) {
      // Mark as disconnected if network error
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setIsConnected(false);
      }
      throw err;
    }
  }, [session, serverKey, userEmail]);

  // ========================================
  // Pending Messages Queue (localStorage)
  // ========================================

  const getPendingMessages = useCallback((): PendingMessage[] => {
    try {
      const stored = localStorage.getItem(PENDING_MESSAGES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const savePendingMessages = useCallback((messages: PendingMessage[]) => {
    try {
      localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(messages));
      setPendingCount(messages.length);
    } catch (err) {
      console.error('Failed to save pending messages:', err);
    }
  }, []);

  const addToPendingQueue = useCallback((message: Omit<PendingMessage, 'timestamp' | 'retry_count'>) => {
    const pending = getPendingMessages();
    pending.push({
      ...message,
      timestamp: new Date().toISOString(),
      retry_count: 0
    });
    savePendingMessages(pending);
    console.log('📤 Message queued for later sync:', message.role);
  }, [getPendingMessages, savePendingMessages]);

  const removeFromPendingQueue = useCallback((index: number) => {
    const pending = getPendingMessages();
    pending.splice(index, 1);
    savePendingMessages(pending);
  }, [getPendingMessages, savePendingMessages]);

  // ========================================
  // Tab-Conversation Mapping (localStorage)
  // ========================================

  const getTabConversationId = useCallback((tabId: string): string | null => {
    try {
      const mapping = localStorage.getItem(CONVERSATION_MAPPING_KEY);
      const parsed = mapping ? JSON.parse(mapping) : {};
      return parsed[tabId] || null;
    } catch {
      return null;
    }
  }, []);

  const setTabConversationId = useCallback((tabId: string, conversationId: string) => {
    try {
      const mapping = localStorage.getItem(CONVERSATION_MAPPING_KEY);
      const parsed = mapping ? JSON.parse(mapping) : {};
      parsed[tabId] = conversationId;
      localStorage.setItem(CONVERSATION_MAPPING_KEY, JSON.stringify(parsed));
    } catch (err) {
      console.error('Failed to save tab-conversation mapping:', err);
    }
  }, []);

  // ========================================
  // API Actions
  // ========================================

  const listConversations = useCallback(async (limit = 50, offset = 0): Promise<Conversation[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await callConversationTool('conv_list_conversations', { limit, offset });
      const convList = result.conversations || [];
      setConversations(convList);
      setIsConnected(true);
      return convList;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to list conversations';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [callConversationTool]);

  const createConversation = useCallback(async (
    title: string, 
    metadata?: Record<string, any>
  ): Promise<Conversation> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await callConversationTool('conv_create_conversation', {
        title,
        metadata: {
          source: 'website',  // Default source
          ...metadata         // Passed metadata can override the default
        }
      });
      
      const conv = result.conversation;
      setCurrentConversation(conv);
      setMessages([]);
      setIsConnected(true);
      
      // Update conversations list
      setConversations(prev => [conv, ...prev]);
      
      return conv;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [callConversationTool]);

  const loadConversation = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await callConversationTool('conv_get_conversation', { id });
      setCurrentConversation(result.conversation);
      setMessages(result.messages || []);
      setIsConnected(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load conversation';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [callConversationTool]);

  const saveMessage = useCallback(async (
    message: Omit<ConversationMessage, 'id' | 'timestamp'>
  ): Promise<ConversationMessage | null> => {
    try {
      const result = await callConversationTool('conv_add_message', {
        conversation_id: message.conversation_id,
        role: message.role,
        content: message.content,
        metadata: message.metadata
      });
      
      setIsConnected(true);
      return result.message;
    } catch (err) {
      console.warn('Failed to save message, queuing for later:', err);
      
      // Queue for later sync
      addToPendingQueue({
        conversation_id: message.conversation_id,
        role: message.role,
        content: message.content,
        metadata: message.metadata
      });
      
      setIsConnected(false);
      return null;
    }
  }, [callConversationTool, addToPendingQueue]);

  const deleteConversation = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await callConversationTool('conv_delete_conversation', { id });
      
      // Update local state
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
      
      setIsConnected(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [callConversationTool, currentConversation]);

  const updateConversation = useCallback(async (
    id: string, 
    updates: Partial<Pick<Conversation, 'title' | 'summary' | 'metadata'>>
  ): Promise<void> => {
    try {
      const result = await callConversationTool('conv_update_conversation', {
        id,
        ...updates
      });
      
      // Update local state
      const updated = result.conversation;
      setConversations(prev => prev.map(c => c.id === id ? updated : c));
      if (currentConversation?.id === id) {
        setCurrentConversation(updated);
      }
      
      setIsConnected(true);
    } catch (err) {
      console.warn('Failed to update conversation:', err);
      throw err;
    }
  }, [callConversationTool, currentConversation]);

  // ========================================
  // Sync Utilities
  // ========================================

  const syncPendingMessages = useCallback(async (): Promise<void> => {
    if (isSyncingRef.current) return;
    
    const pending = getPendingMessages();
    if (pending.length === 0) return;
    
    isSyncingRef.current = true;
    console.log(`🔄 Syncing ${pending.length} pending messages...`);
    
    const stillPending: PendingMessage[] = [];
    
    for (const msg of pending) {
      try {
        await callConversationTool('conv_add_message', {
          conversation_id: msg.conversation_id,
          role: msg.role,
          content: msg.content,
          metadata: msg.metadata
        });
        console.log('✅ Synced pending message');
      } catch (err) {
        console.warn('❌ Failed to sync message, will retry later:', err);
        
        // Increment retry count and keep in queue if under limit
        if (msg.retry_count < 5) {
          stillPending.push({
            ...msg,
            retry_count: msg.retry_count + 1
          });
        } else {
          console.error('⚠️ Message exceeded retry limit, dropping:', msg);
        }
      }
    }
    
    savePendingMessages(stillPending);
    isSyncingRef.current = false;
    
    if (stillPending.length === 0) {
      setIsConnected(true);
    }
  }, [getPendingMessages, savePendingMessages, callConversationTool]);

  const syncConversation = useCallback(async (
    conversation: Partial<Conversation> & { title: string },
    messagesToSync: Array<Omit<ConversationMessage, 'id' | 'timestamp' | 'conversation_id'>>
  ): Promise<Conversation> => {
    const result = await callConversationTool('conv_sync_conversation', {
      conversation,
      messages: messagesToSync
    });
    
    return result.conversation;
  }, [callConversationTool]);

  // ========================================
  // Tab Initialization Helper
  // ========================================

  const initializeForTab = useCallback(async (tabId: string): Promise<Conversation> => {
    // Check if tab already has a conversation
    const existingConvId = getTabConversationId(tabId);
    
    if (existingConvId) {
      try {
        await loadConversation(existingConvId);
        return currentConversation!;
      } catch (err) {
        // Conversation might have been deleted, create new one
        console.warn('Existing conversation not found, creating new one');
      }
    }
    
    // Create new conversation for this tab
    const title = `Chat - ${new Date().toLocaleString()}`;
    const conv = await createConversation(title, { tab_id: tabId });
    setTabConversationId(tabId, conv.id);
    
    return conv;
  }, [getTabConversationId, loadConversation, createConversation, setTabConversationId, currentConversation]);

  // ========================================
  // Effects
  // ========================================

  // Load pending count on mount
  useEffect(() => {
    setPendingCount(getPendingMessages().length);
  }, [getPendingMessages]);

  // Try to sync pending messages when connection is restored
  useEffect(() => {
    if (isConnected && pendingCount > 0) {
      syncPendingMessages();
    }
  }, [isConnected, pendingCount, syncPendingMessages]);

  // Periodic connection check and sync attempt
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isConnected || pendingCount > 0) {
        try {
          // Simple ping to check connection
          await callConversationTool('conv_list_conversations', { limit: 1 });
          setIsConnected(true);
          
          // Try to sync if we have pending messages
          if (pendingCount > 0) {
            await syncPendingMessages();
          }
        } catch {
          // Still disconnected
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, pendingCount, callConversationTool, syncPendingMessages]);

  // ========================================
  // Return
  // ========================================

  return {
    // State
    conversations,
    currentConversation,
    messages,
    isLoading,
    isConnected,
    error,
    pendingCount,
    
    // Actions
    listConversations,
    createConversation,
    loadConversation,
    saveMessage,
    deleteConversation,
    updateConversation,
    
    // Sync utilities
    syncPendingMessages,
    syncConversation,
    
    // Tab helpers
    initializeForTab,
    getTabConversationId,
    setTabConversationId,
  };
}

