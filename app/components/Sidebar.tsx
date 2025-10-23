'use client';

import { useState } from 'react';

interface SidebarProps {
  onNewChat: () => void;
}

export default function Sidebar({ onNewChat }: SidebarProps) {
  const [chatHistory] = useState([
    { id: '1', title: 'Welcome Chat', date: '2 hours ago' },
    { id: '2', title: 'Project Discussion', date: 'Yesterday' },
    { id: '3', title: 'Code Review', date: '2 days ago' },
    { id: '4', title: 'Bug Fixes', date: 'Last week' },
  ]);

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h1 className="text-xl font-semibold text-white">EGDesk</h1>
        <button
          onClick={onNewChat}
          className="rounded-lg p-2 hover:bg-zinc-800 transition-colors"
          title="New Chat"
        >
          <svg 
            className="w-5 h-5 text-zinc-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 pl-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500"
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

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              className="group flex w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-zinc-800 transition-colors"
            >
              <span className="text-sm font-medium text-white truncate w-full">
                {chat.title}
              </span>
              <span className="text-xs text-zinc-500">{chat.date}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-zinc-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">User</p>
            <p className="text-xs text-zinc-500">Online</p>
          </div>
          <button className="rounded-lg p-1 hover:bg-zinc-800 transition-colors">
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
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

