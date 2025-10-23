'use client';

import { useState, useEffect } from 'react';
import { useMCPTools } from '@/hooks/useMCPTools';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, RefreshCw, HardDrive, Loader } from 'lucide-react';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileItem[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

interface DirectoryTreeProps {
  serverKey: string;
  serverName: string;
}

export default function DirectoryTree({ serverKey, serverName }: DirectoryTreeProps) {
  const { listDirectory, loading: mcpLoading, error: mcpError } = useMCPTools(serverKey);
  const [rootItems, setRootItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    loadRootDirectory();
  }, [serverKey]);

  const loadRootDirectory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await listDirectory('/');
      
      if (result.content && Array.isArray(result.content)) {
        const items: FileItem[] = result.content.map((item: any) => ({
          name: item.name || item.path?.split('/').pop() || 'Unknown',
          path: item.path || '/',
          type: item.type || (item.isDirectory ? 'directory' : 'file'),
          size: item.size,
          modified: item.modified,
          isExpanded: false,
          children: item.type === 'directory' || item.isDirectory ? [] : undefined,
        }));
        
        setRootItems(items);
      } else {
        throw new Error('Invalid response format from MCP server');
      }
    } catch (err) {
      console.error('Failed to load root directory:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadDirectory = async (path: string): Promise<FileItem[]> => {
    try {
      const result = await listDirectory(path);
      
      if (result.content && Array.isArray(result.content)) {
        return result.content.map((item: any) => ({
          name: item.name || item.path?.split('/').pop() || 'Unknown',
          path: item.path || path,
          type: item.type || (item.isDirectory ? 'directory' : 'file'),
          size: item.size,
          modified: item.modified,
          isExpanded: false,
          children: item.type === 'directory' || item.isDirectory ? [] : undefined,
        }));
      }
      return [];
    } catch (err) {
      console.error('Failed to load directory:', path, err);
      return [];
    }
  };

  const toggleDirectory = async (path: string) => {
    const updateItems = async (items: FileItem[]): Promise<FileItem[]> => {
      return Promise.all(
        items.map(async (item) => {
          if (item.path === path && item.type === 'directory') {
            if (!item.isExpanded) {
              // Expand and load children
              const children = await loadDirectory(path);
              return { ...item, isExpanded: true, children };
            } else {
              // Collapse
              return { ...item, isExpanded: false };
            }
          } else if (item.children) {
            // Recursively update children
            return { ...item, children: await updateItems(item.children) };
          }
          return item;
        })
      );
    };

    const updatedItems = await updateItems(rootItems);
    setRootItems(updatedItems);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const renderItem = (item: FileItem, level: number = 0) => {
    const isDirectory = item.type === 'directory';
    const isExpanded = item.isExpanded;
    const isSelected = selectedPath === item.path;

    return (
      <div key={item.path}>
        <div
          className={`flex items-center gap-1 px-2 py-1 hover:bg-zinc-700 cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-500/20' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            setSelectedPath(item.path);
            if (isDirectory) {
              toggleDirectory(item.path);
            }
          }}
        >
          {/* Expand/Collapse Icon */}
          {isDirectory && (
            <div className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-zinc-400" />
              )}
            </div>
          )}
          
          {/* File/Folder Icon */}
          <div className="w-4 h-4 flex items-center justify-center">
            {isDirectory ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-yellow-500" />
              ) : (
                <Folder className="w-4 h-4 text-yellow-500" />
              )
            ) : (
              <File className="w-4 h-4 text-blue-400" />
            )}
          </div>

          {/* Name */}
          <span className="text-sm text-zinc-200 flex-1 truncate">
            {item.name}
          </span>

          {/* Size */}
          {!isDirectory && item.size !== undefined && (
            <span className="text-xs text-zinc-500">
              {formatFileSize(item.size)}
            </span>
          )}
        </div>

        {/* Children */}
        {isDirectory && isExpanded && item.children && (
          <div>
            {item.children.length === 0 ? (
              <div
                className="text-xs text-zinc-500 italic px-2 py-1"
                style={{ paddingLeft: `${(level + 1) * 16 + 24}px` }}
              >
                Empty folder
              </div>
            ) : (
              item.children.map((child) => renderItem(child, level + 1))
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-zinc-400">Loading directory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium mb-1">Failed to load directory</p>
          <p className="text-red-300 text-xs mb-3">{error}</p>
          <button
            onClick={loadRootDirectory}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="p-3 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-white">{serverName}</h3>
          </div>
          <button
            onClick={loadRootDirectory}
            disabled={loading || mcpLoading}
            className="p-1 rounded hover:bg-zinc-700 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${mcpLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-1">File System Explorer</p>
      </div>

      {/* Directory Tree */}
      <div className="flex-1 overflow-y-auto">
        {rootItems.length === 0 ? (
          <div className="p-8 text-center">
            <Folder className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No files or folders</p>
          </div>
        ) : (
          <div className="py-1">
            {rootItems.map((item) => renderItem(item))}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedPath && (
        <div className="p-2 border-t border-zinc-700 bg-zinc-800">
          <p className="text-xs text-zinc-400 truncate" title={selectedPath}>
            {selectedPath}
          </p>
        </div>
      )}
    </div>
  );
}

