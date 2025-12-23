import React from 'react';
import { 
  FileCode, 
  Code, 
  CheckCircle, 
  ExternalLink, 
  Play, 
  Settings 
} from 'lucide-react';

export const formatToolResult = (toolCall: any) => {
  if (toolCall.name === 'apps_script_list_files') {
    let files: any[] = [];
    
    // Parse MCP content format
    if (typeof toolCall.result?.content?.[0]?.text === 'string') {
      try {
        files = JSON.parse(toolCall.result.content[0].text);
      } catch (e) {
        files = [];
      }
    } else if (Array.isArray(toolCall.result?.content)) {
      files = toolCall.result.content;
    } else if (Array.isArray(toolCall.result)) {
      files = toolCall.result;
    }
    
    return (
      <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
        <div className="flex items-center gap-1.5 mb-1.5 text-blue-400 font-medium">
          <FileCode className="w-3 h-3" />
          📁 Files in Project ({files.length})
        </div>
        <div className="space-y-1">
          {files.map((file: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 text-zinc-300 font-mono p-1 bg-zinc-900 rounded">
              <span className="text-zinc-400">{file.type === 'server_js' ? '📄' : file.type === 'html' ? '🌐' : '📋'}</span>
              <span>{file.displayName || file.name}</span>
              <span className="text-zinc-500 text-[10px]">({file.type})</span>
            </div>
          ))}
          {files.length === 0 && (
            <p className="text-zinc-500">No files found</p>
          )}
        </div>
      </div>
    );
  }

  if (toolCall.name === 'apps_script_read_file') {
    let content = '';
    if (typeof toolCall.result === 'string') {
      content = toolCall.result;
    } else if (toolCall.result?.content?.[0]?.text) {
      content = toolCall.result.content[0].text;
    } else if (toolCall.result?.content && typeof toolCall.result.content === 'object') {
      content = JSON.stringify(toolCall.result.content, null, 2);
    }
    return (
      <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
        <div className="flex items-center gap-1.5 mb-1.5 text-green-400 font-medium">
          <Code className="w-3 h-3" />
          {toolCall.args.fileName}
        </div>
        <pre className="text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
          {content.substring(0, 500)}{content.length > 500 ? '...' : ''}
        </pre>
      </div>
    );
  }

  if (toolCall.name === 'apps_script_write_file') {
    return (
      <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
        <div className="flex items-center gap-1.5 text-green-400 font-medium">
          <CheckCircle className="w-3 h-3" />
          Saved {toolCall.args.fileName}
        </div>
      </div>
    );
  }

  // Deployment tools
  if (toolCall.name === 'apps_script_create_deployment' || toolCall.name === 'apps_script_update_deployment') {
    let data: any = toolCall.result;
    
    // Parse MCP content format
    if (typeof data?.content?.[0]?.text === 'string') {
      try {
        data = JSON.parse(data.content[0].text);
      } catch (e) {
        // Keep original
      }
    }
    
    // Extract deployment object and URL from various possible locations
    const deployment = data?.deployment || data;
    let webAppUrl = deployment?.webAppUrl 
      || deployment?.entryPoints?.find((e: any) => e.webApp?.url)?.webApp?.url
      || data?.webAppUrl;
    
    // Also try to extract URL from message string if present
    if (!webAppUrl && data?.message) {
      const urlMatch = data.message.match(/https:\/\/script\.google\.com\/[^\s"]+/);
      if (urlMatch) {
        webAppUrl = urlMatch[0];
      }
    }
    
    const deploymentId = deployment?.deploymentId || data?.deploymentId;
    
    console.log('🚀 Deployment result:', { data, deployment, webAppUrl, deploymentId });
    
    return (
      <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
        <div className="flex items-center gap-1.5 mb-1.5 text-violet-400 font-medium">
          <ExternalLink className="w-3 h-3" />
          {toolCall.name === 'apps_script_create_deployment' ? '🚀 Deployed!' : '✅ Deployment Updated'}
        </div>
        {webAppUrl ? (
          <div className="space-y-1">
            <p className="text-zinc-400">Web App URL:</p>
            <a 
              href={webAppUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 break-all underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              {webAppUrl}
            </a>
          </div>
        ) : (
          <p className="text-zinc-400">Deployment ID: {deploymentId || 'Unknown'}</p>
        )}
      </div>
    );
  }

  if (toolCall.name === 'apps_script_list_deployments') {
    let data: any = toolCall.result;
    // Handle different response formats:
    // 1. Raw MCP format: { content: [{ text: "..." }] }
    if (typeof data?.content?.[0]?.text === 'string') {
      try {
        data = JSON.parse(data.content[0].text);
      } catch (e) {
        // Keep original
      }
    }
    // 2. useMCPTools parsed format: { content: { deployments: [...] } }
    else if (data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
      data = data.content;
    }
    const deployments = data?.deployments || data || [];
    
    return (
      <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
        <div className="flex items-center gap-1.5 mb-1.5 text-violet-400 font-medium">
          <ExternalLink className="w-3 h-3" />
          🚀 Project Deployments ({deployments.length})
        </div>
        <div className="space-y-2">
          {deployments.map((dep: any, idx: number) => {
            const webAppUrl = dep.entryPoints?.find((e: any) => e.webApp?.url)?.webApp?.url;
            return (
              <div key={idx} className="p-1.5 bg-zinc-900 rounded border border-zinc-700/50">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-zinc-200">v{dep.versionNumber}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{dep.deploymentId.substring(0, 8)}...</span>
                </div>
                {dep.description && <p className="text-zinc-400 mb-1">{dep.description}</p>}
                {webAppUrl && (
                  <a href={webAppUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 mt-1">
                    <ExternalLink className="w-3 h-3" />
                    Open Web App
                  </a>
                )}
              </div>
            );
          })}
          {deployments.length === 0 && <p className="text-zinc-500">No deployments found</p>}
        </div>
      </div>
    );
  }

  if (toolCall.name === 'apps_script_run_function') {
    let data: any = toolCall.result;
    if (typeof data?.content?.[0]?.text === 'string') {
      try {
        data = JSON.parse(data.content[0].text);
      } catch (e) {
        // Keep original
      }
    } else if (data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
      data = data.content;
    }

    const success = data.success !== false;
    const result = data.result;
    const error = data.error;
    const logs = data.logs || [];
    const functionName = toolCall.args.functionName;

    return (
      <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
        <div className={`flex items-center gap-1.5 mb-1.5 ${success ? 'text-green-400' : 'text-red-400'} font-medium`}>
          <Play className="w-3 h-3" />
          {success ? `✅ ${functionName}()` : `❌ ${functionName}() failed`}
        </div>
        {error && (
          <div className="p-1.5 bg-red-900/30 rounded text-red-300 mb-2">
            {error}
          </div>
        )}
        {result !== undefined && result !== null && (
          <div className="space-y-1">
            <p className="text-zinc-400">Result:</p>
            <pre className="text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto bg-zinc-900 p-2 rounded">
              {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
            </pre>
          </div>
        )}
        {logs.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-zinc-400">Logs:</p>
            <div className="bg-zinc-900 p-1.5 rounded max-h-24 overflow-y-auto">
              {logs.map((log: string, idx: number) => (
                <p key={idx} className="text-zinc-500 text-[10px] font-mono">{log}</p>
              ))}
            </div>
          </div>
        )}
        {success && result === undefined && !error && (
          <p className="text-zinc-400 italic">Function executed successfully (no return value)</p>
        )}
      </div>
    );
  }

  // Default fallback - try to parse JSON and show nicely
  let displayData = toolCall.result;
  if (typeof displayData?.content?.[0]?.text === 'string') {
    try {
      displayData = JSON.parse(displayData.content[0].text);
    } catch (e) {
      displayData = displayData.content[0].text;
    }
  }
  
  return (
    <div className="mt-2 p-2 bg-zinc-800 rounded text-xs">
      <div className="flex items-center gap-1.5 mb-1.5 text-zinc-400 font-medium">
        <Settings className="w-3 h-3" />
        {toolCall.name.replace(/_/g, ' ')}
      </div>
      <pre className="text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-40 overflow-y-auto">
        {typeof displayData === 'object' 
          ? JSON.stringify(displayData, null, 2) 
          : String(displayData).substring(0, 500)}
      </pre>
    </div>
  );
};

