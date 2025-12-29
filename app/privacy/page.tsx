import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicy() {
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
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-12 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-400">
            Last Updated: December 29, 2025
          </p>
        </div>
      </section>

      {/* Privacy Highlight Banner */}
      <section className="pb-8 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Privacy-First by Design</h2>
              <p className="text-green-200">
                Your data stays on your computer or in your own Google account. We request permissions only to help AI create and manage your MCP servers — we never collect or store your data in our database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/10 space-y-10">
            
            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm">1</span>
                Introduction
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p>
                  This Privacy Policy explains how QUUS ("Company," "we," "us," or "our") handles information when you use the EGDesk desktop application and web interface (the "Service").
                </p>
                <p>
                  EGDesk is designed with a fundamentally different approach to privacy: <strong className="text-white">your data stays on your device or in your own Google account</strong>. Unlike traditional cloud services, we do not collect or store your files, conversations, or AI interactions in our database. We request Google permissions only to enable AI-assisted MCP server creation and management within your own account.
                </p>
              </div>
            </div>

            {/* Our Privacy Principle */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-sm">2</span>
                Our Privacy Principle
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold text-white">100% Local Processing</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      All AI processing happens on your PC. Your prompts, conversations, and outputs never touch our servers.
                    </p>
                  </div>
                  <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold text-white">Your Data, Your Storage</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Data is stored on your PC and/or your Google account — never in our database.
                    </p>
                  </div>
                  <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold text-white">No Data Mining</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      We don't analyze, train on, or monetize your data. Your AI interactions remain completely private.
                    </p>
                  </div>
                  <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-bold text-white">You Own Your Data</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Whether local or in Google, you have complete control. Delete it anytime, no questions asked.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What We Collect */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-sm">3</span>
                Information We Collect
              </h2>
              <div className="text-gray-300 space-y-6 pl-11">
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">3.1 Account Information</h3>
                  <p className="mb-3">When you sign in with Google OAuth, we receive:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span><strong className="text-white">Email address</strong> — Used to identify your account and enable remote access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span><strong className="text-white">Basic profile info</strong> — Name and profile picture (for display purposes only)</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">3.2 Google Permissions (OAuth Scopes)</h3>
                  <p className="mb-3">EGDesk requests the following Google permissions to enable its features:</p>
                  
                  <div className="space-y-3">
                    <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                      <p className="text-white font-medium text-sm mb-2">📁 Drive & Storage</p>
                      <ul className="space-y-1 text-sm text-gray-400">
                        <li>• <strong>drive.file</strong> — Access only files created by EGDesk</li>
                        <li>• <strong>script.storage</strong> — Store MCP configuration data</li>
                      </ul>
                    </div>

                    <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                      <p className="text-white font-medium text-sm mb-2">⚙️ Apps Script Management</p>
                      <ul className="space-y-1 text-sm text-gray-400">
                        <li>• <strong>script.projects</strong> — Create/update MCP server projects</li>
                        <li>• <strong>script.deployments</strong> — Deploy MCP servers</li>
                        <li>• <strong>script.webapp.deploy</strong> — Publish MCP as web apps</li>
                        <li>• <strong>script.metrics</strong> — View performance metrics</li>
                        <li>• <strong>script.external_request</strong> — Connect to external APIs</li>
                        <li>• <strong>script.send_mail</strong> — Send notification emails</li>
                      </ul>
                    </div>

                    <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                      <p className="text-white font-medium text-sm mb-2">🔧 Advanced (Restricted)</p>
                      <ul className="space-y-1 text-sm text-gray-400">
                        <li>• <strong>drive.scripts</strong> — Modify Apps Script code (enables AI-assisted code editing)</li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mt-3">
                    These permissions enable AI to create, customize, and fix your MCP server code. You can revoke access anytime via 
                    <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 ml-1">Google Account Settings</a>.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">3.3 Connection Data</h3>
                  <p className="mb-3">To enable remote access between your devices, we process:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span><strong className="text-white">Connection status</strong> — Whether your desktop app is online</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span><strong className="text-white">Session tokens</strong> — Temporary tokens for secure connections</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">3.4 Technical Data</h3>
                  <p className="mb-3">For service functionality and troubleshooting:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span><strong className="text-white">Error logs</strong> — Anonymous error reports for debugging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span><strong className="text-white">App version</strong> — To ensure compatibility</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            {/* What We DON'T Collect */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center text-sm">4</span>
                Information We Do NOT Collect
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p className="mb-4">
                  This is equally important. We <strong className="text-white">do not collect or store</strong> the following in our database:
                </p>
                <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-5">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span><strong className="text-white">Your local files and documents</strong> — Stored on your PC</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span><strong className="text-white">Your Google Sheets, Drive, or Docs data</strong> — Stored in your Google account</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span><strong className="text-white">AI conversations and prompts</strong> — Your chats with local LLMs are private</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span><strong className="text-white">AI model outputs</strong> — Generated content never leaves your machine</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span><strong className="text-white">MCP server data</strong> — Stored on your PC and/or Google account, never on our servers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span><strong className="text-white">Browsing history or usage patterns</strong> — We don't track what you do</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-sm">5</span>
                How We Use Your Information
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p>The limited information we collect is used solely for:</p>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">▸</span>
                    <span><strong className="text-white">Authentication</strong> — Verifying your identity via Google OAuth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">▸</span>
                    <span><strong className="text-white">Remote Access</strong> — Connecting your web interface to your desktop app</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">▸</span>
                    <span><strong className="text-white">Service Improvement</strong> — Fixing bugs and improving reliability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">▸</span>
                    <span><strong className="text-white">Communication</strong> — Responding to support requests you initiate</span>
                  </li>
                </ul>
                <p className="mt-4">
                  We <strong className="text-white">never</strong> sell, rent, or share your information with third parties for marketing purposes.
                </p>
              </div>
            </div>

            {/* Third-Party Services */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center text-sm">6</span>
                Third-Party Services
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                
                <div className="bg-white/5 border border-white/20 rounded-xl p-5 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Google OAuth</h3>
                  <p className="text-gray-400 mb-2">
                    We use Google for authentication. When you sign in, Google shares your email and basic profile with us. Google's use of this information is governed by their Privacy Policy.
                  </p>
                  <a 
                    href="https://policies.google.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
                  >
                    View Google Privacy Policy
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                <div className="bg-white/5 border border-white/20 rounded-xl p-5 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Google Apps Script</h3>
                  <p className="text-gray-400 mb-3">
                    EGDesk uses Google Apps Script to create and run MCP servers. When using this feature:
                  </p>
                  <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span>MCP server <strong className="text-white">code</strong> runs on Google's infrastructure under your account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span>MCP <strong className="text-white">data</strong> can be stored on your PC and/or your Google account (Sheets, Drive, etc.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span>EGDesk <strong className="text-white">does not collect</strong> your data — it remains in your PC or Google account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span>Data in your Google account is governed by Google's Terms of Service</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/5 border border-white/20 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-white mb-2">Open Source LLMs</h3>
                  <p className="text-gray-400">
                    EGDesk supports various open-source language models that run locally on your machine. These models do not transmit data externally. Each model has its own license; please review the respective licenses for any models you download and use.
                  </p>
                </div>

              </div>
            </div>

            {/* Data Security */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-sm">7</span>
                Data Security
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p>
                  The best security is not having data to protect in the first place. Since your data never leaves your computer, you maintain complete control over its security.
                </p>
                <p><strong className="text-white">For the limited data we do handle:</strong></p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Encrypted connections (HTTPS/TLS) for all communications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Secure authentication via Google OAuth 2.0</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Temporary session tokens that expire automatically</span>
                  </li>
                </ul>
                <p className="mt-4">
                  <strong className="text-white">Your responsibility:</strong> You are responsible for securing your own computer, 
                  maintaining backups, protecting your Google account credentials, and managing permissions for any 
                  Google resources used by Apps Script MCP servers.
                </p>
              </div>
            </div>

            {/* Data Retention */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm">8</span>
                Data Retention
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p><strong className="text-white">Local Data:</strong></p>
                <p className="ml-4 text-gray-400">
                  Your local data is retained as long as you keep it. We have no control over it. Delete files from your PC whenever you want.
                </p>
                
                <p><strong className="text-white">Google Account Data (Apps Script MCP):</strong></p>
                <p className="ml-4 text-gray-400">
                  Data stored in your Google account via Apps Script is retained according to your own Google settings. 
                  We do not collect or store this data. Manage it directly in your Google Drive, Sheets, or Docs.
                </p>

                <p><strong className="text-white">Account Information:</strong></p>
                <p className="ml-4 text-gray-400">
                  We retain your email and basic profile information as long as your account is active. If you delete your account, we will remove this information within 30 days.
                </p>

                <p><strong className="text-white">Technical Logs:</strong></p>
                <p className="ml-4 text-gray-400">
                  Anonymous error logs are retained for up to 90 days for debugging purposes, then automatically deleted.
                </p>
              </div>
            </div>

            {/* Your Rights */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-sm">9</span>
                Your Rights
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p>You have the right to:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong className="text-white">Access</strong> — Request a copy of the personal data we hold about you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong className="text-white">Correction</strong> — Request correction of inaccurate information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong className="text-white">Deletion</strong> — Request deletion of your account and associated data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span><strong className="text-white">Portability</strong> — Receive your data in a portable format</span>
                  </li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact us at <a href="mailto:m8chaa@gmail.com" className="text-blue-400 hover:text-blue-300 underline">m8chaa@gmail.com</a>. We will respond within 30 days.
                </p>
              </div>
            </div>

            {/* Children's Privacy */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-sm">10</span>
                Children's Privacy
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p>
                  EGDesk is not intended for children under the age of 14. We do not knowingly collect personal information from children under 14. If you believe a child has provided us with personal information, please contact us immediately.
                </p>
              </div>
            </div>

            {/* Changes to Policy */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-sm">11</span>
                Changes to This Policy
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p>
                  We may update this Privacy Policy from time to time. When we make significant changes, we will notify you via email or through the Service. The "Last Updated" date at the top reflects when the policy was last revised.
                </p>
                <p>
                  Your continued use of EGDesk after changes are posted constitutes acceptance of the updated Privacy Policy.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center text-sm">12</span>
                Contact Us
              </h2>
              <div className="text-gray-300 pl-11">
                <p className="mb-4">
                  If you have questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="bg-white/5 border border-white/20 rounded-xl p-6">
                  <p className="text-xl font-bold text-white mb-4">QUUS</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>경기도 시흥시 서울대학로 59-69 배곧테크노밸리 609호</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>사업자등록번호: 731-81-02023</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>대표자: 차민수</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href="mailto:m8chaa@gmail.com" className="text-blue-400 hover:text-blue-300 underline">m8chaa@gmail.com</a>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>010-7923-5071</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/tos"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              Terms of Service
            </Link>
            <Link 
              href="/landing"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              Back to Home
            </Link>
            <a 
              href="https://github.com/minseochh02/egdesk-scratch"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="container mx-auto text-center text-gray-400">
          <p>&copy; 2025 EGDesk by QUUS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}