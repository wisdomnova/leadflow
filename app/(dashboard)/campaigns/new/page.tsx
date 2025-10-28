// app/(dashboard)/campaigns/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface EmailAccount {
  id: string
  provider: string
  email: string
  status: string
  daily_limit: number
  daily_sent: number
}

export default function NewCampaignPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    email_account_id: ''
  })

  useEffect(() => {
    fetchEmailAccounts()
  }, [user])

  const fetchEmailAccounts = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'warming_up'])
      .order('created_at', { ascending: false })

    if (!error && data) {
      setEmailAccounts(data)
      if (data.length === 1) {
        setFormData(prev => ({ ...prev, email_account_id: data[0].id }))
      }
    }
    setLoadingAccounts(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email_account_id) {
      alert('Please select an email account')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user?.id,
          name: formData.name,
          subject: formData.subject,
          body: formData.body,
          email_account_id: formData.email_account_id,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/campaigns/${data.id}`)
    } catch (error: any) {
      console.error('Error creating campaign:', error)
      alert('Failed to create campaign: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingAccounts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Create New Campaign</h1>

      {emailAccounts.length === 0 ? (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong className="font-semibold">Email account required</strong>
            <p className="mt-1">
              You need to connect a Gmail or Outlook account before creating campaigns.
            </p>
            <Link href="/email-accounts">
              <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700">
                <Mail className="w-4 h-4 mr-2" />
                Connect Email Account
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Name */}
            <div>
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Q1 Outreach"
                required
              />
            </div>

            {/* Email Account Selector */}
            <div>
              <Label htmlFor="email-account">Send From</Label>
              <Select 
                value={formData.email_account_id} 
                onValueChange={(value) => setFormData({ ...formData, email_account_id: value })}
                required
              >
                <SelectTrigger id="email-account">
                  <SelectValue placeholder="Select email account" />
                </SelectTrigger>
                <SelectContent>
                  {emailAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{account.email}</span>
                        <span className="text-xs text-muted-foreground">
                          ({account.daily_limit - account.daily_sent} sends left today)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Emails will be sent from this account
              </p>
            </div>

            {/* Subject Line */}
            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Use {{first_name}}, {{company}}, etc."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can use variables like {`{{first_name}}`}, {`{{last_name}}`}, {`{{company}}`}
              </p>
            </div>

            {/* Email Body */}
            <div>
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder={`Hi {{first_name}},\n\nI noticed you're working at {{company}}...`}
                rows={12}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use personalization variables to customize each email
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Campaign'
                )}
              </Button>
              <Link href="/campaigns">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}