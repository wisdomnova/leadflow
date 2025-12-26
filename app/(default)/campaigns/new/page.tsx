"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewCampaignPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [templates, setTemplates] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiSubjectSuggestions, setShowAiSubjectSuggestions] = useState(false)
  const [showAiBodySuggestions, setShowAiBodySuggestions] = useState(false)
  const [preflightReport, setPreflightReport] = useState<any>(null)
  const [preflightLoading, setPreflightLoading] = useState(false)
  const [showPreflight, setShowPreflight] = useState(false)
  const [userPlan, setUserPlan] = useState<string>('trial')

  const [campaign, setCampaign] = useState<any>({
    name: '',
    template_id: '',
    subject: '',
    preview_text: '',
    body: '',
    from_name: '',
    from_email: '',
    reply_to: '',
    provider: 'aws_ses',
    domain: '',
    notes: '',
  })
  const [useTemplate, setUseTemplate] = useState(true)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  useEffect(() => {
    const t = localStorage.getItem('auth_token') || localStorage.getItem('token')
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return
    loadTemplates()
    loadContacts()
    loadUserPlan()
  }, [token])

  async function loadUserPlan() {
    try {
      const res = await fetch('/api/billing/subscription', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const json = await res.json()
        setUserPlan(json.plan || 'trial')
      }
    } catch (error) {
      console.error('Error loading user plan:', error)
      setUserPlan('trial')
    }
  }

  async function loadTemplates() {
    try {
      const res = await fetch('/api/templates', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`Failed to load templates: ${res.status}`)
      const json = await res.json()
      console.log('Templates loaded:', json.templates?.length)
      setTemplates(json.templates || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates([])
    }
  }

  async function loadContacts() {
    try {
      const res = await fetch('/api/contacts', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`Failed to load contacts: ${res.status}`)
      const json = await res.json()
      setContacts(json.contacts || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
      setContacts([])
    }
  }

  async function handleCreate() {
    if (!campaign.name || !campaign.subject) {
      alert('Please fill required fields: Campaign Name and Subject')
      return
    }
    if (!useTemplate && !campaign.body) {
      alert('Please enter email body')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(campaign),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      // Add recipients
      if (selectedContacts.length > 0) {
        await fetch(`/api/campaigns/${json.campaign.id}/recipients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ contact_ids: selectedContacts }),
        })
      }

      router.push(`/campaigns/${json.campaign.id}`)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function getAiSubjectSuggestions() {
    if (!campaign.name && !campaign.body) {
      alert('Please provide campaign name or email body for suggestions')
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/campaigns/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          campaign_name: campaign.name,
          body: campaign.body,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAiSuggestions(data)
      setShowAiSubjectSuggestions(true)
    } catch (e: any) {
      alert('Error generating suggestions: ' + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function getAiBodySuggestions() {
    if (!campaign.subject && !campaign.name) {
      alert('Please provide subject line or campaign name for suggestions')
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/campaigns/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          campaign_name: campaign.name,
          subject: campaign.subject,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAiSuggestions(data)
      setShowAiBodySuggestions(true)
    } catch (e: any) {
      alert('Error generating suggestions: ' + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function runPreflight() {
    setPreflightLoading(true)
    try {
      const res = await fetch('/api/campaigns/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: campaign.subject,
          body: campaign.body,
          fromEmail: campaign.from_email,
          replyTo: campaign.reply_to,
        }),
      })
      const data = await res.json()
      setPreflightReport(data)
      setShowPreflight(true)
    } catch (e: any) {
      alert('Error running preflight: ' + e.message)
    } finally {
      setPreflightLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create Campaign</h1>
        <p className="text-sm text-gray-500">Step {step} of 3</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700/60 p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Campaign Details</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Name</label>
              <input
                type="text"
                className="form-input w-full"
                value={campaign.name}
                onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                placeholder="Q1 Outreach"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              <div className="flex gap-4 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={useTemplate}
                    onChange={() => setUseTemplate(true)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Use Template</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    checked={!useTemplate}
                    onChange={() => setUseTemplate(false)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Write Custom Email</span>
                </label>
              </div>

              {useTemplate ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Select Template</label>
                  <select
                    className="form-select w-full"
                    value={campaign.template_id}
                    onChange={(e) => {
                      const tpl = templates.find((t) => t.id === e.target.value)
                      setCampaign({ ...campaign, template_id: e.target.value, subject: tpl?.subject || '', body: tpl?.body || '' })
                    }}
                  >
                    <option value="">Choose template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium">Email Body</label>
                    <button
                      type="button"
                      onClick={getAiBodySuggestions}
                      disabled={aiLoading}
                      className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium"
                    >
                      ✨ Get AI Suggestions
                    </button>
                  </div>
                  <textarea
                    className="form-textarea w-full h-40"
                    value={campaign.body}
                    onChange={(e) => setCampaign({ ...campaign, body: e.target.value })}
                    placeholder="Write your email here. Use {{firstName}}, {{company}}, etc. for merge tags."
                  />
                  
                  {/* AI Body Suggestions */}
                  {showAiBodySuggestions && aiSuggestions && (
                    <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
                      <p className="text-xs font-semibold text-violet-900 dark:text-violet-100 mb-2">AI-Suggested Email Bodies:</p>
                      <div className="space-y-3">
                        {aiSuggestions.suggestions?.map((suggestion: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => {
                              setCampaign({ ...campaign, body: suggestion })
                              setShowAiBodySuggestions(false)
                            }}
                            className="block w-full text-left text-sm p-3 hover:bg-violet-100 dark:hover:bg-violet-800 rounded transition border border-transparent hover:border-violet-300 dark:hover:border-violet-700"
                          >
                            <div className="whitespace-pre-wrap text-xs">{suggestion}</div>
                          </button>
                        ))}
                      </div>
                      {aiSuggestions.tips && aiSuggestions.tips.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-violet-200 dark:border-violet-700">
                          <p className="text-xs text-violet-700 dark:text-violet-300">
                            <span className="font-semibold">Tips:</span> {aiSuggestions.tips.join(' • ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">Subject Line</label>
                <button
                  type="button"
                  onClick={getAiSubjectSuggestions}
                  disabled={aiLoading}
                  className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium"
                >
                  ✨ Get AI Suggestions
                </button>
              </div>
              <input
                type="text"
                className="form-input w-full"
                value={campaign.subject}
                onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                placeholder="{{firstName}} - quick thought on {{company}}"
              />
              
              {/* AI Subject Suggestions */}
              {showAiSubjectSuggestions && aiSuggestions && (
                <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
                  <p className="text-xs font-semibold text-violet-900 dark:text-violet-100 mb-2">AI-Suggested Subject Lines:</p>
                  <div className="space-y-2">
                    {aiSuggestions.suggestions?.map((suggestion: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCampaign({ ...campaign, subject: suggestion })
                          setShowAiSubjectSuggestions(false)
                        }}
                        className="block w-full text-left text-sm p-2 hover:bg-violet-100 dark:hover:bg-violet-800 rounded transition"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  {aiSuggestions.tips && aiSuggestions.tips.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-violet-200 dark:border-violet-700">
                      <p className="text-xs text-violet-700 dark:text-violet-300">
                        <span className="font-semibold">Tips:</span> {aiSuggestions.tips.join(' • ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preview Text</label>
              <input
                type="text"
                className="form-input w-full"
                value={campaign.preview_text}
                onChange={(e) => setCampaign({ ...campaign, preview_text: e.target.value })}
                placeholder="Short preview text for email clients"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Notes</label>
              <textarea
                className="form-textarea w-full h-20"
                value={campaign.notes || ''}
                onChange={(e) => setCampaign({ ...campaign, notes: e.target.value })}
                placeholder="Internal notes about this campaign (goal, follow-up strategy, etc.) - not sent to recipients"
              />
            </div>

            {/* Preflight Check - Available on Starter+ */}
            {userPlan !== 'trial' && (
              <div className="border-t border-gray-200 dark:border-gray-700/60 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Compliance Preflight</h3>
                    <p className="text-xs text-gray-500 mt-1">Check deliverability and compliance before sending</p>
                  </div>
                  <button
                    type="button"
                    onClick={runPreflight}
                    disabled={preflightLoading || !campaign.subject}
                    className="text-sm px-3 py-1 rounded bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {preflightLoading ? 'Checking...' : 'Run Check'}
                  </button>
                </div>

                {showPreflight && preflightReport && (
                  <div className="mt-3 p-3 border rounded-lg" style={{
                    borderColor: preflightReport.status === 'fail' ? '#dc2626' : preflightReport.status === 'caution' ? '#f59e0b' : '#10b981',
                    backgroundColor: preflightReport.status === 'fail' ? '#fef2f2' : preflightReport.status === 'caution' ? '#fffbeb' : '#f0fdf4',
                  }}>
                    <p className="text-sm font-semibold" style={{
                      color: preflightReport.status === 'fail' ? '#991b1b' : preflightReport.status === 'caution' ? '#92400e' : '#065f46',
                    }}>
                      Status: {preflightReport.status.toUpperCase()}
                    </p>
                    {preflightReport.issues && preflightReport.issues.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {preflightReport.issues.map((issue: any, i: number) => (
                          <div key={i} className="text-xs" style={{
                            color: issue.type === 'error' ? '#991b1b' : issue.type === 'warning' ? '#92400e' : '#065f46',
                          }}>
                            <span className="font-medium">{issue.code}:</span> {issue.message}
                            {issue.hint && <p className="mt-1 opacity-75">{issue.hint}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {preflightReport.meta && (
                      <div className="mt-3 pt-2 border-t" style={{ borderColor: preflightReport.status === 'fail' ? '#fecaca' : preflightReport.status === 'caution' ? '#fde68a' : '#86efac' }}>
                        <p className="text-xs opacity-75">
                          Subject: {preflightReport.meta.subjectLength} chars | Body: {preflightReport.meta.bodyLength} chars | Links: {preflightReport.meta.linkCount} | Images: {preflightReport.meta.imageCount}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {userPlan === 'trial' && (
              <div className="border-t border-gray-200 dark:border-gray-700/60 pt-4">
                <div className="text-xs text-gray-500">
                  <span className="font-semibold">Compliance Preflight</span> available on Starter plan and above
                </div>
              </div>
            )}

            {/* Merge Tags Reference */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Available Merge Tags</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-2">Standard Contact Fields:</p>
                  <ul className="space-y-1 text-blue-700 dark:text-blue-300 font-mono text-xs">
                    <li>{'{{firstName}}'} - First name</li>
                    <li>{'{{lastName}}'} - Last name</li>
                    <li>{'{{fullName}}'} - Full name</li>
                    <li>{'{{email}}'} - Email address</li>
                    <li>{'{{company}}'} - Company name</li>
                    <li>{'{{phone}}'} - Phone number</li>
                    <li>{'{{jobTitle}}'} - Job title</li>
                    <li>{'{{website}}'} - Website</li>
                    <li>{'{{city}}'} - City</li>
                    <li>{'{{country}}'} - Country</li>
                  </ul>
                </div>
                <div className="text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-2">Custom Fields:</p>
                  <p className="text-blue-700 dark:text-blue-300 mb-2">Use <span className="font-mono">{'{{customFieldName}}'}</span> for any custom metadata</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Example: <span className="font-mono">{'{{department}}'}</span> if you have that field</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">Missing fields are replaced with empty strings. Test first!</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Link href="/campaigns" className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60">
                Cancel
              </Link>
              <button onClick={() => setStep(2)} className="btn bg-gray-900 text-gray-100 hover:bg-gray-800">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Recipients</h2>
            <div className="text-sm text-gray-600 mb-2">
              {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
            </div>
            <div className="max-h-96 overflow-y-auto border rounded">
              {contacts.map((c) => (
                <label key={c.id} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContacts([...selectedContacts, c.id])
                      } else {
                        setSelectedContacts(selectedContacts.filter((id) => id !== c.id))
                      }
                    }}
                    className="form-checkbox"
                  />
                  <span className="ml-3">
                    {c.name} <span className="text-gray-500">({c.email})</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60">
                Back
              </button>
              <button onClick={() => setStep(3)} className="btn bg-gray-900 text-gray-100 hover:bg-gray-800">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Send Settings</h2>
            <div>
              <label className="block text-sm font-medium mb-1">From Name</label>
              <input
                type="text"
                className="form-input w-full"
                value={campaign.from_name}
                onChange={(e) => setCampaign({ ...campaign, from_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From Email</label>
              <input
                type="email"
                className="form-input w-full"
                value={campaign.from_email}
                onChange={(e) => setCampaign({ ...campaign, from_email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reply-To (optional)</label>
              <input
                type="email"
                className="form-input w-full"
                value={campaign.reply_to}
                onChange={(e) => setCampaign({ ...campaign, reply_to: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select
                className="form-select w-full"
                value={campaign.provider}
                onChange={(e) => setCampaign({ ...campaign, provider: e.target.value })}
              >
                <option value="aws_ses">AWS SES</option>
                <option value="gmail">Gmail</option>
                <option value="smtp">SMTP</option>
                <option value="resend">Resend</option>
              </select>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60">
                Back
              </button>
              <button onClick={handleCreate} disabled={loading} className="btn bg-gray-900 text-gray-100 hover:bg-gray-800">
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
