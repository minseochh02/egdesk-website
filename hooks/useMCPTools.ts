'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TUNNEL_SERVICE_URL = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';

interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export function useMCPTools(serverKey: string) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callTool = async (toolName: string, args: Record<string, any> = {}) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      // Call the file system tools endpoint
      const response = await fetch(`${TUNNEL_SERVICE_URL}/t/${serverKey}/filesystem/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tool: toolName,
          arguments: args,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check for error response
      if (!data.success && data.error) {
        throw new Error(data.error);
      }
      
      // Parse MCP protocol response format
      // Tunnel service wraps MCP response: { success: true, result: { content: [...] } }
      console.log('🔍 MCP Raw Response:', JSON.stringify(data, null, 2));
      
      // Check for tunnel service wrapper
      const mcpResponse = data.result || data;
      
      if (mcpResponse.content && Array.isArray(mcpResponse.content) && mcpResponse.content[0]?.text) {
        // Special handling for download responses (they contain base64 data)
        if (mcpResponse.content[0].text.includes('File downloaded:')) {
          console.log('✅ Download response detected');
          // For download responses, return the raw content without trying to parse as JSON
          return mcpResponse;
        }
        
        try {
          const parsedResult = JSON.parse(mcpResponse.content[0].text);
          console.log('✅ Parsed Result:', parsedResult);
          return { content: parsedResult };
        } catch (e) {
          console.error('❌ Failed to parse MCP response:', e);
          // If parsing fails, return the text as-is
          return { content: mcpResponse.content[0].text };
        }
      }
      
      console.log('⚠️ Returning data as-is');
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listDirectory = async (path: string = '/') => {
    return await callTool('fs_list_directory', { path });
  };

  const readFile = async (path: string) => {
    return await callTool('fs_read_file', { path });
  };

  const getFileInfo = async (path: string) => {
    return await callTool('fs_get_file_info', { path });
  };

  return {
    callTool,
    listDirectory,
    readFile,
    getFileInfo,
    loading,
    error,
  };
}

