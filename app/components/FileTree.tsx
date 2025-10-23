'use client';

import { useState } from 'react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  expanded?: boolean;
}

// Sample file tree data
const sampleFileTree: FileNode[] = [
  {
    id: '1',
    name: 'Documents',
    type: 'folder',
    expanded: true,
    children: [
      {
        id: '1-1',
        name: 'Project',
        type: 'folder',
        expanded: false,
        children: [
          { id: '1-1-1', name: 'README.md', type: 'file' },
          { id: '1-1-2', name: 'package.json', type: 'file' },
        ],
      },
      { id: '1-2', name: 'Notes.txt', type: 'file' },
      { id: '1-3', name: 'Ideas.md', type: 'file' },
    ],
  },
  {
    id: '2',
    name: 'Images',
    type: 'folder',
    expanded: false,
    children: [
      { id: '2-1', name: 'photo1.jpg', type: 'file' },
      { id: '2-2', name: 'photo2.png', type: 'file' },
    ],
  },
  {
    id: '3',
    name: 'Code',
    type: 'folder',
    expanded: true,
    children: [
      {
        id: '3-1',
        name: 'src',
        type: 'folder',
        expanded: true,
        children: [
          { id: '3-1-1', name: 'index.ts', type: 'file' },
          { id: '3-1-2', name: 'app.ts', type: 'file' },
          { id: '3-1-3', name: 'utils.ts', type: 'file' },
        ],
      },
      { id: '3-2', name: 'package.json', type: 'file' },
      { id: '3-3', name: 'tsconfig.json', type: 'file' },
    ],
  },
  { id: '4', name: 'config.yml', type: 'file' },
];

interface FileTreeProps {
  onFileSelect?: (file: FileNode) => void;
}

export default function FileTree({ onFileSelect }: FileTreeProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>(sampleFileTree);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleFolder = (id: string, nodes: FileNode[]): FileNode[] => {
    return nodes.map((node) => {
      if (node.id === id && node.type === 'folder') {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return { ...node, children: toggleFolder(id, node.children) };
      }
      return node;
    });
  };

  const handleNodeClick = (node: FileNode) => {
    if (node.type === 'folder') {
      setFileTree(toggleFolder(node.id, fileTree));
    }
    setSelectedId(node.id);
    onFileSelect?.(node);
  };

  const getFileIcon = (node: FileNode, type: 'file' | 'folder', expanded?: boolean) => {
    if (type === 'folder') {
      return expanded ? (
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      );
    }
    
    // File icons based on extension
    const extension = node.name.split('.').pop()?.toLowerCase();
    if (extension === 'ts' || extension === 'tsx' || extension === 'js' || extension === 'jsx') {
      return (
        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (extension === 'md') {
      return (
        <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (extension === 'json' || extension === 'yml' || extension === 'yaml') {
      return (
        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (extension === 'jpg' || extension === 'png' || extension === 'gif' || extension === 'svg') {
      return (
        <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  const renderNode = (node: FileNode, depth: number = 0): JSX.Element => {
    const isSelected = selectedId === node.id;
    
    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-zinc-700 rounded transition-colors ${
            isSelected ? 'bg-zinc-700' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {node.type === 'folder' && (
            <svg
              className={`w-3 h-3 text-zinc-400 transition-transform ${
                node.expanded ? 'rotate-90' : ''
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {node.type === 'file' && <div className="w-3" />}
          {getFileIcon(node, node.type, node.expanded)}
          <span className="text-sm text-zinc-200 truncate">{node.name}</span>
        </div>
        {node.type === 'folder' && node.expanded && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-850 border-l border-zinc-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white">Files</h3>
        <div className="flex gap-1">
          <button
            className="p-1 hover:bg-zinc-700 rounded transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            className="p-1 hover:bg-zinc-700 rounded transition-colors"
            title="New Folder"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-zinc-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Search files..."
            className="w-full rounded bg-zinc-800 px-3 py-1.5 pl-8 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-1">
        {fileTree.map((node) => renderNode(node))}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-zinc-700 px-3 py-1.5">
        <div className="text-xs text-zinc-500">
          {fileTree.length} items
        </div>
      </div>
    </div>
  );
}

