'use client';

import React from 'react';
import FileUpload, { UploadedFile } from './FileUpload';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: (files: UploadedFile[]) => void;
  handleSend: () => void;
  mcpLoading: boolean;
  triggerFilePicker: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFilePickerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
}

export default function ChatInput({
  input,
  setInput,
  uploadedFiles,
  setUploadedFiles,
  handleSend,
  mcpLoading,
  triggerFilePicker,
  fileInputRef,
  handleFilePickerChange,
  handleKeyPress,
  handlePaste
}: ChatInputProps) {
  return (
    <div className="border-t border-zinc-700 bg-zinc-800 p-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*"
        onChange={handleFilePickerChange}
        className="hidden"
      />

      {/* File Upload Area - Shows attached files before sending */}
      {uploadedFiles.length > 0 && (
        <div className="mb-3">
          <FileUpload
            files={uploadedFiles}
            onFilesChange={setUploadedFiles}
            onTriggerPicker={triggerFilePicker}
            maxFiles={10}
            maxSizeMB={100}
            accept="*"
          />
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1 bg-zinc-700 rounded-2xl px-3 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <div className="flex items-end gap-2">
            {/* File Picker Button */}
            <button 
              onClick={triggerFilePicker}
              className={`flex-shrink-0 pb-0.5 transition-colors ${
                uploadedFiles.length > 0
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
              title="Attach files (click, drag & drop, or paste)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            
            {/* Textarea */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder={uploadedFiles.length > 0 ? `Message with ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}...` : "Type a message..."}
              className="flex-1 bg-transparent text-white placeholder-zinc-400 resize-none focus:outline-none text-sm"
              rows={1}
              style={{
                maxHeight: '120px',
                minHeight: '24px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
          </div>
        </div>
        
        <button
          onClick={handleSend}
          disabled={(!input.trim() && uploadedFiles.length === 0) || mcpLoading}
          className="flex-shrink-0 h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
      
      {/* Bottom hint text */}
      {uploadedFiles.length > 0 && (
        <div className="flex items-center justify-between mt-2 px-2">
          <span className="text-xs text-blue-400">
            {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} attached
          </span>
          <span className="text-xs text-zinc-500">
            Press Enter to send
          </span>
        </div>
      )}
    </div>
  );
}

