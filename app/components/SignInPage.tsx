'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Shield, Lock, Zap, Github } from 'lucide-react';

export default function SignInPage() {
  const { signInWithGoogle, signInWithGithub } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [provider, setProvider] = useState<'google' | 'github' | null>(null);

  const handleSignIn = async (signInMethod: () => Promise<void>, providerName: 'google' | 'github') => {
    setSigningIn(true);
    setProvider(providerName);
    try {
      await signInMethod();
    } catch (error) {
      console.error('Sign in failed:', error);
      setSigningIn(false);
      setProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            EGDesk MCP Client
          </h1>
          <p className="text-zinc-400 text-sm">
            Connect to remote MCP servers securely
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">
            Sign in to continue
          </h2>
          <p className="text-zinc-400 text-sm mb-6">
            Choose your preferred authentication method
          </p>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSignIn(signInWithGoogle, 'google')}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {signingIn && provider === 'google' ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleSignIn(signInWithGithub, 'github')}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingIn && provider === 'github' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Github className="w-5 h-5" />
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-800 px-2 text-zinc-500">Why sign in?</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Secure Access</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  OAuth-based authentication ensures secure connections
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Email Verification</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Access is granted based on your verified email
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Instant Access</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Connect to MCP servers immediately after sign in
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
          <p className="text-xs text-zinc-600 mt-2">
            Don't have access? Ask the server owner to add your email.
          </p>
        </div>
      </div>
    </div>
  );
}

