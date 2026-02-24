'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

interface CodingProjectViewerProps {
  projectName: string;
  projectUrl: string;
  tunnelId: string;
}

export default function CodingProjectViewer({
  projectName,
  projectUrl,
  tunnelId
}: CodingProjectViewerProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);
  const [cacheKey, setCacheKey] = useState(Date.now());

  // Construct full tunnel URL (no token in URL - uses session cookie)
  // Add cache-busting parameter to prevent iframe caching
  const fullUrl = `https://tunneling-service.onrender.com/t/${tunnelId}/p/${projectName}/?_t=${cacheKey}`;

  // Authenticate and create session cookie before loading iframe
  useEffect(() => {
    if (!session?.access_token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const authenticateSession = async () => {
      setLoading(true);
      setError(null);
      setSessionReady(false);

      try {
        // Call auth endpoint to create session cookie
        console.log('🔐 Attempting authentication for tunnel:', tunnelId);
        const response = await fetch(
          `https://tunneling-service.onrender.com/t/${tunnelId}/auth`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important: include cookies
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
          console.error('❌ Auth failed:', response.status, errorData);
          throw new Error(errorData.message || 'Authentication failed');
        }

        console.log('✅ Session authenticated for tunnel:', tunnelId);
        setSessionReady(true);
        setLoading(false);
      } catch (err) {
        console.error('❌ Authentication error:', err);
        // Check if it's a network error (endpoint doesn't exist)
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          setError('Auth endpoint not available. The tunneling service may need to be updated.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to authenticate');
        }
        setLoading(false);
      }
    };

    authenticateSession();
  }, [projectName, tunnelId]); // Removed session?.access_token and iframeKey to prevent re-auth on token refresh

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
    setCacheKey(Date.now()); // Force cache bypass with new timestamp
    setLoading(true);
    setError(null);
  };

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load project. The dev server may be offline or the tunnel is not connected.');
  };

  const handleOpenExternal = () => {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="font-medium text-white">{projectName}</span>
            <span>•</span>
            <span className="font-mono text-xs">{fullUrl}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenExternal}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors flex items-center gap-2"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-400 text-sm">Loading {projectName}...</p>
            <p className="text-zinc-600 text-xs mt-2">Connecting to dev server...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center z-10">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-red-400 text-lg font-medium mb-2">Failed to Load Project</p>
            <p className="text-zinc-400 text-sm max-w-md text-center mb-4">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleOpenExternal}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
              >
                Open in New Tab
              </button>
            </div>

            <div className="mt-6 p-4 bg-zinc-800 rounded-lg max-w-md">
              <p className="text-zinc-400 text-xs mb-2"><strong>Troubleshooting:</strong></p>
              <ul className="text-zinc-500 text-xs space-y-1 list-disc list-inside">
                <li>Ensure your EGDesk app is running locally</li>
                <li>Verify the dev server is started for this project</li>
                <li>Check that tunnel connection is active</li>
                <li>Try refreshing the project in EGDesk</li>
              </ul>
            </div>
          </div>
        )}

        {/* Iframe - only render when session is authenticated */}
        {sessionReady && (
          <iframe
            key={iframeKey}
            src={fullUrl}
            className="w-full h-full border-0 bg-white"
            title={`${projectName} - Development Server`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            allow="clipboard-read; clipboard-write"
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-800 border-t border-zinc-700 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-zinc-400">Live Preview</span>
          </div>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-500">Tunnel: {tunnelId}</span>
        </div>

        <div className="flex items-center gap-2 text-zinc-500">
          <span>Powered by EGDesk</span>
        </div>
      </div>
    </div>
  );
}
