import React from 'react';
import { Loader2, Code, AlertCircle } from 'lucide-react';

interface CodeEditorProps {
  fileContent: string;
  setFileContent: (content: string) => void;
  selectedFile: string | null;
  isLoadingContent: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onScroll: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  lineNumbersRef: React.RefObject<HTMLDivElement | null>;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  fileContent,
  setFileContent,
  selectedFile,
  isLoadingContent,
  error,
  setError,
  onKeyDown,
  onScroll,
  textareaRef,
  lineNumbersRef
}) => {
  return (
    <div className="flex-1 flex flex-col bg-zinc-900 relative">
      {error && (
        <div className="absolute top-4 right-4 left-4 z-10 bg-red-900/80 border border-red-700 text-red-200 px-4 py-2 rounded-md shadow-lg flex items-start gap-2 text-sm backdrop-blur-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="ml-2 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {isLoadingContent ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm">Reading file...</p>
          </div>
        </div>
      ) : selectedFile ? (
        <div className="flex-1 flex overflow-hidden relative">
          <div
            ref={lineNumbersRef}
            className="h-full py-4 pr-3 pl-2 text-right bg-zinc-900 border-r border-zinc-800 select-none overflow-hidden text-zinc-600 font-mono text-sm leading-relaxed"
            style={{ minWidth: '3rem' }}
          >
            {fileContent.split('\n').map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={onScroll}
            className="flex-1 w-full h-full bg-zinc-900 text-zinc-300 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed custom-scrollbar whitespace-pre"
            spellCheck={false}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
          <Code className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">Select a file to start editing</p>
        </div>
      )}
    </div>
  );
};

