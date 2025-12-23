import React from 'react';
import { 
  FileCode, 
  Loader2, 
  GitBranch, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw 
} from 'lucide-react';
import { ScriptFile, VersionInfo } from './types';

interface FileListProps {
  files: ScriptFile[];
  selectedFile: string | null;
  isLoadingFiles: boolean;
  selectedVersion: number | null;
  onFileSelect: (fileName: string) => void;
  
  // DEV Versions
  devScriptId?: string;
  devVersions: VersionInfo[];
  selectedDevVersion: number | null;
  isLoadingDevVersions: boolean;
  showDevVersionDropdown: boolean;
  setShowDevVersionDropdown: (show: boolean) => void;
  onDevVersionSelect: (version: number | null) => void;
  
  // PROD Versions
  prodVersions: VersionInfo[];
  selectedProdVersion: number | null;
  isLoadingProdVersions: boolean;
  showProdVersionDropdown: boolean;
  setShowProdVersionDropdown: (show: boolean) => void;
  onProdVersionSelect: (version: number | null) => void;
  
  // Legacy Versions
  versions: VersionInfo[];
  showVersionDropdown: boolean;
  setShowVersionDropdown: (show: boolean) => void;
  isLoadingVersions: boolean;
  onVersionSelect: (version: number | null) => void;
  
