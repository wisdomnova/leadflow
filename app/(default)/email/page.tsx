'use client'

import { useState } from 'react'

export default function EmailPage() {
  const [warmupPaused, setWarmupPaused] = useState(false)

  // Dummy data
  const provider = {
    type: 'Google Mail',
    status: 'Healthy',
    email: 'john@company.com',
    dailyLimit: 2000,
  }

  const warmup = {
    currentDay: 12,
    estimatedDays: 35,
    isPaused: warmupPaused,
  }

  const capacity = {
    currentDailyCapacity: 180,
    targetCapacity: 2000,
    progress: 34,
  }

  const health = {
    score: 87,
    rating: 'Excellent',
  }

  const metrics = [
    { label: 'Inbox Placement', value: '92%', change: '+3%', color: 'green' },
    { label: 'Domain Reputation', value: '85/100', change: '+5', color: 'green' },
    { label: 'Spam Rate', value: '0.2%', change: '-0.1%', color: 'green' },
    { label: 'Bounce Rate', value: '1.8%', change: '-0.5%', color: 'green' },
  ]

  const authentication = [
    { name: 'SPF', status: 'Passed' },
    { name: 'DKIM', status: 'Passed' },
    { name: 'DMARC', status: 'Passed' },
    { name: 'Blacklist', status: 'Clean' },
  ]

  const warmupActivityData = [
    { day: 'Day 1', sends: 50 },
    { day: 'Day 2', sends: 60 },
    { day: 'Day 3', sends: 70 },
    { day: 'Day 4', sends: 85 },
    { day: 'Day 6', sends: 110 },
    { day: 'Day 9', sends: 145 },
    { day: 'Day 12', sends: 180 },
  ]

  const maxSends = Math.max(...warmupActivityData.map(d => d.sends))

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Email Provider</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Email Provider Status Card */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{provider.type}</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">{provider.status}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Connected Email</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{provider.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Daily Limit</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{provider.dailyLimit.toLocaleString()} emails</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors">
              Settings
            </button>
            <button className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 font-medium text-sm transition-colors">
              Disconnect
            </button>
          </div>
        </div>

        {/* Warmup Progress */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Warmup Progress</h2>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Day <span className="font-bold">{warmup.currentDay}</span> of estimated <span className="font-bold">{warmup.estimatedDays}</span> days
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-violet-500 to-violet-600 h-2 rounded-full transition-all"
                style={{ width: `${(warmup.currentDay / warmup.estimatedDays) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setWarmupPaused(!warmupPaused)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                warmupPaused
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
              }`}
            >
              {warmupPaused ? 'Resume Warmup' : 'Pause Warmup'}
            </button>
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors">
              Restart
            </button>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="grid grid-cols-12 gap-6 mt-6">
        {/* Current Daily Capacity */}
        <div className="col-span-12 md:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">Current Daily Capacity</p>
            <div className="text-5xl font-bold text-violet-600 dark:text-violet-400 mb-2">{capacity.currentDailyCapacity}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">emails per day</p>
          </div>
        </div>

        {/* Target Capacity */}
        <div className="col-span-12 md:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">Target Capacity</p>
            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">{capacity.targetCapacity}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">emails per day</p>
          </div>
        </div>

        {/* Health Score */}
        <div className="col-span-12 md:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">Health Score</p>
            <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">{health.score}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">/100</p>
            <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
              {health.rating}
            </span>
          </div>
        </div>
      </div>

      {/* Warmup Speed */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Warmup Speed</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Conservative', time: '40-60 days' },
            { name: 'Moderate', time: '30-40 days', active: true },
            { name: 'Aggressive', time: '20-30 days' },
          ].map((speed, idx) => (
            <button
              key={idx}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                speed.active
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <p className={`font-bold ${speed.active ? 'text-violet-600 dark:text-violet-400' : 'text-gray-900 dark:text-white'}`}>
                {speed.name}
              </p>
              <p className={`text-sm ${speed.active ? 'text-violet-600 dark:text-violet-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {speed.time}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{metric.label}</p>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</div>
              <div className={`text-sm font-medium ${metric.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {metric.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warmup Activity Chart */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Warmup Activity</h2>
        <div className="flex items-end justify-between h-48 gap-2">
          {warmupActivityData.map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gradient-to-t from-violet-500 to-violet-400 rounded-t transition-all" style={{ height: `${(data.sends / maxSends) * 100}%` }}></div>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">{data.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Daily Sends</p>
        </div>
      </div>

      {/* Authentication Status */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Authentication</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {authentication.map((auth, idx) => (
            <div key={idx} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-2">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">{auth.name}</p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">{auth.status}</p>
            </div>
          ))}
        </div>
        <button className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors">
          Check Status
        </button>
      </div>
    </div>
  )
}
