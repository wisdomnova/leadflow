// ./app/components/landing/AnalyticsDashboard.tsx
'use client'

import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Mail, 
  Eye, 
  MousePointer, 
  Users,
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react'

export default function AnalyticsDashboard() {
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
              <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
              <p className="text-gray-600 mt-1">Track your campaign performance and optimize your outreach</p>
            </div>
            <div className="flex items-center space-x-4">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
              <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="p-8 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-6">
            {/* Total Emails */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Emails</p>
                  <p className="text-2xl font-bold text-gray-900">12,847</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">+12.5% from last period</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Opens */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Opens</p>
                  <p className="text-2xl font-bold text-gray-900">4,394</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">+2.5% from last period</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Clicks */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <MousePointer className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">1,118</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">+1.2% from last period</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Replies */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Replies</p>
                  <p className="text-2xl font-bold text-gray-900">1,593</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">+3.1% from last period</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="p-8 grid grid-cols-2 gap-8">
          
          {/* Performance Trends Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
            
            {/* Chart Legend */}
            <div className="flex items-center space-x-6 mb-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-gray-600">Emails Sent</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span className="text-gray-600">Opens</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                <span className="text-gray-600">Clicks</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                <span className="text-gray-600">Replies</span>
              </div>
            </div>

            {/* Mock Chart Area */}
            <div className="h-64 bg-gray-50 rounded-lg border border-gray-200 relative">
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 p-4">
                <div className="h-full w-full">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-2">
                    <span>700</span>
                    <span>600</span>
                    <span>500</span>
                    <span>400</span>
                    <span>300</span>
                    <span>200</span>
                    <span>100</span>
                    <span>0</span>
                  </div>
                  
                  {/* X-axis labels */}
                  <div className="absolute bottom-0 left-8 right-4 flex justify-between text-xs text-gray-500">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>

                  {/* Mock Chart Lines */}
                  <svg className="absolute inset-8 w-auto h-auto" viewBox="0 0 300 200">
                    {/* Emails Sent Line */}
                    <path
                      d="M 0,80 L 50,100 L 100,60 L 150,40 L 200,70 L 250,110 L 300,120"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      fill="none"
                      className="opacity-80"
                    />
                    {/* Opens Line */}
                    <path
                      d="M 0,140 L 50,150 L 100,120 L 150,110 L 200,130 L 250,160 L 300,170"
                      stroke="#10B981"
                      strokeWidth="3"
                      fill="none"
                      className="opacity-80"
                    />
                    {/* Clicks Line */}
                    <path
                      d="M 0,170 L 50,175 L 100,160 L 150,155 L 200,165 L 250,180 L 300,185"
                      stroke="#F59E0B"
                      strokeWidth="3"
                      fill="none"
                      className="opacity-80"
                    />
                    {/* Replies Line */}
                    <path
                      d="M 0,150 L 50,160 L 100,135 L 150,125 L 200,140 L 250,170 L 300,175"
                      stroke="#8B5CF6"
                      strokeWidth="3"
                      fill="none"
                      className="opacity-80"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Status Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Status</h3>
            
            {/* Pie Chart */}
            <div className="h-64 flex items-center justify-center relative">
              <svg width="200" height="200" className="transform -rotate-90">
                {/* Active - 40% */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="20"
                  strokeDasharray="201 502"
                  strokeDashoffset="0"
                />
                {/* Completed - 35% */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="20"
                  strokeDasharray="175 502"
                  strokeDashoffset="-201"
                />
                {/* Paused - 15% */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="20"
                  strokeDasharray="75 502"
                  strokeDashoffset="-376"
                />
                {/* Draft - 10% */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="20"
                  strokeDasharray="50 502"
                  strokeDashoffset="-451"
                />
              </svg>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Active</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Paused</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Draft</span>
              </div>
            </div>
          </div>
        </div>

        {/* Best Times Chart */}
        <div className="p-8 border-t border-gray-200">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Times to Send</h3>
            
            {/* Chart Legend */}
            <div className="flex items-center space-x-6 mb-6 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-gray-600">Open Rate %</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span className="text-gray-600">Click Rate %</span>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="h-48 bg-gray-50 rounded-lg border border-gray-200 relative">
              <div className="absolute inset-0 p-4">
                <div className="h-full w-full">
                  {/* Y-axis */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-2">
                    <span>45</span>
                    <span>40</span>
                    <span>35</span>
                    <span>30</span>
                    <span>25</span>
                    <span>20</span>
                    <span>15</span>
                    <span>0</span>
                  </div>
                  
                  {/* X-axis */}
                  <div className="absolute bottom-0 left-8 right-4 flex justify-between text-xs text-gray-500">
                    <span>6 AM</span>
                    <span>8 AM</span>
                    <span>10 AM</span>
                    <span>12 PM</span>
                    <span>2 PM</span>
                    <span>4 PM</span>
                    <span>6 PM</span>
                    <span>8 PM</span>
                  </div>

                  {/* Bars */}
                  <div className="absolute inset-8 flex items-end justify-between">
                    <div className="flex space-x-1">
                      <div className="w-4 h-8 bg-blue-500 opacity-80"></div>
                      <div className="w-4 h-4 bg-green-500 opacity-80"></div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-4 h-16 bg-blue-500 opacity-80"></div>
                      <div className="w-4 h-8 bg-green-500 opacity-80"></div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-4 h-32 bg-blue-500 opacity-80"></div>
                      <div className="w-4 h-20 bg-green-500 opacity-80"></div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-4 h-24 bg-blue-500 opacity-80"></div>
                      <div className="w-4 h-12 bg-green-500 opacity-80"></div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-4 h-28 bg-blue-500 opacity-80"></div>
                      <div className="w-4 h-16 bg-green-500 opacity-80"></div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-4 h-20 bg-blue-500 opacity-80"></div>
                      <div className="w-4 h-10 bg-green-500 opacity-80"></div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-4 h-12 bg-blue-500 opacity-80"></div>
                      <div className="w-4 h-6 bg-green-500 opacity-80"></div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-4 h-6 bg-blue-500 opacity-80"></div>
                      <div className="w-4 h-3 bg-green-500 opacity-80"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}