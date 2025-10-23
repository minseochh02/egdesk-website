'use client';

import { useState } from 'react';
import { Search, Mic, Camera } from 'lucide-react';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search functionality here
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 hover:underline cursor-pointer">About</div>
          <div className="text-sm text-gray-600 hover:underline cursor-pointer">Features</div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">
            Sign in
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-7xl font-normal text-gray-800 tracking-tight">
            <span className="text-blue-500">E</span>
            <span className="text-red-500">G</span>
            <span className="text-yellow-500">D</span>
            <span className="text-blue-500">e</span>
            <span className="text-green-500">s</span>
            <span className="text-red-500">k</span>
          </h1>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-full border ${
              isFocused
                ? 'border-transparent shadow-[0_1px_6px_rgba(32,33,36,0.28)]'
                : 'border-gray-300 hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)]'
            } transition-shadow duration-200 bg-white`}
          >
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search EGDesk or type a URL"
              className="flex-1 outline-none text-base text-gray-700 placeholder:text-gray-500"
            />
            <button type="button" className="hover:bg-gray-100 p-1 rounded-full transition-colors">
              <Mic className="w-5 h-5 text-blue-500" />
            </button>
            <button type="button" className="hover:bg-gray-100 p-1 rounded-full transition-colors">
              <Camera className="w-5 h-5 text-blue-500" />
            </button>
          </div>

          {/* Search Buttons */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              type="submit"
              className="bg-gray-50 hover:bg-gray-100 border border-gray-50 hover:border-gray-200 text-gray-700 px-6 py-2 rounded text-sm transition-all"
            >
              EGDesk Search
            </button>
            <button
              type="button"
              className="bg-gray-50 hover:bg-gray-100 border border-gray-50 hover:border-gray-200 text-gray-700 px-6 py-2 rounded text-sm transition-all"
            >
              I'm Feeling Lucky
            </button>
          </div>
        </form>

        {/* Language Options */}
        <div className="mt-8 text-sm text-gray-600">
          EGDesk offered in:{' '}
          <button className="text-blue-600 hover:underline ml-1">한국어</button>
          <button className="text-blue-600 hover:underline ml-2">日本語</button>
          <button className="text-blue-600 hover:underline ml-2">中文</button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-300">
        <div className="px-6 py-3 border-b border-gray-300">
          <p className="text-sm text-gray-600">EGDesk Workspace</p>
        </div>
        <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button className="text-sm text-gray-600 hover:underline">Advertising</button>
            <button className="text-sm text-gray-600 hover:underline">Business</button>
            <button className="text-sm text-gray-600 hover:underline">How Search works</button>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm text-gray-600 hover:underline">Privacy</button>
            <button className="text-sm text-gray-600 hover:underline">Terms</button>
            <button className="text-sm text-gray-600 hover:underline">Settings</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

