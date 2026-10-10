import React, { useState, useEffect, useRef } from 'react';
import { PaymentLink, Payment, PayPageData } from '../types';
import { api } from '../services/api';
import { formatPaiseToRupees, formatDate } from '../utils/formatters';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Lock,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface CustomerPayPageProps {
  linkId: string;
  onBackToDashboard?: () => void;
  onTriggerWebhookModal?: (paymentId: string) => void;
}

export const CustomerPayPage: React.FC<CustomerPayPageProps> = ({
  linkId,
  onBackToDashboard,
}) => {
  const [data, setData] = useState<PayPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  const pollIntervalRef = useRef<number | null>(null);

  const fetchLinkDetails = async () => {
    try {
      const pageData = await api.getPayPageData(linkId);
      setData(pageData);
      return pageData;
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch payment link');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkDetails();
  }, [linkId]);

  useEffect(() => {
    const isPending = data?.latestPayment?.status === 'PENDING';

    if (isPending) {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = window.setInterval(async () => {
          const updated = await fetchLinkDetails();
          if (
            updated?.latestPayment?.status === 'SUCCESS' ||
            updated?.latestPayment?.status === 'FAILED'
          ) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }, 2500);
      }
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [data?.latestPayment?.status]);

  const handlePay = async () => {
    if (!data?.link) return;
    setError(null);
    setIsPaying(true);

    try {
      const payment = await api.startPayment(linkId);
      setData((prev) => (prev ? { ...prev, latestPayment: payment } : null));
    } catch (err: any) {
      setError(err?.message || 'Payment initiation failed');
    } finally {
      setIsPaying(false);
    }
  };

  const handleSimulateWebhookResult = async (status: 'SUCCESS' | 'FAILED') => {
    if (!data?.latestPayment?.paymentId) return;
    const eventId = 'evt_' + Math.random().toString(36).substring(2, 9);
    await api.sendWebhook({
      eventId,
      paymentId: data.latestPayment.paymentId,
      status,
    });
    await fetchLinkDetails();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading checkout session...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-lg border border-slate-200 text-center">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Invalid Payment Link</h2>
          <p className="text-sm text-slate-500 mt-2">{error}</p>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const link = data?.link as PaymentLink;
  const payment = data?.latestPayment as Payment | null;
  const isPaid = link.status === 'PAID' || payment?.status === 'SUCCESS';
  const isPending = payment?.status === 'PENDING';
  const isFailed = payment?.status === 'FAILED';
  const isExpired = link.status === 'EXPIRED';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl mx-auto w-full flex items-center justify-between mb-4">
        {onBackToDashboard ? (
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Merchant Dashboard
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-bit Encrypted Checkout</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center font-bold text-white text-sm">
                ₹
              </div>
              <span className="text-sm font-semibold tracking-wide uppercase text-blue-100">
                Acme Store Checkout
              </span>
            </div>
            <span className="font-mono text-xs text-blue-200 bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
              {link.linkId}
            </span>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <span className="text-xs text-blue-200 uppercase tracking-wider block font-medium">
                Total Payable Amount
              </span>
              <div className="text-4xl font-extrabold tracking-tight mt-0.5">
                {formatPaiseToRupees(link.amount)}
              </div>
            </div>
            <span className="text-xs font-mono text-blue-200">
              ({link.amount.toLocaleString('en-IN')} paise)
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Payment For
            </span>
            <p className="text-slate-800 text-sm font-medium leading-relaxed">
              {link.description}
            </p>
          </div>

          {isPaid && (
            <div className="text-center py-6 px-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-emerald-900">Payment Successful!</h3>
              <p className="text-sm text-emerald-700 mt-1 max-w-sm mx-auto">
                This payment link has already been PAID and cannot be paid again.
              </p>

              {payment && (
                <div className="mt-5 p-3.5 bg-white rounded-xl border border-emerald-200 text-xs text-left max-w-xs mx-auto space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Payment ID:</span>
                    <span className="font-semibold text-slate-800">{payment.paymentId}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Amount:</span>
                    <span className="font-semibold text-slate-800">{formatPaiseToRupees(payment.amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Paid On:</span>
                    <span className="text-slate-700">{formatDate(payment.updatedAt)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {isExpired && !isPaid && (
            <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Payment Link Expired</h3>
              <p className="text-sm text-slate-500 mt-1">
                This payment link is no longer active. Please contact the merchant to request a new link.
              </p>
            </div>
          )}

          {isPending && !isPaid && (
            <div className="text-center py-8 px-4 bg-amber-50/70 rounded-2xl border border-amber-200 animate-in fade-in duration-200">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-amber-200 animate-ping opacity-50"></div>
                <div className="relative w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-amber-900">Waiting for confirmation...</h3>
              <p className="text-sm text-amber-700 mt-1 max-w-sm mx-auto">
                Payment initiated (ID: <span className="font-mono font-bold">{payment?.paymentId}</span>). Checking provider webhook status every few seconds...
              </p>

              <div className="mt-6 pt-5 border-t border-amber-200/80">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block mb-2">
                  Tester Actions (Simulate Webhook Result):
                </span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleSimulateWebhookResult('SUCCESS')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg border border-emerald-300 transition shadow-2xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Simulate SUCCESS Webhook
                  </button>
                  <button
                    onClick={() => handleSimulateWebhookResult('FAILED')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg border border-rose-300 transition shadow-2xs flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Simulate FAILED Webhook
                  </button>
                </div>
              </div>
            </div>
          )}

          {isFailed && !isPaid && (
            <div className="text-center py-6 px-4 bg-rose-50/70 rounded-2xl border border-rose-200 animate-in fade-in duration-200">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-rose-900">Payment Failed</h3>
              <p className="text-sm text-rose-700 mt-1 max-w-sm mx-auto">
                Your previous payment attempt failed. As per our policy, you may try again.
              </p>
              <button
                onClick={handlePay}
                disabled={isPaying}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-md transition disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Payment</span>
              </button>
            </div>
          )}

          {!isPaid && !isPending && !isExpired && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Select Payment Method
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR', desc: 'Instant GooglePay/PhonePe' },
                    { id: 'card', label: 'Cards', desc: 'Debit / Credit' },
                    { id: 'netbanking', label: 'NetBanking', desc: 'All Major Banks' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedMethod === m.id
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="block text-xs font-bold text-slate-800">{m.label}</span>
                      <span className="text-[10px] text-slate-500">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={isPaying}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl active:scale-98 disabled:opacity-50 text-base"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Payment Request...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Pay {formatPaiseToRupees(link.amount)}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>PCI-DSS Compliant Payment Gateway Interface</span>
        </div>
      </div>
    </div>
  );
};
