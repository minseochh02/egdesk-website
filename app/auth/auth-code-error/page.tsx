'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, Bug, Copy, Check } from 'lucide-react';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  missing_code: {
    title: 'Missing Authorization Code',
    description: 'The OAuth provider did not return an authorization code. This usually happens if you denied access or the session expired.',
  },
  exchange_failed: {
    title: 'Token Exchange Failed',
    description: 'We couldn\'t exchange your authorization code for a session. The code may have expired or already been used.',
  },
  AuthApiError: {
    title: 'Authentication API Error',
    description: 'Supabase returned an error while processing your authentication request.',
  },
  default: {
    title: 'Authentication Error',
    description: 'There was a problem signing you in. Please try again.',
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const [showDebug, setShowDebug] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const error = searchParams.get('error') || 'default';
  const details = searchParams.get('details');
  const timestamp = searchParams.get('timestamp');
  const codePresent = searchParams.get('code_present') === 'true';
  
  const errorInfo = ERROR_MESSAGES[error] || ERROR_MESSAGES.default;
  
  const debugData = {
    error,
    details,
    timestamp,
    codePresent,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
  };

  const copyDebugInfo = async () => {
    await navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              {errorInfo.title}
            </h1>
            
            <p className="text-zinc-400">
              {errorInfo.description}
            </p>
          </div>

          {/* Error Details (if present) */}
          {details && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm font-mono">{details}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 mb-6">
            <Link 
              href="/"
              className="block w-full px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-medium transition-colors text-center"
            >
              Try Again
            </Link>
            
            <Link 
              href="/"
              className="block w-full px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-medium transition-colors text-center"
            >
              Return Home
            </Link>
          </div>

          {/* Debug Section */}
          <div className="border-t border-zinc-700 pt-4">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center justify-between w-full text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
            >
              <span className="flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Developer Debug Info
              </span>
              {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showDebug && (
              <div className="mt-4 space-y-3">
                <div className="bg-zinc-900 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-zinc-500">Debug Data</span>
                    <button
                      onClick={copyDebugInfo}
                      className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-zinc-500">Error Type: </span>
                      <span className="text-red-400">{error}</span>
                    </div>
                    {details && (
                      <div>
                        <span className="text-zinc-500">Message: </span>
                        <span className="text-amber-400">{details}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-zinc-500">Code Present: </span>
                      <span className={codePresent ? 'text-green-400' : 'text-red-400'}>
                        {codePresent ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {timestamp && (
                      <div>
                        <span className="text-zinc-500">Timestamp: </span>
                        <span className="text-zinc-300">{new Date(timestamp).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Common Fixes */}
                <div className="bg-zinc-900/50 rounded-xl p-4">
                  <h3 className="text-zinc-300 text-sm font-medium mb-2">Common Fixes</h3>
                  <ul className="text-zinc-500 text-xs space-y-1">
                    <li>• Check Supabase redirect URLs match your domain</li>
                    <li>• Verify OAuth provider callback URL is correct</li>
                    <li>• Clear cookies and try again</li>
                    <li>• Check if PKCE flow is properly configured</li>
                    <li>• Ensure auth code hasn't expired (usually 10 min)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center mt-4">
          <Link 
            href="/"
            className="inline-flex items-center text-zinc-500 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}