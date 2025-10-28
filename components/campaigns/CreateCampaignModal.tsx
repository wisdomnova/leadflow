// components/campaigns/CreateCampaignModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, AlertCircle } from 'lucide-react'
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

export function CreateCampaignModal() {
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

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

    if (!error && data) {
      setEmailAccounts(data)
      if (data.length === 1) {
        setSelectedAccount(data[0].id)
      }
    }
    setLoading(false)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (emailAccounts.length === 0) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900">
          <strong className="font-semibold">Email account required</strong>
          <p className="mt-1">
            You need to connect a Gmail or Outlook account before creating campaigns.
          </p>
          <Link href="/email-accounts">
            <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700">
              Connect Email Account
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* ...other campaign fields... */}

      {/* Email Account Selector */}
      <div>
        <Label htmlFor="email-account">Send From</Label>
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
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
          Campaigns will be sent from this email account
        </p>
      </div>

      {/* ...rest of form... */}
    </div>
  )
}