/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com checkout.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: images.stripe.com",
      "font-src 'self' data:",
      "connect-src 'self' api.stripe.com js.stripe.com checkout.stripe.com *.supabase.co *.supabase.in",
      "frame-src 'self' js.stripe.com checkout.stripe.com",
    ].join('; ')

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    ]

    return [
      { source: '/:path*', headers: securityHeaders },
    ]
  },
}

module.exports = nextConfig
