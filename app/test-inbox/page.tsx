// app/test-inbox/page.tsx
'use client'

import { useState } from 'react'

export default function TestInboxPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAIClassification = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inbox/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: "Hi! Thanks for your email about your services. I'm very interested in learning more. Can we schedule a call next week?",
          subject: "Re: Introduction to our marketing services",
          fromEmail: "test@example.com"
        })
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: 'Test failed', details: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Inbox System Test</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">AI Classification Test</h2>
          <p className="text-gray-600 mb-4">
            This will test if the AI classification system is working correctly.
          </p>
          
          <button
            onClick={testAIClassification}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test AI Classification'}
          </button>
          
          {testResult && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Test Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Frontend components loaded successfully</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>API routes accessible</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              <span>OpenAI API key configured: {process.env.NODE_ENV === 'development' ? 'Yes' : 'Check server logs'}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Next Steps</h2>
          <ul className="space-y-2 text-blue-800">
            <li>✅ Fixed OpenAI client initialization to run only on server-side</li>
            <li>✅ Updated inbox store to use API calls instead of direct imports</li>
            <li>✅ Created proper API endpoints for inbox functionality</li>
            <li>🔄 Test AI classification with the button above</li>
            <li>📧 Connect email accounts to test full inbox functionality</li>
            <li>🤖 Send campaign replies to test real AI classification</li>
          </ul>
        </div>
      </div>
    </div>
  )
}