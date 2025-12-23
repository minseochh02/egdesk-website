import React from 'react';
import { 
  Code, 
  Table2, 
  ExternalLink, 
  Loader2, 
  CheckCircle, 
  Save, 
  Upload, 
  Download, 
  Cloud, 
  Play, 
  RefreshCw, 
  PanelRightClose, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { SpreadsheetContext } from './types';

interface EditorHeaderProps {
  projectName?: string;
  projectId: string;
  devScriptId?: string;
  devSpreadsheetUrl?: string;
  prodSpreadsheetUrl?: string;
  spreadsheetContext: SpreadsheetContext;
  devSyncMessage?: string | null;
  devSyncStatus?: string;
  saveStatus?: string;
  onSave?: () => void;
  selectedFile?: string | null;
  isSaving: boolean;
  isLoadingContent: boolean;
  isPushing: boolean;
  isPulling: boolean;
  onPushToGoogle: () => void;
  onPullFromGoogle: () => void;
  syncStatus: string;
  lastPushedVersion: number | null;
  isDeploying: boolean;
  isPullingDev: boolean;
  isPushingProd: boolean;
  isPullingProd: boolean;
  onPushToDev: () => void;
  onPullFromDev: () => void;
  onPushDevToProd: () => void;
  onPullFromProd: () => void;
  hasDevEnvironment: boolean;
  isRunning: boolean;
  onOpenRunDialog: () => void;
  isLoadingFiles: boolean;
  onRefreshFiles: () => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isAuthError: boolean;
  onAuthRetry: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  projectName,
  projectId,
  devScriptId,
  devSpreadsheetUrl,
  prodSpreadsheetUrl,
  spreadsheetContext,
  devSyncMessage,
  devSyncStatus,
  saveStatus,
  onSave,
  selectedFile,
  isSaving,
  isLoadingContent,
  isPushing,
  isPulling,
  onPushToGoogle,
  onPullFromGoogle,
  syncStatus,
  lastPushedVersion,
  isDeploying,
  isPullingDev,
  isPushingProd,
  isPullingProd,
  onPushToDev,
  onPullFromDev,
  onPushDevToProd,
  onPullFromProd,
  hasDevEnvironment,
  isRunning,
  onOpenRunDialog,
  isLoadingFiles,
  onRefreshFiles,
  isChatOpen,
  setIsChatOpen,
  isAuthError,
  onAuthRetry
}) => {
  return (
    <div className="flex flex-col">
      {/* Auth Error Banner */}
      {isAuthError && (
        <div className="bg-blue-900/30 border-b border-blue-500/30 px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2 fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-full">
              <AlertCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-200">Authentication Required</h3>
              <p className="text-xs text-blue-300/80">Please sign in with Google to access this Apps Script project.</p>
            </div>
          </div>
          <button 
            onClick={onAuthRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Code className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              {projectName || 'Apps Script Project'}
            </h2>
            <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-400 font-mono">
              {devScriptId ? 'PROD' : 'ID'}: {projectId}
            </p>
              {/* Dev Spreadsheet Button */}
              {devSpreadsheetUrl && (
                <a 
                  href={devSpreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors px-2 py-0.5 bg-amber-900/30 rounded"
                  title="Open Dev Spreadsheet"
                >
                  <Table2 className="w-3 h-3" />
                  <span>Dev</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {/* prod should not be visible to the user */}
              {spreadsheetContext.isLoading && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              )}
              {/* Dev Sync Status Message */}
              {devSyncMessage && (
                <span className={`flex items-center gap-1 text-xs animate-in fade-in ${
                  devSyncStatus === 'error' ? 'text-red-400' : 
                  devSyncStatus === 'prod-pushed' ? 'text-purple-400' : 'text-amber-400'
                }`}>
                  <CheckCircle className="w-3 h-3" />
                  {devSyncMessage}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-green-400 text-xs mr-2 animate-in fade-in slide-in-from-right-4">
              <CheckCircle className="w-3.5 h-3.5" />
              Saved
            </div>
          )}
          
          <button
            onClick={onSave}
            disabled={!selectedFile || isSaving || isLoadingContent}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save locally (Cmd/Ctrl+S)"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </button>
          
          <div className="w-px h-5 bg-zinc-700 mx-1" />

          {/* DEV/PROD Workflow Buttons */}
          {hasDevEnvironment ? (
            <>
              {/* Push to DEV */}
              <button
                onClick={onPushToDev}
                disabled={isDeploying || isPullingDev || isPushingProd || isPullingProd}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Push local changes to DEV environment"
              >
                {isDeploying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Push DEV
              </button>
              
              {/* Pull from DEV */}
              <button
                onClick={onPullFromDev}
                disabled={isDeploying || isPullingDev || isPushingProd || isPullingProd}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Pull DEV code to local workspace"
              >
                {isPullingDev ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Pull DEV
              </button>
              
              {/* Push DEV to PROD */}
              <button
                onClick={onPushDevToProd}
                disabled={isDeploying || isPullingDev || isPushingProd || isPullingProd}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="⚠️ Deploy DEV code to PRODUCTION"
              >
                {isPushingProd ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Push PROD
              </button>
              
              {/* Pull PROD to DEV */}
              <button
                onClick={onPullFromProd}
                disabled={isDeploying || isPullingDev || isPushingProd || isPullingProd}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sync DEV with PRODUCTION code"
              >
                {isPullingProd ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Pull PROD
              </button>
            </>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-700 text-zinc-500 text-xs font-medium rounded cursor-not-allowed"
              title="No DEV environment configured - set up in EGDesk app"
            >
              <Cloud className="w-3.5 h-3.5" />
              No DEV
            </button>
          )}

          {syncStatus === 'pushed' && (
            <div className="flex items-center gap-1 text-green-400 text-xs animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5" />
              {lastPushedVersion ? `Pushed! (v${lastPushedVersion})` : 'Pushed!'}
            </div>
          )}
          {syncStatus === 'pulled' && (
            <div className="flex items-center gap-1 text-amber-400 text-xs animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5" />
              Pulled!
            </div>
          )}

          <div className="w-px h-5 bg-zinc-700 mx-1" />

          {/* Run & Version Buttons */}
          <button
            onClick={onOpenRunDialog}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Run a function"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Run
          </button>

          <div className="w-px h-5 bg-zinc-700 mx-1" />
          
          <button
            onClick={onRefreshFiles}
            disabled={isLoadingFiles}
            className="p-1.5 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white"
            title="Refresh Files"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="w-px h-5 bg-zinc-700 mx-1" />
          
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-1.5 rounded transition-colors ${
              isChatOpen 
                ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' 
                : 'hover:bg-zinc-700 text-zinc-400 hover:text-white'
            }`}
            title={isChatOpen ? 'Close AI Chat' : 'Open AI Chat'}
          >
            {isChatOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

