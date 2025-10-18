// components/analytics/GoogleAnalytics.tsx
'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-WTW623SS'

// Google Tag Manager events for LeadFlow
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: action,
      eventCategory: category,
      eventLabel: label,
      eventValue: value,
    })
  }
}

// Campaign-specific tracking
export const trackCampaignEvent = (eventName: string, campaignId: string, metadata?: any) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'campaign_action',
      campaign_id: campaignId,
      action_type: eventName,
      ...metadata
    })
  }
}

// Email tracking events
export const trackEmailEvent = (eventName: string, emailId: string, metadata?: any) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'email_action',
      email_id: emailId,
      action_type: eventName,
      ...metadata
    })
  }
}

// Page view tracking
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page_location: url,
      page_title: title,
    })
  }
}

declare global {
  interface Window {
    dataLayer: any[]
  }
}

export default function GoogleTagManager() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (GTM_ID) {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      trackPageView(url, document.title)
    }
  }, [pathname, searchParams])

  if (!GTM_ID) {
    return null
  }

  return (
    <>
      {/* Google Tag Manager Script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
    </>
  )
}

// Export noscript component separately for body
export function GoogleTagManagerNoscript() {
  if (!GTM_ID) {
    return null
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  )
}