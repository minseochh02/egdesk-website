'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Trash2, ArrowLeft, User, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut, deleteAccount } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      await deleteAccount();

      // Account deleted successfully - sign out and redirect
      // Note: deleteAccount already clears local session state
      router.push('/landing?deleted=true');
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Please sign in to access settings</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-black/30 border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/landing" className="flex items-center space-x-2">
            <Image 
              src="/EGDesk.png" 
              alt="EGDesk Logo" 
              width={40} 
              height={40}
              className="rounded"
            />
            <span className="text-2xl font-bold text-white">EGDesk</span>
          </Link>
          <Link 
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-white mb-8">Account Settings</h1>

          {/* Account Info Section */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Account Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="text-white text-lg">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Account ID</label>
                <p className="text-white text-sm font-mono">{user.id}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Authentication Method</label>
                <p className="text-white">Google OAuth</p>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-green-400" />
              <h2 className="text-2xl font-bold text-white">Privacy & Data</h2>
            </div>
            
            <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-6">
              <p className="text-green-300 font-semibold mb-2">🔒 Your Data is Private</p>
              <p className="text-gray-300 mb-4">
                All your files, conversations, and AI processing happen locally on your PC. 
                EGDesk only stores your email and MCP server registration information.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full">No cloud storage</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full">No data mining</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full">100% local processing</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/10 backdrop-blur-lg rounded-3xl p-8 border border-red-400/30">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-bold text-white">Danger Zone</h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300">
                Deleting your account will permanently remove:
              </p>
              <ul className="space-y-2 ml-4 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>All your registered MCP servers from our directory</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>All remote access permissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>Your account information (email, profile)</span>
                </li>
              </ul>

              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 mt-4">
                <p className="text-blue-300 text-sm">
                  <strong>Note:</strong> Your local data and desktop application will continue to work. 
                  You just won't be able to access them remotely via the web interface.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete My Account
                </button>
              ) : (
                <div className="mt-6 p-6 bg-black/30 rounded-xl border border-red-400/50">
                  <h3 className="text-xl font-bold text-white mb-4">Confirm Account Deletion</h3>
                  <p className="text-gray-300 mb-4">
                    This action cannot be undone. Type <strong className="text-white">DELETE</strong> to confirm:
                  </p>
                  
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => {
                      setDeleteConfirmText(e.target.value);
                      setDeleteError('');
                    }}
                    placeholder="Type DELETE"
                    className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg text-white mb-4 focus:outline-none focus:border-red-400"
                    disabled={deleting}
                  />

                  {deleteError && (
                    <p className="text-red-400 text-sm mb-4">{deleteError}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirmText !== 'DELETE'}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Permanently Delete Account
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                        setDeleteError('');
                      }}
                      disabled={deleting}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-gray-600">•</span>
            <Link href="/tos" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