  // Shared
  activeVersionEnv: 'dev' | 'prod' | null;
  handleRestoreVersion: () => void;
  isSaving: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedFile,
  isLoadingFiles,
  selectedVersion,
  onFileSelect,
  devScriptId,
  devVersions,
  selectedDevVersion,
  isLoadingDevVersions,
  showDevVersionDropdown,
  setShowDevVersionDropdown,
  onDevVersionSelect,
  prodVersions,
  selectedProdVersion,
  isLoadingProdVersions,
  showProdVersionDropdown,
  setShowProdVersionDropdown,
  onProdVersionSelect,
  versions,
  showVersionDropdown,
  setShowVersionDropdown,
  isLoadingVersions,
  onVersionSelect,
  activeVersionEnv,
  handleRestoreVersion,
  isSaving
}) => {
  return (
    <div className="w-64 border-r border-zinc-700 flex flex-col bg-zinc-850">
      <div className="p-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Files {selectedVersion !== null && `(v${selectedVersion})`}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoadingFiles ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin mb-2" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 text-xs">
            No files found
          </div>
        ) : (
          <div className="px-2 space-y-0.5">
            {files.map((file) => (
              <button
                key={file.id || file.name}
                onClick={() => onFileSelect(file.name)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                  selectedFile === file.name
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="ml-auto text-[10px] opacity-50 font-mono">
                  {file.type === 'server_js' || file.type === 'SERVER_JS' ? 'gs' : 
                   file.type === 'html' || file.type === 'HTML' ? 'html' : 
                   file.type === 'json' || file.type === 'JSON' ? 'json' : 
                   file.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DEV Version History Selector */}
      {devScriptId && (
        <div className="border-t border-amber-700/30 bg-amber-950/10">
          <button
            onClick={() => {
              setShowDevVersionDropdown(!showDevVersionDropdown);
              setShowProdVersionDropdown(false);
            }}
            className="w-full flex items-center justify-between p-3 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-900/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5" />
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-800/50 text-amber-300 rounded">DEV</span>
              <span>
                {selectedDevVersion ? `v${selectedDevVersion}` : 'Current'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isLoadingDevVersions && <Loader2 className="w-3 h-3 animate-spin" />}
              {showDevVersionDropdown ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {showDevVersionDropdown && (
            <div className="max-h-40 overflow-y-auto bg-zinc-900 border-b border-amber-700/30 shadow-inner">
              <button
                onClick={() => {
                  onDevVersionSelect(null);
                }}
                className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between ${
                  selectedDevVersion === null && activeVersionEnv !== 'dev'
                    ? 'bg-amber-600/20 text-amber-400' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span className="font-medium">Current (HEAD)</span>
                <span className="opacity-50">Local</span>
              </button>
              
              {devVersions.map((v) => (
                <button
                  key={v.versionNumber}
                  onClick={() => {
                    onDevVersionSelect(v.versionNumber);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs border-t border-zinc-800/50 ${
                    selectedDevVersion === v.versionNumber
                      ? 'bg-amber-600/20 text-amber-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono font-medium">v{v.versionNumber}</span>
                    <span className="opacity-50 text-[10px]">
                      {new Date(v.createTime).toLocaleDateString()}
                    </span>
                  </div>
                  {v.description && (
                    <div className="truncate opacity-70 text-[10px]">
                      {v.description}
                    </div>
                  )}
                </button>
              ))}
              
              {devVersions.length === 0 && !isLoadingDevVersions && (
                <div className="px-4 py-3 text-xs text-zinc-600 text-center italic">
                  No DEV versions created yet
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PROD Version History Selector */}
      <div className="border-t border-purple-700/30 bg-purple-950/10">
        <button
          onClick={() => {
            setShowProdVersionDropdown(!showProdVersionDropdown);
            setShowDevVersionDropdown(false);
          }}
          className="w-full flex items-center justify-between p-3 text-xs font-semibold text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-800/50 text-purple-300 rounded">PROD</span>
            <span>
              {selectedProdVersion ? `v${selectedProdVersion}` : 'Current'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLoadingProdVersions && <Loader2 className="w-3 h-3 animate-spin" />}
            {showProdVersionDropdown ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </button>

        {showProdVersionDropdown && (
          <div className="max-h-40 overflow-y-auto bg-zinc-900 border-b border-purple-700/30 shadow-inner">
            <button
              onClick={() => {
                onProdVersionSelect(null);
              }}
              className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between ${
                selectedProdVersion === null && activeVersionEnv !== 'prod'
                  ? 'bg-purple-600/20 text-purple-400' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <span className="font-medium">Current (HEAD)</span>
              <span className="opacity-50">Live</span>
            </button>
            
            {prodVersions.map((v) => (
              <button
                key={v.versionNumber}
                onClick={() => {
                  onProdVersionSelect(v.versionNumber);
                }}
                className={`w-full text-left px-4 py-2 text-xs border-t border-zinc-800/50 ${
                  selectedProdVersion === v.versionNumber
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono font-medium">v{v.versionNumber}</span>
                  <span className="opacity-50 text-[10px]">
                    {new Date(v.createTime).toLocaleDateString()}
                  </span>
                </div>
                {v.description && (
                  <div className="truncate opacity-70 text-[10px]">
                    {v.description}
                  </div>
                )}
              </button>
            ))}
            
            {prodVersions.length === 0 && !isLoadingProdVersions && (
              <div className="px-4 py-3 text-xs text-zinc-600 text-center italic">
                No PROD versions created yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legacy Version History Selector (for backward compatibility when no dev script) */}
      {!devScriptId && (
        <div className="border-t border-zinc-700">
          <button
            onClick={() => setShowVersionDropdown(!showVersionDropdown)}
            className="w-full flex items-center justify-between p-3 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5" />
              <span>
                {selectedVersion ? `v${selectedVersion}` : 'Current (HEAD)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isLoadingVersions && <Loader2 className="w-3 h-3 animate-spin" />}
              {showVersionDropdown ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {showVersionDropdown && (
            <div className="max-h-48 overflow-y-auto bg-zinc-900 border-b border-zinc-700 shadow-inner">
              <button
                onClick={() => onVersionSelect(null)}
                className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between ${
                  selectedVersion === null 
                    ? 'bg-blue-600/20 text-blue-400' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span className="font-medium">Current (HEAD)</span>
                <span className="opacity-50">Local</span>
              </button>
              
              {versions.map((v) => (
                <button
                  key={v.versionNumber}
                  onClick={() => onVersionSelect(v.versionNumber)}
                  className={`w-full text-left px-4 py-2 text-xs border-t border-zinc-800/50 ${
                    selectedVersion === v.versionNumber
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono font-medium">v{v.versionNumber}</span>
                    <span className="opacity-50 text-[10px]">
                      {new Date(v.createTime).toLocaleDateString()}
                    </span>
                  </div>
                  {v.description && (
                    <div className="truncate opacity-70 text-[10px]">
                      {v.description}
                    </div>
                  )}
                </button>
              ))}
              
              {versions.length === 0 && !isLoadingVersions && (
                <div className="px-4 py-3 text-xs text-zinc-600 text-center italic">
                  No versions created yet
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Restore Version Button (for selected version from any env) */}
      {(selectedVersion !== null || selectedDevVersion !== null || selectedProdVersion !== null) && (
        <div className="p-2 bg-zinc-900 border-t border-zinc-700">
          <button
            onClick={handleRestoreVersion}
            disabled={isSaving}
            className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs rounded border transition-colors ${
              activeVersionEnv === 'dev' 
                ? 'bg-amber-800/30 hover:bg-amber-800/50 text-amber-300 border-amber-700/50'
                : activeVersionEnv === 'prod'
                ? 'bg-purple-800/30 hover:bg-purple-800/50 text-purple-300 border-purple-700/50'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
              Restore to Local
            </button>
          </div>
        )}
    </div>
  );
};

