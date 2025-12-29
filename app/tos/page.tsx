import Link from 'next/link';
import Image from 'next/image';

export default function TermsOfService() {
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
            Terms of Service
          </h1>
          <p className="text-gray-400">
            Last Updated: December 29, 2025
          </p>
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
                  Welcome to EGDesk. These Terms of Service ("Terms") govern your use of the EGDesk desktop application and web interface (collectively, the "Service") provided by QUUS ("Company," "we," "us," or "our").
                </p>
                <p>
                  By downloading, installing, or using EGDesk, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
                </p>
              </div>
            </div>

            {/* Service Description */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-sm">2</span>
                Service Description
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p>
                  EGDesk is a two-part system that transforms your personal computer into:
                </p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>An MCP (Model Context Protocol) server for AI integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>A local LLM server running open-source AI models</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>A web interface accessible via Google OAuth authentication</span>
                  </li>
                </ul>
                <p>
                  The Service is currently provided <strong className="text-white">free of charge</strong> and is available as open-source software.
                </p>
              </div>
            </div>

            {/* Privacy & Data */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-sm">3</span>
                Privacy & Data Handling
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-4">
                  <p className="text-green-300 font-semibold mb-2">🔒 Your Data Stays Local</p>
                  <p>
                    EGDesk is designed with privacy as a core principle. All your data, files, conversations, and AI processing occur entirely on your local PC. We do not store, collect, or have access to your personal data.
                  </p>
                </div>
                <p><strong className="text-white">What we DO NOT collect:</strong></p>
                <ul className="space-y-1 ml-4 text-gray-400">
                  <li>• Your files or documents</li>
                  <li>• AI conversations or prompts</li>
                  <li>• LLM outputs or model data</li>
                  <li>• Any content processed through EGDesk</li>
                </ul>
                <p><strong className="text-white">What we DO use:</strong></p>
                <ul className="space-y-1 ml-4 text-gray-400">
                  <li>• Google OAuth for authentication (email for account identification only)</li>
                  <li>• Connection data to facilitate remote access between your devices</li>
                </ul>
              </div>
            </div>

            {/* User Responsibilities */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-sm">4</span>
                User Responsibilities
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p>By using EGDesk, you agree to:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">▸</span>
                    <span>Use the Service in compliance with all applicable laws and regulations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">▸</span>
                    <span>Not use the Service for any illegal, harmful, or malicious purposes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">▸</span>
                    <span>Maintain the security of your Google account credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">▸</span>
                    <span>Not attempt to reverse engineer, hack, or compromise the Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">▸</span>
                    <span>Not use the Service to distribute malware, spam, or harmful content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">▸</span>
                    <span>Respect intellectual property rights when using AI models</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Account Suspension */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex items-center justify-center text-sm">5</span>
                Account Suspension & Termination
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p>
                  We reserve the right to suspend or terminate your access to EGDesk under the following circumstances:
                </p>
                
                <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 space-y-3">
                  <p className="text-red-300 font-semibold">Grounds for Suspension:</p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span>
                      <span>Violation of these Terms of Service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span>
                      <span>Use of the Service for illegal activities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span>
                      <span>Attempts to compromise system security or integrity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span>
                      <span>Abuse of the Service that affects other users</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">✕</span>
                      <span>Distribution of harmful, illegal, or offensive content</span>
                    </li>
                  </ul>
                </div>

                <p><strong className="text-white">Suspension Process:</strong></p>
                <ol className="space-y-2 ml-4">
                  <li><span className="text-blue-400">1.</span> <strong>Warning:</strong> For minor violations, we will issue a warning via email with details of the violation.</li>
                  <li><span className="text-blue-400">2.</span> <strong>Temporary Suspension:</strong> Repeated or moderate violations may result in temporary suspension (7-30 days).</li>
                  <li><span className="text-blue-400">3.</span> <strong>Permanent Termination:</strong> Severe violations or continued misconduct will result in permanent account termination.</li>
                </ol>

                <p><strong className="text-white">Appeal Process:</strong></p>
                <p>
                  If you believe your account was suspended in error, you may contact us at <a href="mailto:m8chaa@gmail.com" className="text-blue-400 hover:text-blue-300 underline">m8chaa@gmail.com</a> within 14 days of suspension. We will review your case and respond within 7 business days.
                </p>

                <p><strong className="text-white">Effect of Termination:</strong></p>
                <p>
                  Since all data is stored locally on your PC, account termination only affects your ability to use the web interface for remote access. Your local data and desktop application functionality remain unaffected.
                </p>
              </div>
            </div>

            {/* Third-Party Services */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center text-sm">6</span>
                Third-Party Services & Open Source
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p><strong className="text-white">Google OAuth:</strong></p>
                <p>
                  EGDesk uses Google OAuth for authentication. By using our Service, you also agree to Google's Terms of Service and Privacy Policy. We only access your basic profile information (email) for account identification.
                </p>
                
                <p><strong className="text-white">Open Source LLMs:</strong></p>
                <p>
                  EGDesk supports various open-source large language models. Each model may have its own license terms. You are responsible for complying with the respective licenses of any AI models you choose to run locally.
                </p>

                <p><strong className="text-white">Open Source Nature:</strong></p>
                <p>
                  EGDesk is currently available as open-source software. You may view, modify, and contribute to the source code in accordance with the applicable open-source license available in our GitHub repository.
                </p>
              </div>
            </div>

            {/* Disclaimer & Liability */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-gray-500 to-slate-500 rounded-lg flex items-center justify-center text-sm">7</span>
                Disclaimer & Limitation of Liability
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                  <p className="text-white font-semibold mb-2">Service Provided "As Is"</p>
                  <p className="text-gray-400">
                    EGDesk is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
                  </p>
                </div>

                <p><strong className="text-white">We are NOT liable for:</strong></p>
                <ul className="space-y-1 ml-4 text-gray-400">
                  <li>• Data loss on your local machine (all data is stored locally by you)</li>
                  <li>• Interruptions in service availability</li>
                  <li>• Actions of third-party AI models</li>
                  <li>• Any damages resulting from your use of the Service</li>
                  <li>• Security breaches on your local machine</li>
                </ul>

                <p><strong className="text-white">Support:</strong></p>
                <p>
                  While we do not handle your data, we are committed to helping users with technical issues. If you encounter problems, please contact us and we will provide support to the best of our ability.
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-sm">8</span>
                Changes to Terms
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p>
                  We may update these Terms from time to time. When we make significant changes, we will notify users via email or through the Service. Your continued use of EGDesk after changes are posted constitutes acceptance of the updated Terms.
                </p>
                <p>
                  We encourage you to review these Terms periodically for any updates.
                </p>
              </div>
            </div>

            {/* Governing Law */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-teal-500 to-green-500 rounded-lg flex items-center justify-center text-sm">9</span>
                Governing Law
              </h2>
              <div className="text-gray-300 space-y-4 pl-11">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the Republic of Korea. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts of the Republic of Korea.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-sm">10</span>
                Contact Information
              </h2>
              <div className="text-gray-300 pl-11">
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
              href="/privacy"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              Privacy Policy
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