'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useEmailProviderCheck() {
  const router = useRouter()
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkEmailProvider = async () => {
      try {
        const token = localStorage.getItem('token')
        
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/email-provider', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.status === 404) {
          // No email provider configured
          setIsConfigured(false)
          setLoading(false)
          return
        }

        if (!response.ok) {
          setLoading(false)
          return
        }

        const data = await response.json()
        
        if (data.provider) {
          const isConfigured = data.provider.providerType !== 'skip'
          setIsConfigured(isConfigured)
        } else {
          setIsConfigured(false)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error checking email provider:', error)
        setLoading(false)
      }
    }

    checkEmailProvider()
  }, [])

  return { isConfigured, loading }
}

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isConfigured, loading } = useEmailProviderCheck()

  useEffect(() => {
    if (loading) return

    // If email provider is not configured, redirect to email setup
    if (isConfigured === false) {
      router.push('/email-setup')
    }
  }, [isConfigured, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (isConfigured === false) {
    return null
  }

  return <>{children}</>
}
