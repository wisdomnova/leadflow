// ./app/components/landing/CampaignManagement.tsx
'use client'

import { motion } from 'framer-motion'
import { 
  Mail, 
  Search, 
  Filter, 
  Plus,
  Play,
  Pause,
  Eye,
  Users,
  BarChart3,
  Calendar,
  TrendingUp,
  Grid3X3,
  List
} from 'lucide-react'

export default function CampaignManagement() {
  return (
    <motion.div 
      className="relative w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Campaigns</h2>
              <p className="text-gray-600 mt-1">Create and manage your email marketing campaigns</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="p-8 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-6">
            {/* Total Campaigns */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
              </div>
            </div>

            {/* Active Campaigns */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
              </div>
            </div>

            {/* Total Recipients */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </div>

            {/* Avg. Open Rate */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Open Rate</p>
                  <p className="text-2xl font-bold text-gray-900">33.3%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search campaigns..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <select className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900">
                <option>All Status</option>
                <option>Active</option>
                <option>Paused</option>
                <option>Draft</option>
              </select>
              <div className="flex items-center space-x-2 border border-gray-300 rounded-lg p-1">
                <button className="p-2 bg-blue-100 text-blue-600 rounded">
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400">
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-gray-600">2 of 2 campaigns</div>
            </div>
          </div>
        </div>

        {/* Campaign Cards */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-6">
            
            {/* Campaign 1 - Draft */}
            <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-600">Draft</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sales Follow-up</h3>
              <p className="text-gray-600 mb-6">Professional follow-up sequence for sales prospects</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Recipients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0%</div>
                  <div className="text-sm text-gray-600">Open Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0%</div>
                  <div className="text-sm text-gray-600">Click Rate</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Created 30/08/2025
                </div>
                <div className="flex items-center space-x-2">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center">
                    <Play className="w-4 h-4 mr-1" />
                    Launch
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                </div>
              </div>
            </div>

            {/* Campaign 2 - Sending */}
            <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-green-600">Sending</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome Series</h3>
              <p className="text-gray-600 mb-6">Onboard new customers with a warm welcome sequence</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">3</div>
                  <div className="text-sm text-gray-600">Recipients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">66.7%</div>
                  <div className="text-sm text-gray-600">Open Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0.0%</div>
                  <div className="text-sm text-gray-600">Click Rate</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Created 30/08/2025
                </div>
                <div className="flex items-center space-x-2">
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors flex items-center">
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}