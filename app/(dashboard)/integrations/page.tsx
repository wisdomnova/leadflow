// app/(dashboard)/integrations/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { trackEvent } from '@/components/analytics/GoogleAnalytics'
import { 
  Settings,
  Plus,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Activity,
  Users,
  Database,
  Zap,
  Calendar,
  TrendingUp,
  Globe,
  Sparkles,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

// Theme colors
const THEME_COLORS = {
  primary: '#0f66db',
  success: '#25b43d',
  secondary: '#6366f1',
  accent: '#059669',
  warning: '#dc2626'
}

interface Integration {
  id: string
  provider_id: string
  name: string
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  last_sync_at?: string
  total_synced_contacts: number
  total_synced_deals: number
  sync_settings: any
  integration_providers: {
    name: string
    display_name: string
    description: string
    logo_url: string
    auth_type: string
  }
}

interface SyncActivity {
  id: string
  activity_type: string
  status: string
  title: string
  description?: string
  created_at: string
  duration_ms?: number
  integration_providers: {
    display_name: string
  }
}

// Integration Card Component
const IntegrationCard = ({ 
  integration, 
  onConnect, 
  onDisconnect, 
  onTestConnection,
  isConnecting 
}: {
  integration: any
  onConnect: (provider: string) => void
  onDisconnect: (integrationId: string) => void
  onTestConnection: (integrationId: string) => void
  isConnecting: boolean
}) => {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      await onTestConnection(integration.id)
      setTestResult('success')
    } catch (error) {
      setTestResult('error')
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'connected':
        return { 
          color: THEME_COLORS.success, 
          icon: CheckCircle2, 
          label: 'Connected',
          bg: 'bg-green-100',
          text: 'text-green-800'
        }
      case 'error':
        return { 
          color: THEME_COLORS.warning, 
          icon: XCircle, 
          label: 'Error',
          bg: 'bg-red-100',
          text: 'text-red-800'
        }
      case 'syncing':
        return { 
          color: THEME_COLORS.secondary, 
          icon: RefreshCw, 
          label: 'Syncing',
          bg: 'bg-blue-100',
          text: 'text-blue-800'
        }
      default:
        return { 
          color: '#6b7280', 
          icon: AlertTriangle, 
          label: 'Not Connected',
          bg: 'bg-gray-100',
          text: 'text-gray-800'
        }
    }
  }

  const statusConfig = getStatusConfig(integration.status || 'disconnected')
  const StatusIcon = statusConfig.icon

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {integration.integration_providers?.display_name || integration.name}
            </h3>
            <p className="text-sm text-gray-600">
              {integration.integration_providers?.description || 'CRM Integration'}
            </p>
          </div>
        </div>
        
        <div className={clsx(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
          statusConfig.bg,
          statusConfig.text
        )}>
          <StatusIcon className={clsx(
            "h-3 w-3 mr-1",
            integration.status === 'syncing' && "animate-spin"
          )} />
          {statusConfig.label}
        </div>
      </div>

      {integration.status === 'connected' && (
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">Contacts</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {integration.total_synced_contacts || 0}
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Deals</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {integration.total_synced_deals || 0}
              </p>
            </div>
          </div>
          
          {integration.last_sync_at && (
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              Last sync: {new Date(integration.last_sync_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {integration.status === 'connected' ? (
            <>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </button>
              
              {testResult && (
                <span className={clsx(
                  "text-xs font-medium",
                  testResult === 'success' ? 'text-green-600' : 'text-red-600'
                )}>
                  {testResult === 'success' ? '✓ Working' : '✗ Failed'}
                </span>
              )}
            </>
          ) : (
            <button
              onClick={() => onConnect(integration.integration_providers?.name)}
              disabled={isConnecting}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white hover:shadow-md transition-all disabled:opacity-50"
              style={{ backgroundColor: THEME_COLORS.primary }}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Connect
            </button>
          )}
        </div>

        {integration.status === 'connected' && (
          <button
            onClick={() => onDisconnect(integration.id)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
          >
            <X className="h-4 w-4 mr-2" />
            Disconnect
          </button>
        )}
      </div>
    </motion.div>
  )
}

// Sync Activity Timeline Component
const SyncActivityTimeline = ({ activities }: { activities: SyncActivity[] }) => {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No sync activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const getActivityConfig = (status: string) => {
          switch (status) {
            case 'success':
              return { color: THEME_COLORS.success, icon: CheckCircle2 }
            case 'error':
              return { color: THEME_COLORS.warning, icon: XCircle }
            default:
              return { color: THEME_COLORS.secondary, icon: AlertCircle }
          }
        }

        const config = getActivityConfig(activity.status)
        const Icon = config.icon

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start space-x-4 p-4 bg-white rounded-xl border border-gray-200"
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <Icon className="h-4 w-4" style={{ color: config.color }} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  {activity.title}
                </h4>
                <span className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleTimeString()}
                </span>
              </div>
              
              {activity.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>{activity.integration_providers.display_name}</span>
                {activity.duration_ms && (
                  <span>{activity.duration_ms}ms</span>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function IntegrationsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [availableProviders, setAvailableProviders] = useState<any[]>([])
  const [syncActivities, setSyncActivities] = useState<SyncActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null)
  
  // Handle OAuth callback messages
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    
    if (connected) {
      // Show success message and refresh data
      console.log(`Successfully connected to ${connected}`)
      fetchIntegrations()
      fetchSyncActivities()
      
      // Clean up URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('connected')
      newUrl.searchParams.delete('integration_id')
      router.replace(newUrl.pathname)
    } else if (error) {
      console.error('Integration error:', error)
      // Handle error display
    }
  }, [searchParams, router])

  // Fetch integrations and providers
  useEffect(() => {
    if (user?.organization_id) {
      fetchIntegrations()
      fetchAvailableProviders()
      fetchSyncActivities()
      
      trackEvent('page_view', 'integrations', 'integrations_page')
    }
  }, [user?.organization_id])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations || [])
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    }
  }

  const fetchAvailableProviders = async () => {
    try {
      const response = await fetch('/api/integrations/providers')
      if (response.ok) {
        const data = await response.json()
        setAvailableProviders(data.providers || [])
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSyncActivities = async () => {
    try {
      const response = await fetch('/api/integrations/sync-activities')
      if (response.ok) {
        const data = await response.json()
        setSyncActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to fetch sync activities:', error)
    }
  }

  const handleConnect = async (provider: string) => {
    try {
      setConnectingProvider(provider)
      
      const response = await fetch(`/api/integrations/${provider}/connect`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const { authUrl } = await response.json()
        window.location.href = authUrl
        
        trackEvent('integration_connect_attempt', 'integrations', provider)
      } else {
        throw new Error('Failed to get authorization URL')
      }
    } catch (error) {
      console.error('Failed to connect integration:', error)
      setConnectingProvider(null)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    try {
      const integration = integrations.find(i => i.id === integrationId)
      const provider = integration?.integration_providers?.name
      
      const response = await fetch(`/api/integrations/${provider}/disconnect`, {
        method: 'POST'
      })
      
      if (response.ok) {
        await fetchIntegrations()
        trackEvent('integration_disconnect', 'integrations', provider)
      } else {
        throw new Error('Failed to disconnect integration')
      }
    } catch (error) {
      console.error('Failed to disconnect integration:', error)
    }
  }

  const handleTestConnection = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/test`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Connection test failed')
      }
      
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Connection test failed')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      throw error
    }
  }

  // Merge integrations with available providers
  const allProviders = availableProviders.map(provider => {
    const existingIntegration = integrations.find(
      i => i.integration_providers?.name === provider.name
    )
    
    return existingIntegration || {
      id: `new-${provider.name}`,
      integration_providers: provider,
      status: 'disconnected',
      total_synced_contacts: 0,
      total_synced_deals: 0
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: THEME_COLORS.primary }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-8">
          {/* Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CRM Integrations</h1>
              <p className="mt-1 text-lg text-gray-600">
                Connect your favorite CRM to automatically sync leads and deals
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/inbox"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50"
              >
                <Activity className="h-4 w-4 mr-2" />
                View Inbox
              </Link>
              <button
                onClick={() => {
                  fetchIntegrations()
                  fetchSyncActivities()
                }}
                className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white hover:shadow-lg transition-all"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Connected Integrations</h3>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {integrations.filter(i => i.status === 'connected').length}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Contacts Synced</h3>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {integrations.reduce((sum, i) => sum + (i.total_synced_contacts || 0), 0)}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Deals Created</h3>
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {integrations.reduce((sum, i) => sum + (i.total_synced_deals || 0), 0)}
              </p>
            </div>
          </motion.div>

          {/* Available Integrations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Integrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {allProviders.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onTestConnection={handleTestConnection}
                    isConnecting={connectingProvider === integration.integration_providers?.name}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Recent Sync Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Sync Activity</h2>
              <button
                onClick={fetchSyncActivities}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Refresh
              </button>
            </div>
            
            <SyncActivityTimeline activities={syncActivities.slice(0, 10)} />
            
            {syncActivities.length > 10 && (
              <div className="mt-6 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All Activity
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}