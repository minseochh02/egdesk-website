# MCP Dynamic Service Discovery - Website Update Guide

## Current Problem

The website **hardcodes** the `/filesystem/` endpoint and doesn't discover other available MCP services like `gmail` or `file-conversion`.

```typescript
// Current: useMCPTools.ts - Line 28
const response = await fetch(
  `${TUNNEL_SERVICE_URL}/t/${serverKey}/filesystem/tools/call`,
  //                                      ^^^^^^^^^^^ HARDCODED
```

## Solution Overview

Implement dynamic service discovery so the website can:
1. Fetch available MCP services from the server
2. Allow users to select which service to use
3. Call tools from any available service (filesystem, gmail, file-conversion)

---

## Step 1: Add Service Discovery Hook

Create `hooks/useMCPServices.ts`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TUNNEL_SERVICE_URL = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';

export interface MCPService {
  name: string;
  description: string;
  endpoints: {
    tools: string;
    call: string;
  };
  status: 'active' | 'inactive';
}

interface MCPServicesResponse {
  success: boolean;
  message?: string;
  version?: string;
  servers: MCPService[];
  totalServers: number;
  timestamp?: string;
}

export function useMCPServices(serverKey: string) {
  const { session } = useAuth();
  const [services, setServices] = useState<MCPService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    if (!session?.access_token || !serverKey) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch list of available MCP services
      const response = await fetch(`${TUNNEL_SERVICE_URL}/t/${serverKey}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MCPServicesResponse = await response.json();
      
      if (data.success && data.servers) {
        setServices(data.servers);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching MCP services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [serverKey, session]);

  return {
    services,
    loading,
    error,
    refresh: fetchServices,
  };
}
```

---

## Step 2: Update `useMCPTools` to Accept Service Name

Update `hooks/useMCPTools.ts`:

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TUNNEL_SERVICE_URL = process.env.NEXT_PUBLIC_TUNNEL_SERVICE_URL || 'https://tunneling-service.onrender.com';

interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

// ADD serviceName parameter
export function useMCPTools(serverKey: string, serviceName: string = 'filesystem') {
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
      // DYNAMIC endpoint based on serviceName
      const response = await fetch(
        `${TUNNEL_SERVICE_URL}/t/${serverKey}/${serviceName}/tools/call`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tool: toolName,
            arguments: args,
          }),
        }
      );

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
      console.log('🔍 MCP Raw Response:', JSON.stringify(data, null, 2));
      
      const mcpResponse = data.result || data;
      
      if (mcpResponse.content && Array.isArray(mcpResponse.content) && mcpResponse.content[0]?.text) {
        const responseText = mcpResponse.content[0].text;
        
        // Special handling for responses that are plain text (not JSON)
        if (responseText.includes('successfully')) {
          console.log('✅ Plain text response detected:', responseText.substring(0, 100));
          return mcpResponse;
        }
        
        try {
          const parsedResult = JSON.parse(responseText);
          console.log('✅ Parsed JSON Result:', parsedResult);
          return { content: parsedResult };
        } catch (e) {
          console.log('⚠️ Not JSON, returning text as-is:', responseText.substring(0, 100));
          return mcpResponse;
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

  // Helper methods for filesystem (backward compatible)
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
```

---

## Step 3: Add Service Selector Component

Create `app/components/ServiceSelector.tsx`:

```typescript
'use client';

import { useMCPServices } from '@/hooks/useMCPServices';

interface ServiceSelectorProps {
  serverKey: string;
  selectedService: string;
  onServiceChange: (serviceName: string) => void;
}

export default function ServiceSelector({ 
  serverKey, 
  selectedService, 
  onServiceChange 
}: ServiceSelectorProps) {
  const { services, loading, error } = useMCPServices(serverKey);

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Loading services...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500">
        Error loading services: {error}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No services available
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          MCP Service
        </label>
        <select
          value={selectedService}
          onChange={(e) => onServiceChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          {services.map((service) => (
            <option key={service.name} value={service.name}>
              {service.name} - {service.description}
            </option>
          ))}
        </select>
      </div>
      
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 space-y-1">
          {services.map((service) => (
            <div key={service.name} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                service.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span>{service.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Step 4: Update Components to Use Dynamic Services

### Update `DirectoryTree.tsx`:

```typescript
import { useState } from 'react';
import { useMCPTools } from '@/hooks/useMCPTools';
import ServiceSelector from './ServiceSelector';

interface DirectoryTreeProps {
  serverKey: string;
  serverName: string;
}

export default function DirectoryTree({ serverKey, serverName }: DirectoryTreeProps) {
  const [selectedService, setSelectedService] = useState('filesystem');
  const { listDirectory, readFile, loading, error } = useMCPTools(serverKey, selectedService);
  
  // ... rest of component
  
  return (
    <div>
      <ServiceSelector 
        serverKey={serverKey}
        selectedService={selectedService}
        onServiceChange={setSelectedService}
      />
      
      {/* Rest of directory tree UI */}
    </div>
  );
}
```

### Update `AIChat.tsx`:

```typescript
import { useState } from 'react';
import { useMCPTools } from '@/hooks/useMCPTools';
import ServiceSelector from './ServiceSelector';

interface AIChatProps {
  serverKey: string;
  serverName: string;
}

export default function AIChat({ serverKey, serverName }: AIChatProps) {
  const [selectedService, setSelectedService] = useState('filesystem');
  const { callTool, loading } = useMCPTools(serverKey, selectedService);
  
  // Make selectedService available to Gemini for tool calls
  
  return (
    <div>
      <ServiceSelector 
        serverKey={serverKey}
        selectedService={selectedService}
        onServiceChange={setSelectedService}
      />
      
      {/* Rest of chat UI */}
    </div>
  );
}
```

---

## Step 5: Update Gemini API Route to Support Multiple Services

Update `app/api/gemini/route.ts`:

```typescript
// Add service parameter to tool execution
async function executeMCPTool(
  serverKey: string,
  serviceName: string, // NEW PARAMETER
  toolName: string, 
  args: any,
  accessToken: string
) {
  const response = await fetch(
    `${TUNNEL_SERVICE_URL}/t/${serverKey}/${serviceName}/tools/call`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        tool: toolName,
        arguments: args,
      }),
    }
  );
  
  // ... rest of implementation
}
```

---

## Testing the Dynamic Discovery

### 1. **Check Available Services**

```bash
curl http://localhost:8080/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "MCP Multi-Server Gateway",
  "servers": [
    {
      "name": "filesystem",
      "description": "File System MCP Server...",
      "endpoints": {
        "tools": "/filesystem/tools",
        "call": "/filesystem/tools/call"
      },
      "status": "active"
    },
    {
      "name": "file-conversion",
      "description": "File Conversion MCP Server...",
      "endpoints": {
        "tools": "/file-conversion/tools",
        "call": "/file-conversion/tools/call"
      },
      "status": "active"
    }
  ]
}
```

### 2. **List Tools for Each Service**

```bash
# FileSystem tools
curl http://localhost:8080/filesystem/tools

# File Conversion tools
curl http://localhost:8080/file-conversion/tools

# Gmail tools (if enabled)
curl http://localhost:8080/gmail/tools
```

### 3. **Call a Tool**

```bash
# File Conversion example
curl -X POST http://localhost:8080/file-conversion/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "image_convert",
    "arguments": {
      "inputPath": "/path/to/image.jpg",
      "outputPath": "/path/to/image.webp",
      "format": "webp"
    }
  }'
```

---

## Benefits of Dynamic Discovery

✅ **Automatic Service Detection** - Website discovers all available MCP services  
✅ **No Hardcoding** - Endpoints are fetched dynamically  
✅ **Flexible** - Easy to add new MCP services (calendar, drive, etc.)  
✅ **User Choice** - Users can switch between services in the UI  
✅ **Future-Proof** - New services appear automatically without code changes  

---

## Summary

**Current State:**
- ✅ Server exposes discovery endpoint at `/`
- ✅ File-conversion service is integrated
- ❌ Website hardcodes `/filesystem/` endpoint

**To Do:**
1. Create `useMCPServices` hook
2. Update `useMCPTools` to accept `serviceName` parameter
3. Add `ServiceSelector` component
4. Update `DirectoryTree` and `AIChat` components
5. Update Gemini API route

**Result:** Website will dynamically discover and use all available MCP services (filesystem, gmail, file-conversion, and future services)!

