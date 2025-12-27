import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url'
  const now = new Date()
  const urls = [
    '/',
    '/dashboard',
    '/campaigns',
    '/contacts',
    '/email',
    '/settings/account',
    '/settings/notifications',
    '/settings/apps',
    '/settings/plans',
    '/settings/billing',
    '/settings/feedback',
  ]

  return urls.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.6,
  }))
}
