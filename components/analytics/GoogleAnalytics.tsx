// components/analytics/GoogleAnalytics.tsx
'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// Google Analytics events for LeadFlow
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label, 
      value: value,
    })
  }
}

// Campaign-specific tracking
export const trackCampaignEvent = (eventName: string, campaignId: string, metadata?: any) => {
  trackEvent(eventName, 'campaign', campaignId, metadata?.value)
  
  // Custom campaign events
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'campaign_action', {
      custom_map: { custom_parameter_1: 'campaign_id' },
      campaign_id: campaignId,
      action_type: eventName,
      ...metadata
    })
  }
}

// Email tracking events
export const trackEmailEvent = (eventName: string, emailId: string, metadata?: any) => {
  trackEvent(eventName, 'email', emailId, metadata?.value)
}

// Page view tracking
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID!, {
      page_location: url,
      page_title: title,
    })
  }
}

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      const url = pathname + searchParams.toString()
      trackPageView(url)
    }
  }, [pathname, searchParams])

  if (!GA_MEASUREMENT_ID) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_location: window.location.href,
              page_title: document.title,
            });
          `,
        }}
      />
    </>
  )
}