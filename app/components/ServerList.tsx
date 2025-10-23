'use client';

import { useUserServers } from '@/hooks/useUserServers';
import { useServerHealth } from '@/hooks/useServerHealth';
import { Server, RefreshCw, Shield, Clock, Ban, CheckCircle } from 'lucide-react';

interface ServerListProps {
  onServerSelect?: (serverKey: string) => void;
  selectedServer?: string;
}

export default function ServerList({ onServerSelect, selectedServer }: ServerListProps) {
  const { servers, loading, error, refresh } = useUserServers();
  const { healthStatus, checking, refresh: refreshHealth } = useServerHealth(
    servers.map(s => s.server_key)
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading servers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
          <p className="text-red-400 text-sm">Failed to load servers</p>
          <p className="text-red-300 text-xs mt-1">{error}</p>
          <button
            onClick={refresh}
            className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="p-4">
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-center">
          <Server className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-400 text-sm font-medium">No servers available</p>
          <p className="text-zinc-500 text-xs mt-1">
            Ask a server owner to grant you access
          </p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'revoked':
      case 'expired':
        return <Ban className="w-4 h-4 text-red-500" />;
      default:
        return <Server className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'admin':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'read_write':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'read_only':
        return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
      default:
        return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4" />
            Available Servers
          </h3>
          <button
            onClick={() => {
              refresh();
              refreshHealth();
            }}
            disabled={loading || checking}
            className="p-1 rounded hover:bg-zinc-700 transition-colors disabled:opacity-50"
            title="Refresh servers"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 hover:text-white ${(loading || checking) ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-zinc-500">{servers.length} server{servers.length !== 1 ? 's' : ''} accessible</p>
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {servers.map((server) => (
            <button
              key={server.id}
              onClick={() => onServerSelect?.(server.server_key)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedServer === server.server_key
                  ? 'bg-blue-500/10 border-blue-500/50'
                  : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750 hover:border-zinc-600'
              }`}
            >
              {/* Server Name */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {server.name}
                  </h4>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">
                    {server.server_key}
                  </p>
                </div>
                {getStatusIcon(server.permission_status)}
              </div>

              {/* Description */}
              {server.description && (
                <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
                  {server.description}
                </p>
              )}

              {/* Access Level & Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getAccessLevelColor(server.access_level)}`}>
                  {server.access_level.replace('_', ' ')}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  server.permission_status === 'active' ? 'bg-green-500/10 text-green-400' :
                  server.permission_status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {server.permission_status}
                </span>
                {healthStatus[server.server_key] && (
                  <div className="flex items-center gap-1 text-xs">
                    {healthStatus[server.server_key].online ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-green-400">online</span>
                      </>
                    ) : (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                        <span className="text-gray-500" title={healthStatus[server.server_key].error}>
                          offline
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-700 bg-zinc-900/50">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-zinc-400">
              Only servers where you have been granted access appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

