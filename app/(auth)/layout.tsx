import { Suspense } from 'react'

// 🎯 Loading component for auth pages
function AuthLayoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

// 🎯 Auth layout content component
function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<AuthLayoutLoading />}>
      <AuthLayoutContent>
        {children}
      </AuthLayoutContent>
    </Suspense>
  )
}

// 🎯 Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0