'use client';

import { useState } from 'react';
import { Download, FileText, Image, File, AlertCircle, CheckCircle } from 'lucide-react';

interface FileDownloaderProps {
  filename: string;
  base64Data: string;
  fileSize?: number;
  mimeType?: string;
  onDownload?: () => void;
}

export default function FileDownloader({ 
  filename, 
  base64Data, 
  fileSize, 
  mimeType,
  onDownload 
}: FileDownloaderProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');

  const getFileIcon = (filename: string, mimeType?: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <Image className="w-5 h-5 text-blue-400" />;
    }
    
    if (['pdf'].includes(extension || '')) {
      return <FileText className="w-5 h-5 text-red-400" />;
    }
    
    return <File className="w-5 h-5 text-zinc-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    if (!base64Data) {
      setDownloadStatus('error');
      return;
    }

    setIsDownloading(true);
    setDownloadStatus('downloading');

    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType || 'application/octet-stream' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      setDownloadStatus('success');
      onDownload?.();
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setDownloadStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('error');
      
      // Reset error status after 3 seconds
      setTimeout(() => {
        setDownloadStatus('idle');
      }, 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusIcon = () => {
    switch (downloadStatus) {
      case 'downloading':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Download className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (downloadStatus) {
      case 'downloading':
        return 'Downloading...';
      case 'success':
        return 'Downloaded!';
      case 'error':
        return 'Download failed';
      default:
        return 'Download';
    }
  };

  const getButtonClass = () => {
    const baseClass = "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200";
    
    switch (downloadStatus) {
      case 'downloading':
        return `${baseClass} bg-blue-600 text-white cursor-not-allowed`;
      case 'success':
        return `${baseClass} bg-green-600 text-white`;
      case 'error':
        return `${baseClass} bg-red-600 text-white`;
      default:
        return `${baseClass} bg-blue-600 hover:bg-blue-700 text-white`;
    }
  };

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <div className="flex items-start gap-3">
        {/* File Icon */}
        <div className="flex-shrink-0 mt-1">
          {getFileIcon(filename, mimeType)}
        </div>
        
        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-white truncate">
              {filename}
            </h4>
            {fileSize && (
              <span className="text-xs text-zinc-400">
                ({formatFileSize(fileSize)})
              </span>
            )}
          </div>
          
          {mimeType && (
            <p className="text-xs text-zinc-500 mb-2">
              {mimeType}
            </p>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading || !base64Data}
              className={getButtonClass()}
            >
              {getStatusIcon()}
              {getStatusText()}
            </button>
            
            {downloadStatus === 'error' && (
              <p className="text-xs text-red-400">
                Try again or check your browser settings
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress indicator for large files */}
      {isDownloading && (
        <div className="mt-3">
          <div className="w-full bg-zinc-700 rounded-full h-1">
            <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      )}
    </div>
  );
}
