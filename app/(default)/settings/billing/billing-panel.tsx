"use client"

import { useEffect, useState } from 'react'

type PaymentMethod = { id: string; type: string; last4: string; expires: string; isDefault?: boolean }
type Invoice = { id: string; date: string; amount: number; status: string; invoiceUrl?: string }

export default function BillingPanel() {
  const [subscription, setSubscription] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [billingInfo, setBillingInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setError('Sign in to view billing details.')
          setLoading(false)
          return
        }

        const headers = { Authorization: `Bearer ${token}` }
        const [subRes, pmRes, invRes, infoRes] = await Promise.all([
          fetch('/api/billing/subscription', { headers }),
          fetch('/api/billing/payment-methods', { headers }),
          fetch('/api/billing/invoices', { headers }),
          fetch('/api/billing/info', { headers }),
        ])

        if (subRes.ok) {
          const data = await subRes.json()
          setSubscription(data)
        }
        if (pmRes.ok) {
          const data = await pmRes.json()
          setPaymentMethods(data.paymentMethods || [])
        }
        if (invRes.ok) {
          const data = await invRes.json()
          setInvoices(data.invoices || [])
        }
        if (infoRes.ok) {
          const data = await infoRes.json()
          setBillingInfo(data.billingInfo || null)
        }
      } catch (e) {
        setError('Unable to load billing right now.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="grow">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-2">Billing & Invoices</h2>
          {subscription?.currentPlan ? (
            <div className="text-sm">
              Current plan <strong className="font-medium">{subscription.currentPlan.name}</strong> • Billing {subscription.subscription?.billingCycle === 'yearly' ? 'Annually' : 'Monthly'} • Renews {subscription.subscription?.currentPeriodEnd ? new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No active plan yet.</div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">{error}</div>
        )}
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading billing details…</div>
        )}

        <section>
          <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1">Billing Information</h3>
          <div className="mb-3">
            <button
              className="btn-sm bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
              onClick={async () => {
                try {
                  const token = localStorage.getItem('auth_token')
                  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
                  const res = await fetch('/api/billing/customer-portal', { method: 'POST', headers })
                  const data = await res.json()
                  if (res.ok && data.url) {
                    window.location.href = data.url
                  }
                } catch {}
              }}
            >
              Manage in Stripe Customer Portal
            </button>
          </div>
          {!billingInfo ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No billing information available.</div>
          ) : (
            <ul>
              <li className="md:flex md:justify-between md:items-center py-3 border-b border-gray-200 dark:border-gray-700/60">
                <div className="text-sm text-gray-800 dark:text-gray-100 font-medium">Payment Method</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                  {paymentMethods.length > 0 ? (
                    <span className="mr-3">{paymentMethods[0].type} ending {paymentMethods[0].last4}</span>
                  ) : (
                    <span className="mr-3">No card on file</span>
                  )}
                  <a className="font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="/billing">Manage</a>
                </div>
              </li>
              <li className="md:flex md:justify-between md:items-center py-3 border-b border-gray-200 dark:border-gray-700/60">
                <div className="text-sm text-gray-800 dark:text-gray-100 font-medium">Billing Interval</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                  <span className="mr-3">{subscription?.subscription?.billingCycle === 'yearly' ? 'Annually' : 'Monthly'}</span>
                  <a className="font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="/settings/plans">Change</a>
                </div>
              </li>
              <li className="md:flex md:justify-between md:items-center py-3 border-b border-gray-200 dark:border-gray-700/60">
                <div className="text-sm text-gray-800 dark:text-gray-100 font-medium">VAT/GST Number</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                  <span className="mr-3">{billingInfo.taxId || 'Not provided'}</span>
                  <a className="font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="/billing">Edit</a>
                </div>
              </li>
              <li className="md:flex md:justify-between md:items-center py-3 border-b border-gray-200 dark:border-gray-700/60">
                <div className="text-sm text-gray-800 dark:text-gray-100 font-medium">Your Address</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                  <span className="mr-3">{billingInfo.address || 'Not provided'}</span>
                  <a className="font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="/billing">Edit</a>
                </div>
              </li>
              <li className="md:flex md:justify-between md:items-center py-3 border-b border-gray-200 dark:border-gray-700/60">
                <div className="text-sm text-gray-800 dark:text-gray-100 font-medium">Billing Email</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                  <span className="mr-3">{billingInfo.email}</span>
                  <a className="font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="/billing">Edit</a>
                </div>
              </li>
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1">Invoices</h3>
          {invoices.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">No invoices found.</div>
          ) : (
            <table className="table-auto w-full dark:text-gray-400">
              <thead className="text-xs uppercase text-gray-400 dark:text-gray-500">
                <tr className="flex flex-wrap md:table-row md:flex-no-wrap">
                  <th className="w-full block md:w-auto md:table-cell py-2">
                    <div className="font-semibold text-left">Date</div>
                  </th>
                  <th className="w-full hidden md:w-auto md:table-cell py-2">
                    <div className="font-semibold text-left">Amount</div>
                  </th>
                  <th className="w-full hidden md:w-auto md:table-cell py-2">
                    <div className="font-semibold text-left">Status</div>
                  </th>
                  <th className="w-full hidden md:w-auto md:table-cell py-2">
                    <div className="font-semibold text-right"></div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="flex flex-wrap md:table-row md:flex-no-wrap border-b border-gray-200 dark:border-gray-700/60 py-2 md:py-0">
                    <td className="w-full block md:w-auto md:table-cell py-0.5 md:py-2">
                      <div className="text-left font-medium text-gray-800 dark:text-gray-100">{inv.date}</div>
                    </td>
                    <td className="w-full block md:w-auto md:table-cell py-0.5 md:py-2">
                      <div className="text-left font-medium">${inv.amount.toFixed(2)}</div>
                    </td>
                    <td className="w-full block md:w-auto md:table-cell py-0.5 md:py-2">
                      <div className="text-left">{inv.status}</div>
                    </td>
                    <td className="w-full block md:w-auto md:table-cell py-0.5 md:py-2">
                      <div className="text-right flex items-center md:justify-end">
                        {inv.invoiceUrl ? (
                          <a className="font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href={inv.invoiceUrl} target="_blank" rel="noreferrer">Open</a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <footer>
        <div className="flex flex-col px-6 py-5 border-t border-gray-200 dark:border-gray-700/60">
          <div className="flex self-end">
            <a className="btn dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300" href="/billing">Open billing</a>
          </div>
        </div>
      </footer>

    </div>
  )
}