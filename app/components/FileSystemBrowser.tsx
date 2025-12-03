'use client';

import { useState, useEffect } from 'react';
import { Folder, FolderOpen, File, ChevronRight, Home, RefreshCw } from 'lucide-react';

interface FileSystemEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size?: number;
  modified?: string;
}

interface FileTreeNode extends FileSystemEntry {
  isExpanded?: boolean;
  children?: FileTreeNode[];
  isLoading?: boolean;
}

interface FileSystemBrowserProps {
  serverKey: string;
  onLoadDirectory: (path: string) => Promise<any>;
  onFileSelect?: (path: string, type: string) => void;
}

export default function FileSystemBrowser({ 
  serverKey, 
  onLoadDirectory,
  onFileSelect 
}: FileSystemBrowserProps) {
  const [rootNodes, setRootNodes] = useState<FileTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load root directory on mount
  useEffect(() => {
    loadDirectory('/');
  }, [serverKey]);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading directory:', path);
      const result = await onLoadDirectory(path);
      
      console.log('📦 Raw result:', result);
      console.log('📦 Result type:', typeof result);
      console.log('📦 Result keys:', result ? Object.keys(result) : 'null');
      
      // Parse the MCP response
      let entries: FileSystemEntry[] = [];
      
      // Case 1: result.content is already an array (already parsed)
      if (result?.content && Array.isArray(result.content)) {
        console.log('✅ Content is already an array:', result.content.length);
        entries = result.content;
      }
      // Case 2: Standard MCP format with text that needs parsing
      else if (result?.content?.[0]?.text) {
        try {
          const parsed = JSON.parse(result.content[0].text);
          console.log('✅ Parsed entries from text:', parsed);
          
          // Handle both array responses and object responses
          if (Array.isArray(parsed)) {
            entries = parsed;
          } else if (parsed.entries && Array.isArray(parsed.entries)) {
            entries = parsed.entries;
          }
        } catch (e) {
          console.error('❌ Parse error:', e);
          setError('Failed to parse directory listing');
          return;
        }
      }
      // Case 3: Direct array response
      else if (Array.isArray(result)) {
        console.log('✅ Result is directly an array:', result.length);
        entries = result;
      }

      console.log('📁 Final entries count:', entries.length);
      console.log('📁 First entry sample:', entries[0]);

      // Convert to tree nodes
      const nodes: FileTreeNode[] = entries.map((entry) => ({
        ...entry,
        isExpanded: false,
        children: entry.type === 'directory' ? [] : undefined,
        isLoading: false,
      }));

      console.log('🌳 Created nodes:', nodes);

      if (path === '/') {
        setRootNodes(nodes);
        console.log('✅ Set root nodes:', nodes.length, 'items');
      } else {
        // Update children of the expanded node
        setRootNodes(prev => updateNodeChildren(prev, path, nodes));
      }
    } catch (error) {
      console.error('❌ Load directory error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

  const updateNodeChildren = (
    nodes: FileTreeNode[],
    targetPath: string,
    children: FileTreeNode[]
  ): FileTreeNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return { ...node, children, isLoading: false, isExpanded: true };
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: updateNodeChildren(node.children, targetPath, children) };
      }
      return node;
    });
  };

  const toggleNodeExpanded = (
    nodes: FileTreeNode[],
    targetPath: string,
    expanded: boolean
  ): FileTreeNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return { ...node, isExpanded: expanded };
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: toggleNodeExpanded(node.children, targetPath, expanded) };
      }
      return node;
    });
  };

  const handleNodeClick = async (node: FileTreeNode) => {
    console.log('🖱️ Node clicked:', node.name, node.type);

    if (node.type === 'file' || node.type === 'symlink') {
      onFileSelect?.(node.path, node.type);
      return;
    }

    // Toggle directory expansion
    const newExpanded = !node.isExpanded;
    setRootNodes(prev => toggleNodeExpanded(prev, node.path, newExpanded));

    // Load children if expanding and not already loaded
    if (newExpanded && (!node.children || node.children.length === 0)) {
      console.log('📂 Loading children for:', node.path);
      await loadDirectory(node.path);
    }
  };

  const getFileIcon = (node: FileTreeNode) => {
    if (node.type === 'directory') {
      return node.isExpanded ? (
        <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      ) : (
        <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      );
    }
    
    if (node.type === 'symlink') {
      return <File className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
    }
    
    return <File className="w-4 h-4 text-blue-400 flex-shrink-0" />;
  };

  const renderNode = (node: FileTreeNode, depth: number = 0): React.ReactElement => {
    return (
      <div key={node.path}>
        <div
          className="flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-zinc-700 rounded text-sm group"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {node.type === 'directory' ? (
            <ChevronRight 
              className={`w-3 h-3 text-zinc-400 transition-transform flex-shrink-0 ${
                node.isExpanded ? 'rotate-90' : ''
              }`} 
            />
          ) : (
            <div className="w-3 flex-shrink-0" />
          )}
          
          {getFileIcon(node)}
          
          <span className="text-zinc-200 truncate text-xs flex-1">{node.name}</span>
          
          {node.isLoading && (
            <RefreshCw className="w-3 h-3 text-zinc-400 animate-spin flex-shrink-0" />
          )}
        </div>
        
        {node.type === 'directory' && node.isExpanded && node.children && node.children.length > 0 && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700 bg-zinc-900">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-semibold text-white">Explorer</h3>
        </div>
        <button
          onClick={() => loadDirectory('/')}
          disabled={loading}
          className="p-1 hover:bg-zinc-700 rounded transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-3 h-3 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-1">
        {loading && rootNodes.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-zinc-500">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            Loading...
          </div>
        ) : error ? (
          <div className="px-2 py-4">
            <div className="text-xs text-red-400 bg-red-900/20 border border-red-700 rounded p-2">
              {error}
            </div>
          </div>
        ) : rootNodes.length === 0 ? (
          <div className="text-xs text-zinc-500 px-2 py-4">
            No files found
            <div className="text-[10px] text-zinc-600 mt-1">
              Click refresh to reload
            </div>
          </div>
        ) : (
          rootNodes.map(node => renderNode(node))
        )}
      </div>
    </div>
  );
}

