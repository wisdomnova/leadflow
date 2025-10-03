// app/(dashboard)/inbox/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { useInboxStore } from '@/store/useInboxStore'
import { trackEvent } from '@/components/analytics/GoogleAnalytics'
import { 
  Inbox,
  Mail,
  Search,
  Filter,
  Archive,
  Star,
  StarOff,
  MoreHorizontal,
  Reply,
  Forward,
  Trash2,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  MessageSquare,
  Users,
  Calendar,
  Activity,
  Zap,
  Settings,
  Plus,
  ArrowUpRight,
  Clock,
  Send,
  MousePointer,
  Sparkles,
  TrendingUp,
  Globe,
  Brain,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Minus,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

// AI Classification Badge Component
const AIClassificationBadge = ({ classification }: { classification: any }) => {
  if (!classification) return null

  const getIntentConfig = (intent: string) => {
    switch (intent) {
      case 'interested':
        return { color: THEME_COLORS.success, icon: ThumbsUp, label: 'Interested', bg: 'bg-green-100' }
      case 'not_interested':
        return { color: THEME_COLORS.warning, icon: ThumbsDown, label: 'Not Interested', bg: 'bg-red-100' }
      case 'objection':
        return { color: '#f59e0b', icon: AlertCircle, label: 'Objection', bg: 'bg-yellow-100' }
      case 'question':
        return { color: THEME_COLORS.secondary, icon: HelpCircle, label: 'Question', bg: 'bg-blue-100' }
      case 'auto_reply':
        return { color: '#6b7280', icon: Bot, label: 'Auto Reply', bg: 'bg-gray-100' }
      case 'complaint':
        return { color: THEME_COLORS.warning, icon: XCircle, label: 'Complaint', bg: 'bg-red-100' }
      default:
        return { color: '#6b7280', icon: Minus, label: 'Neutral', bg: 'bg-gray-100' }
    }
  }

  const intentConfig = getIntentConfig(classification.intent)
  const Icon = intentConfig.icon

  return (
    <div className="flex items-center space-x-2">
      <span 
        className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium text-white`}
        style={{ backgroundColor: intentConfig.color }}
      >
        <Icon className="h-3 w-3 mr-1" />
        {intentConfig.label}
      </span>
      
      {classification.priority === 'high' && (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          High Priority
        </span>
      )}
      
      {classification.requires_human_attention && (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-800">
          <Brain className="h-3 w-3 mr-1" />
          Needs Attention
        </span>
      )}
    </div>
  )
}

// Message Type Badge Component
const MessageTypeBadge = ({ type }: { type: 'reply' | 'forward' | 'new' }) => {
  const configs = {
    reply: { color: THEME_COLORS.success, icon: Reply, label: 'Reply' },
    forward: { color: THEME_COLORS.secondary, icon: Forward, label: 'Forward' },
    new: { color: THEME_COLORS.accent, icon: Mail, label: 'New' }
  }
  
  const config = configs[type]
  const Icon = config.icon
  
  return (
    <span 
      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-white"
      style={{ backgroundColor: config.color }}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  )
}

// Updated Message Card Component with AI Classification
const MessageCard = ({ 
  message, 
  isSelected, 
  onSelect, 
  onToggleRead, 
  onToggleStar, 
  onArchive,
  onReply,
  onReclassify
}: {
  message: any
  isSelected: boolean
  onSelect: () => void
  onToggleRead: () => void
  onToggleStar: () => void
  onArchive: () => void
  onReply: () => void
  onReclassify: () => void
}) => {
  const [showActions, setShowActions] = useState(false)
  const [showAIDetails, setShowAIDetails] = useState(false)
  const [isReclassifying, setIsReclassifying] = useState(false)
  
  const handleReclassify = async () => {
    setIsReclassifying(true)
    try {
      await onReclassify()
    } finally {
      setIsReclassifying(false)
    }
  }
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={clsx(
        "border rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-md group",
        message.is_read ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 shadow-sm",
        isSelected && "ring-2 ring-opacity-50",
        isSelected && { ring: THEME_COLORS.primary }
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start space-x-4">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="mt-1"
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5" style={{ color: THEME_COLORS.primary }} />
          ) : (
            <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>

        {/* Message Avatar */}
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
          style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
        >
          <Mail className="h-6 w-6" style={{ color: THEME_COLORS.primary }} />
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-3">
              <h3 className={clsx(
                "text-lg font-semibold truncate",
                message.is_read ? "text-gray-700" : "text-gray-900"
              )}>
                {message.from_name || message.from_email}
              </h3>
              <MessageTypeBadge type={message.message_type} />
              {!message.is_read && (
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: THEME_COLORS.primary }}
                />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {new Date(message.received_at).toLocaleDateString()}
              </span>
              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center space-x-1"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleStar()
                      }}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {message.is_starred ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleRead()
                      }}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {message.is_read ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onArchive()
                      }}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Archive className="h-4 w-4 text-gray-400" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mb-3">
            <h4 className={clsx(
              "text-base font-medium mb-1",
              message.is_read ? "text-gray-600" : "text-gray-900"
            )}>
              {message.subject}
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {message.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
            </p>
          </div>

          {/* *** NEW: AI Classification Display *** */}
          {message.message_classifications && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">AI Analysis</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    {Math.round(message.message_classifications.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReclassify()
                    }}
                    disabled={isReclassifying}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center"
                  >
                    <RefreshCw className={clsx("h-3 w-3 mr-1", isReclassifying && "animate-spin")} />
                    {isReclassifying ? 'Reclassifying...' : 'Reclassify'}
                  </button>
                  <button
                    onClick={() => setShowAIDetails(!showAIDetails)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showAIDetails ? 'Hide' : 'Show'} Details
                  </button>
                </div>
              </div>
              
              <AIClassificationBadge classification={message.message_classifications} />
              
              {showAIDetails && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-blue-200"
                >
                  {message.message_classifications.reasoning && (
                    <p className="text-xs text-blue-800 mb-2">
                      <span className="font-medium">Reasoning:</span> {message.message_classifications.reasoning}
                    </p>
                  )}
                  {message.message_classifications.suggested_response && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-blue-900 mb-1">Suggested Response:</p>
                      <p className="text-xs text-blue-800 bg-blue-100 p-2 rounded-lg">
                        {message.message_classifications.suggested_response}
                      </p>
                    </div>
                  )}
                  {message.message_classifications.next_action !== 'no_action' && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-blue-900">Next Action: </span>
                      <span className="text-xs text-blue-800 capitalize">
                        {message.message_classifications.next_action.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  {message.message_classifications.tags && message.message_classifications.tags.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-blue-900">Tags: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {message.message_classifications.tags.slice(0, 5).map((tag: string, index: number) => (
                          <span key={index} className="text-xs bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Message Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {message.campaigns && (
                <span className="flex items-center">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {message.campaigns.name}
                </span>
              )}
              {message.contacts && (
                <span className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {message.contacts.company || 'No company'}
                </span>
              )}
              {message.confidence_score && (
                <span className="flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {Math.round(message.confidence_score * 100)}% confidence
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onReply()
              }}
              className="inline-flex items-center px-3 py-1.5 text-white rounded-xl hover:shadow-md text-xs font-medium transition-all"
              style={{ backgroundColor: THEME_COLORS.primary }}
            >
              <Reply className="h-3 w-3 mr-1.5" />
              Reply
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Enhanced Inbox Stats Component with AI insights
const InboxStats = ({ messages, analytics }: { messages: any[], analytics: any }) => {
  const basicStats = [
    {
      label: 'Total Messages',
      value: messages.length,
      icon: Mail,
      color: THEME_COLORS.primary
    },
    {
      label: 'Unread',
      value: messages.filter(m => !m.is_read).length,
      icon: Activity,
      color: THEME_COLORS.success
    },
    {
      label: 'High Priority',
      value: messages.filter(m => m.message_classifications?.priority === 'high').length,
      icon: AlertCircle,
      color: THEME_COLORS.warning
    },
    {
      label: 'Needs Attention',
      value: messages.filter(m => m.message_classifications?.requires_human_attention).length,
      icon: Brain,
      color: THEME_COLORS.secondary
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {basicStats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-105"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: stat.color }}
              >
                <Icon className="h-7 w-7 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">{stat.label}</h3>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function InboxPage() {
  const { user } = useAuthStore()
  const {
    messages,
    loading,
    filter,
    intentFilter,
    sentimentFilter,
    selectedMessages,
    currentView,
    analytics,
    fetchMessages,
    fetchAnalytics,
    reclassifyMessage,
    setFilter,
    setIntentFilter,
    setSentimentFilter,
    setCurrentView,
    toggleMessageSelection,
    clearSelection,
    selectAll,
    markAsRead,
    archiveMessages,
    subscribeToRealtime,
    unsubscribeFromRealtime
  } = useInboxStore()

  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user?.organization_id) {
      fetchMessages(user.organization_id)
      fetchAnalytics(user.organization_id)
      subscribeToRealtime(user.organization_id)
      
      // Track page view
      trackEvent('page_view', 'inbox', 'inbox_page')
    }

    return () => {
      unsubscribeFromRealtime()
    }
  }, [user?.organization_id, filter, intentFilter, sentimentFilter, fetchMessages, fetchAnalytics, subscribeToRealtime, unsubscribeFromRealtime])

  const handleBulkAction = async (action: 'read' | 'archive' | 'star') => {
    if (selectedMessages.length === 0 || !user?.organization_id) return
    
    try {
      if (action === 'read') {
        await markAsRead(selectedMessages, user.organization_id)
        trackEvent('bulk_action', 'inbox', 'mark_read', selectedMessages.length)
      } else if (action === 'archive') {
        await archiveMessages(selectedMessages, user.organization_id)
        trackEvent('bulk_action', 'inbox', 'archive', selectedMessages.length)
      }
      
      clearSelection()
    } catch (error) {
      console.error(`Failed to ${action} messages:`, error)
    }
  }

  const handleReply = (message: any) => {
    // Track reply action
    trackEvent('reply_click', 'inbox', message.id)
    
    // TODO: Implement reply functionality in Milestone 3
    console.log('Reply to message:', message.id)
    alert('Reply functionality will be available in the next update!')
  }

  const handleReclassify = async (messageId: string) => {
    if (!user?.organization_id) return
    
    try {
      await reclassifyMessage(messageId, user.organization_id)
      trackEvent('reclassify_message', 'inbox', messageId)
    } catch (error) {
      console.error('Failed to reclassify message:', error)
    }
  }

  const filteredMessages = messages.filter(message => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        message.subject.toLowerCase().includes(query) ||
        message.content.toLowerCase().includes(query) ||
        message.from_email.toLowerCase().includes(query) ||
        message.from_name?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const filterOptions = [
    { value: 'all', label: 'All Messages', icon: Mail },
    { value: 'unread', label: 'Unread', icon: Activity },
    { value: 'starred', label: 'Starred', icon: Star },
    { value: 'high_priority', label: 'High Priority', icon: AlertCircle },
    { value: 'requires_attention', label: 'Needs Attention', icon: Brain },
    { value: 'archived', label: 'Archived', icon: Archive }
  ]

  const intentOptions = [
    { value: 'all', label: 'All Intents' },
    { value: 'interested', label: 'Interested' },
    { value: 'not_interested', label: 'Not Interested' },
    { value: 'objection', label: 'Objection' },
    { value: 'question', label: 'Question' },
    { value: 'auto_reply', label: 'Auto Reply' },
    { value: 'complaint', label: 'Complaint' }
  ]

  const sentimentOptions = [
    { value: 'all', label: 'All Sentiments' },
    { value: 'positive', label: 'Positive' },
    { value: 'negative', label: 'Negative' },
    { value: 'neutral', label: 'Neutral' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="space-y-8">
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Unified Inbox</h1>
              <p className="mt-1 text-lg text-gray-600">
                Manage all your email replies with AI-powered classification
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/inbox/rules"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Rules
              </Link>
              <Link
                href="/campaigns/create"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Link>
              <button
                className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white hover:shadow-lg transition-all duration-200"
                style={{ backgroundColor: THEME_COLORS.primary }}
                onClick={() => {
                  if (user?.organization_id) {
                    fetchMessages(user.organization_id)
                    fetchAnalytics(user.organization_id)
                  }
                }}
              >
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Stats - Enhanced with AI insights */}
          <InboxStats messages={messages} analytics={analytics} />

          {/* Filters and Controls - Enhanced with AI filters */}
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col gap-4">
              {/* Main filters row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 shadow-sm"
                        style={{ 
                          '--tw-ring-color': THEME_COLORS.primary
                        } as any}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 overflow-x-auto">
                    {filterOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.value}
                          onClick={() => setFilter(option.value as any)}
                          className={clsx(
                            "inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                            filter === option.value
                              ? "text-white shadow-md"
                              : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                          )}
                          style={filter === option.value ? { backgroundColor: THEME_COLORS.primary } : {}}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* *** NEW: AI Classification Filters *** */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">AI Filters:</span>
                </div>
                
                <select
                  value={intentFilter}
                  onChange={(e) => setIntentFilter(e.target.value)}
                  className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  {intentOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <select
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value)}
                  className="px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  {sentimentOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                {(intentFilter !== 'all' || sentimentFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setIntentFilter('all')
                      setSentimentFilter('all')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear AI Filters
                  </button>
                )}
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4 mt-4"
              >
                <span className="text-sm text-gray-600">
                  {selectedMessages.length} message{selectedMessages.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleBulkAction('read')}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Mark Read
                  </button>
                  <button
                    onClick={() => handleBulkAction('archive')}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </button>
                  <button
                    onClick={clearSelection}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Messages List - Updated with AI classification support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {loading && messages.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: THEME_COLORS.primary }}></div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md"
                  style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                >
                  <Inbox className="h-8 w-8" style={{ color: THEME_COLORS.primary }} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {searchQuery ? 'No messages found' : 'Your inbox is empty'}
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {searchQuery 
                    ? 'Try adjusting your search terms or filters.'
                    : 'Email replies from your campaigns will appear here automatically with AI classification.'
                  }
                </p>
                {!searchQuery && (
                  <Link
                    href="/campaigns/create"
                    className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white hover:shadow-lg transition-all duration-200"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Campaign
                  </Link> 
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredMessages.map((message) => (
                    <MessageCard
                      key={message.id}
                      message={message}
                      isSelected={selectedMessages.includes(message.id)}
                      onSelect={() => toggleMessageSelection(message.id)}
                      onToggleRead={() => user?.organization_id && markAsRead([message.id], user.organization_id)}
                      onToggleStar={() => {
                        // TODO: Implement toggle star functionality
                        console.log('Toggle star:', message.id)
                      }}
                      onArchive={() => user?.organization_id && archiveMessages([message.id], user.organization_id)}
                      onReply={() => handleReply(message)}
                      onReclassify={() => handleReclassify(message.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}