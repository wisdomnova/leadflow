'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  Mail, 
  Send, 
  Eye,
  MessageCircle,
  ChevronDown
} from 'lucide-react'

export default function DashboardPreview() {
  return (
    <motion.div 
      className="relative w-full max-w-7xl mx-auto"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {/* Dashboard Container */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200" style={{ aspectRatio: '16/9' }}>
        
        {/* Header with Navigation */}
        <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Left - Logo & Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
                <span className="text-xl font-bold text-gray-900">LeadFlow</span>
              </div>
              <nav className="flex items-center space-x-8">
                <span className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">Analytics</span>
                <span className="text-gray-500">Campaigns</span>
                <span className="text-gray-500">Contacts</span>
                <span className="text-gray-500">Templates</span>
              </nav>
            </div>
            
            {/* Right - Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 bg-gray-50">
          
          {/* Stats Cards Row */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Contacted */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">CONTACTED</p>
                  <p className="text-3xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </div>

            {/* Opened */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">OPENED</p>
                  <p className="text-3xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </div>

            {/* Replied */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">REPLIED</p>
                  <p className="text-3xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </div>

            {/* Positive */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">POSITIVE</p>
                  <p className="text-3xl font-bold text-gray-900">2</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="bg-white rounded-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-gray-600">Last 7 Days</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-80 bg-gray-50 rounded-xl border border-gray-200 relative overflow-hidden">
              {/* Chart Background Grid */}
              <div className="absolute inset-0 p-6">
                {/* Y-axis labels */}
                <div className="absolute left-4 top-6 bottom-12 flex flex-col justify-between text-sm text-gray-400">
                  <span>12</span>
                  <span>9</span>
                  <span>6</span>
                  <span>3</span>
                  <span>0</span>
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-4 left-16 right-6 flex justify-between text-sm text-gray-400">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>

                {/* Stacked Area Chart */}
                <div className="absolute inset-16 bottom-12">
                  <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                    {/* Contacted (Blue) */}
                    <path
                      d="M 0,160 L 60,140 L 120,120 L 180,100 L 240,90 L 300,110 L 360,120 L 400,130 L 400,200 L 0,200 Z"
                      fill="#3B82F6"
                      opacity="0.8"
                    />
                    {/* Opened (Green) */}
                    <path
                      d="M 0,160 L 60,150 L 120,140 L 180,130 L 240,120 L 300,140 L 360,145 L 400,150 L 400,200 L 0,200 Z"
                      fill="#10B981"
                      opacity="0.8"
                    />
                    {/* Replied (Yellow) */}
                    <path
                      d="M 0,170 L 60,165 L 120,160 L 180,155 L 240,150 L 300,165 L 360,170 L 400,175 L 400,200 L 0,200 Z"
                      fill="#F59E0B"
                      opacity="0.8"
                    />
                    {/* Positive (Orange) */}
                    <path
                      d="M 0,180 L 60,175 L 120,170 L 180,165 L 240,160 L 300,175 L 360,180 L 400,185 L 400,200 L 0,200 Z"
                      fill="#EF4444"
                      opacity="0.8"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-center space-x-8 mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Contacted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Opened</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Positive</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Replied</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}