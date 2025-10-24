'use client';

import { useRef } from 'react';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string; // For images
  base64?: string; // For sending to server
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onTriggerPicker?: () => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string; // e.g., "image/*,.pdf,.doc"
}

export default function FileUpload({ 
  files, 
  onFilesChange, 
  onTriggerPicker,
  maxFiles = 10,
}: FileUploadProps) {
  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    onFilesChange(updatedFiles);
    
    // Revoke object URL to free memory
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* File List */}
      <div className="space-y-2">
        {files.map((uploadedFile) => (
          <div
            key={uploadedFile.id}
            className="flex items-center gap-3 p-3 bg-zinc-700 rounded-lg group hover:bg-zinc-600 transition-colors"
          >
            {/* File Icon or Image Preview */}
            <div className="flex-shrink-0">
              {uploadedFile.preview ? (
                <img
                  src={uploadedFile.preview}
                  alt={uploadedFile.file.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-zinc-600 rounded flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">
                {uploadedFile.file.name}
              </p>
              <p className="text-xs text-zinc-400">
                {formatFileSize(uploadedFile.file.size)}
              </p>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => removeFile(uploadedFile.id)}
              className="flex-shrink-0 p-1 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
              title="Remove file"
            >
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}

        {/* Add More Files Button */}
        {files.length < maxFiles && onTriggerPicker && (
          <button
            type="button"
            onClick={onTriggerPicker}
            className="w-full p-2 border-2 border-dashed border-zinc-600 rounded-lg text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors text-sm"
          >
            + Add more files ({files.length}/{maxFiles})
          </button>
        )}
      </div>
    </div>
  );
}

