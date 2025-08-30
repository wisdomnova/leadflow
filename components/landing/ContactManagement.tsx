// ./app/components/landing/ContactManagement.tsx
'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical,
  Building,
  Mail,
  Phone,
  Calendar,
  Trash2
} from 'lucide-react'

export default function ContactManagement() {
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
              <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
              <p className="text-gray-600 mt-1">Manage your contact database and import new leads</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center">
                📊 Export All
              </button>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
                📥 Import Contacts
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="p-8 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-6">
            {/* Total Contacts */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </div>

            {/* Active */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </div>

            {/* Unsubscribed */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unsubscribed</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>

            {/* Bounced */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bounced</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
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
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <select className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900">
                <option>All Status</option>
                <option>Active</option>
                <option>Unsubscribed</option>
                <option>Bounced</option>
              </select>
              <div className="text-sm text-gray-600">3 of 3 contacts</div>
            </div>
          </div>
        </div>

        {/* Contact List */}
        <div className="p-8">
          <div className="overflow-hidden">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 py-4 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div className="col-span-1">
                <input type="checkbox" className="w-4 h-4 text-blue-600" />
              </div>
              <div className="col-span-3">CONTACT</div>
              <div className="col-span-3">COMPANY</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-2">ADDED</div>
              <div className="col-span-1"></div>
            </div>

            {/* Contact Rows */}
            <div className="space-y-4 mt-4">
              
              {/* Contact 1 */}
              <div className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="col-span-1">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      M
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Michael Smith</div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        sparktechnologies2021@gmail.com
                      </div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        +234801234567B
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center">
                    <Building className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900">Spark Technologies</div>
                      <div className="text-sm text-gray-600">Software Engineer</div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                
                <div className="col-span-2 text-sm text-gray-600">
                  29/08/2025
                </div>
                
                <div className="col-span-1">
                  <button className="text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact 2 */}
              <div className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="col-span-1">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      J
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Jack Kingsley</div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        jack_kingsley_@outlook.com
                      </div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        +234809876543Z
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center">
                    <Building className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900">Kingsley Holdings</div>
                      <div className="text-sm text-gray-600">Product Manager</div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                
                <div className="col-span-2 text-sm text-gray-600">
                  29/08/2025
                </div>
                
                <div className="col-span-1">
                  <button className="text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact 3 */}
              <div className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="col-span-1">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      D
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">David Wisdom</div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        dev.davidwisdom@gmail.com
                      </div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        +234808123456?
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center">
                    <Building className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900">Freelance</div>
                      <div className="text-sm text-gray-600">Fullstack Developer</div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                
                <div className="col-span-2 text-sm text-gray-600">
                  29/08/2025
                </div>
                
                <div className="col-span-1">
                  <button className="text-red-500 hover:text-red-700 transition-colors">
                    <Trash2 className="w-4 h-4" />
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