'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">L</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Leadflow</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/signin"
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium transition shadow-lg hover:shadow-xl"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Manage Your Leads Like Never Before
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400">
                Leadflow is a powerful platform designed to help you manage, nurture, and convert your leads efficiently. Automate your workflow and accelerate your sales pipeline.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-semibold transition shadow-lg hover:shadow-xl text-center"
              >
                Get Started Free
              </Link>
              <Link
                href="/signin"
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 font-semibold transition text-center"
              >
                Sign In
              </Link>
            </div>

            {/* Features List */}
            <div className="space-y-3 pt-8">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Email campaigns and templates</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Contact management system</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Advanced analytics & reporting</span>
              </div>
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Affiliate program management</span>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-violet-400 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="h-12 bg-violet-400/30 rounded-lg"></div>
                  <div className="h-8 bg-violet-400/30 rounded-lg w-2/3"></div>
                  <div className="space-y-3 pt-6">
                    <div className="h-6 bg-violet-400/20 rounded"></div>
                    <div className="h-6 bg-violet-400/20 rounded"></div>
                    <div className="h-6 bg-violet-400/20 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 lg:mt-32">
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-violet-600 mb-2">10K+</div>
            <p className="text-gray-600 dark:text-gray-400">Active Users</p>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-violet-600 mb-2">500K+</div>
            <p className="text-gray-600 dark:text-gray-400">Leads Managed</p>
          </div>
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-violet-600 mb-2">98%</div>
            <p className="text-gray-600 dark:text-gray-400">Customer Satisfaction</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              © 2025 Leadflow. All rights reserved.
            </div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Privacy</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Terms</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
