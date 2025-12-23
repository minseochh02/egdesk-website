import React from 'react';
import { Play, ChevronDown, Loader2 } from 'lucide-react';

interface RunDialogProps {
  showRunDialog: boolean;
  onClose: () => void;
  availableFunctions: string[];
  functionToRun: string;
  setFunctionToRun: (func: string) => void;
  runResult: { success: boolean; result?: any; error?: string; logs?: string[] } | null;
  setRunResult: (result: any) => void;
  isRunning: boolean;
  onRun: () => void;
}

export const RunDialog: React.FC<RunDialogProps> = ({
  showRunDialog,
  onClose,
  availableFunctions,
  functionToRun,
  setFunctionToRun,
  runResult,
  setRunResult,
  isRunning,
  onRun
}) => {
  if (!showRunDialog) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 shadow-2xl w-full max-w-md mx-4">
        <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-violet-400" />
            Run Function
          </h3>
          <button
            onClick={() => {
              onClose();
              setRunResult(null);
              setFunctionToRun('');
            }}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Select Function</label>
            <div className="relative">
              <select
                value={functionToRun}
                onChange={(e) => setFunctionToRun(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none appearance-none cursor-pointer pr-10"
                autoFocus
              >
                <option value="">-- Select a function --</option>
                {availableFunctions.map((func) => (
                  <option key={func} value={func}>
                    {func}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 pointer-events-none" />
            </div>
            {availableFunctions.length === 0 ? (
              <p className="text-[10px] text-amber-400 mt-1.5">
                No functions detected. Make sure your .gs files contain valid function declarations.
              </p>
            ) : (
              <p className="text-[10px] text-zinc-500 mt-1.5">
                Found {availableFunctions.length} function{availableFunctions.length !== 1 ? 's' : ''} in project. Runs in devMode.
              </p>
            )}
          </div>

          {runResult && (
            <div className={`p-3 rounded-lg text-xs ${
              runResult.success 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className={`font-medium mb-1 ${runResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {runResult.success ? '✅ Success' : '❌ Error'}
              </div>
              {runResult.success ? (
                <pre className="text-zinc-300 whitespace-pre-wrap overflow-auto max-h-40">
                  {runResult.result !== undefined 
                    ? JSON.stringify(runResult.result, null, 2) 
                    : '(no return value)'}
                </pre>
              ) : (
                <p className="text-red-300">{runResult.error}</p>
              )}
              {runResult.logs && runResult.logs.length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-700">
                  <div className="text-zinc-400 mb-1">Logs:</div>
                  {runResult.logs.map((log, i) => (
                    <div key={i} className="text-zinc-300">{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                setRunResult(null);
                setFunctionToRun('');
              }}
              className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onRun}
              disabled={!functionToRun.trim() || isRunning}
              className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

