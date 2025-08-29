// ./components/campaigns/EmailEventsDisplay.tsx
'use client'

import { useState, useEffect } from 'react'
import { Eye, MousePointer, Mail, AlertTriangle, Ban, Calendar, User } from 'lucide-react'

interface EmailEvent {
  id: string
  campaign_id: string
  contact_id: string
  step_number: number
  event_type: 'delivery' | 'open' | 'click' | 'bounce' | 'complaint' | 'unsubscribe'
  message_id?: string
  url?: string
  user_agent?: string
  ip_address?: string
  metadata?: any
  created_at: string
  contact_email?: string
  contact_name?: string
}

interface EmailEventsDisplayProps {
  campaignId: string
  limit?: number
}

export default function EmailEventsDisplay({ campaignId, limit = 50 }: EmailEventsDisplayProps) {
  const [events, setEvents] = useState<EmailEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [campaignId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/campaigns/${campaignId}/events?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch email events')
      }

      const data = await response.json()
      setEvents(data.events || [])

    } catch (err) {
      console.error('Failed to fetch email events:', err)
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'delivery':
        return <Mail className="w-4 h-4 text-blue-600" />
      case 'open':
        return <Eye className="w-4 h-4 text-green-600" />
      case 'click':
        return <MousePointer className="w-4 h-4 text-purple-600" />
      case 'bounce':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'complaint':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case 'unsubscribe':
        return <Ban className="w-4 h-4 text-gray-600" />
      default:
        return <Mail className="w-4 h-4 text-gray-600" />
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'delivery':
        return 'bg-blue-50 border-blue-200'
      case 'open':
        return 'bg-green-50 border-green-200'
      case 'click':
        return 'bg-purple-50 border-purple-200'
      case 'bounce':
        return 'bg-red-50 border-red-200'
      case 'complaint':
        return 'bg-orange-50 border-orange-200'
      case 'unsubscribe':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatEventType = (eventType: string) => {
    return eventType.charAt(0).toUpperCase() + eventType.slice(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Email Activity</h3>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Email Activity</h3>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Events</h4>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Email Activity</h3>
        </div>
        <span className="text-sm text-gray-500">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h4>
          <p className="text-gray-600">Email events will appear here once your campaign starts sending.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.map((event) => {
            const { date, time } = formatDate(event.created_at)
            return (
              <div
                key={event.id}
                className={`flex items-center gap-4 p-4 border rounded-lg ${getEventColor(event.event_type)}`}
              >
                <div className="flex-shrink-0">
                  {getEventIcon(event.event_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {formatEventType(event.event_type)}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-sm text-gray-600">
                      Step {event.step_number}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-3 h-3" />
                    <span className="truncate">
                      {event.contact_email || 'Unknown contact'}
                    </span>
                  </div>
                  
                  {event.url && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      Clicked: {event.url}
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0 text-right text-xs text-gray-500">
                  <div>{date}</div>
                  <div>{time}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}