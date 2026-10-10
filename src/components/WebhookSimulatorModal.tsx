import React, { useState, useEffect } from 'react'
import { WebhookPayload } from '../types'
import { api } from '../services/api'
import {
  X,
  Webhook,
  Terminal,
  Copy,
  Check,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface WebhookSimulatorModalProps {
  isOpen: boolean
  onClose: () => void
  defaultPaymentId?: string
  onWebhookSent?: () => void
}

export const WebhookSimulatorModal: React.FC<WebhookSimulatorModalProps> = ({
  isOpen,
  onClose,
  defaultPaymentId = '',
  onWebhookSent,
}) => {
  const [paymentId, setPaymentId] = useState(defaultPaymentId)
  const [eventId, setEventId] = useState('')
  const [status, setStatus] = useState<'SUCCESS' | 'FAILED'>('SUCCESS')
  const [sharedSecret, setSharedSecret] = useState('payflow_secret_key_123')
  const [isSending, setIsSending] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    message: string
    isDuplicate?: boolean
  } | null>(null)

  useEffect(() => {
    if (defaultPaymentId) {
      setPaymentId(defaultPaymentId)
    }
    setEventId('evt_' + Math.random().toString(36).substring(2, 10))
    setLastResult(null)
  }, [defaultPaymentId, isOpen])

  if (!isOpen) return null

  const generateNewEventId = () => {
    setEventId('evt_' + Math.random().toString(36).substring(2, 10))
  }

  const payload: WebhookPayload = {
    eventId: eventId.trim() || 'evt_sample123',
    paymentId: paymentId.trim() || 'pay_sample456',
    status,
  }

  const curlCommand = `curl -X POST ${api.getBaseUrl()}/webhooks/provider \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Secret: ${sharedSecret}" \\
  -d '${JSON.stringify(payload)}'`

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand)
    setCopiedCurl(true)
    setTimeout(() => setCopiedCurl(false), 2000)
  }

  const handleSendWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentId.trim()) return

    setIsSending(true)
    setLastResult(null)

    try {
      const res = await api.sendWebhook(payload, sharedSecret)
      setLastResult({
        success: res.received,
        message: res.message,
        isDuplicate: res.isDuplicate,
      })
      if (onWebhookSent) {
        onWebhookSent()
      }
    } catch (err: any) {
      setLastResult({
        success: false,
        message: err?.message || 'Webhook invocation failed',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Provider Webhook Tester
              </h2>
              <p className="text-xs text-slate-500">
                Simulate provider webhook callbacks, verify idempotency and curl
                commands
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {lastResult && (
            <div
              className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
                lastResult.success
                  ? lastResult.isDuplicate
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {lastResult.success ? (
                lastResult.isDuplicate ? (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                )
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              )}
              <div>
                <p className="font-semibold">
                  {lastResult.isDuplicate
                    ? 'Duplicate Event Detected (Idempotent Success)'
                    : lastResult.success
                      ? 'Webhook Processed Successfully'
                      : 'Webhook Delivery Failed'}
                </p>
                <p className="text-xs mt-0.5 opacity-90">
                  {lastResult.message}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSendWebhook} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Payment ID
                </label>
                <input
                  type="text"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  required
                  placeholder="pay_xxxxxxxx"
                  className="w-full font-mono text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Payment Result Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as 'SUCCESS' | 'FAILED')
                  }
                  className="w-full text-sm font-semibold px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="SUCCESS">SUCCESS (Marks Link PAID)</option>
                  <option value="FAILED">FAILED (Allows Customer Retry)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Event ID (Unique Per Webhook)
                </label>
                <button
                  type="button"
                  onClick={generateNewEventId}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate New ID</span>
                </button>
              </div>
              <input
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                required
                className="w-full font-mono text-sm px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: Send twice with the exact same Event ID to test idempotency
                handling.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Shared Secret (X-Webhook-Secret Header)
              </label>
              <input
                type="text"
                value={sharedSecret}
                onChange={(e) => setSharedSecret(e.target.value)}
                className="w-full font-mono text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={isSending || !paymentId}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50 text-sm"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending Webhook Event...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch Webhook Notification</span>
                </>
              )}
            </button>
          </form>

          <div className="bg-slate-900 rounded-xl p-4 text-white space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Terminal cURL Command
              </span>
              <button
                onClick={handleCopyCurl}
                className="hover:text-white transition flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {curlCommand}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
