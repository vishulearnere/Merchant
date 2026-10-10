import React, { useState, useEffect } from 'react';
import { PaymentLink } from '../types';
import { api } from '../services/api';
import { formatPaiseToRupees } from '../utils/formatters';
import { PaymentLinksTable } from './PaymentLinksTable';
import { CreatePaymentLinkModal } from './CreatePaymentLinkModal';
import { WebhookSimulatorModal } from './WebhookSimulatorModal';
import {
  Plus,
  RefreshCw,
  IndianRupee,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface DashboardProps {
  onOpenCustomerPay: (linkId: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (val: boolean) => void;
  isWebhookModalOpen: boolean;
  setIsWebhookModalOpen: (val: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenCustomerPay,
  isCreateModalOpen,
  setIsCreateModalOpen,
  isWebhookModalOpen,
  setIsWebhookModalOpen,
}) => {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedPaymentIdForWebhook, setSelectedPaymentIdForWebhook] = useState<string>('');

  const fetchLinks = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const data = await api.getPaymentLinks();
      setLinks(data);
    } catch (err) {
      console.error('Failed to load links:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  useEffect(() => {
    let interval: number | null = null;
    if (autoRefresh) {
      interval = window.setInterval(() => {
        fetchLinks(true);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleCreated = (newLink: PaymentLink) => {
    setLinks((prev) => [newLink, ...prev]);
  };

  const handleOpenWebhookForPayment = (paymentId: string) => {
    setSelectedPaymentIdForWebhook(paymentId);
    setIsWebhookModalOpen(true);
  };

  const totalVolumePaise = links
    .filter((l) => l.status === 'PAID')
    .reduce((sum, l) => sum + l.amount, 0);

  const activeCount = links.filter((l) => l.status === 'ACTIVE').length;
  const paidCount = links.filter((l) => l.status === 'PAID').length;
  const totalCount = links.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Merchant Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate instant checkout links, track webhook receipts, and manage customer settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title="Toggles 5-second automatic status polling"
          >
            {autoRefresh ? (
              <ToggleRight className="w-5 h-5 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-slate-400" />
            )}
            <span>Auto-Refresh {autoRefresh ? 'On (5s)' : 'Off'}</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-blue-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Payment Link</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Settled Volume
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 block">
              {formatPaiseToRupees(totalVolumePaise)}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {totalVolumePaise.toLocaleString('en-IN')} paise
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Completed Payments
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 block">
              {paidCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              Status marked PAID
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Active Links
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-amber-600 font-semibold">
              Ready to be paid
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Links Created
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-slate-400">
              All statuses combined
            </span>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Payment Links Directory</h2>
          <button
            onClick={() => fetchLinks()}
            disabled={isRefreshing}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Table</span>
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Loading payment links...</p>
          </div>
        ) : (
          <PaymentLinksTable
            links={links}
            onOpenCustomerPay={onOpenCustomerPay}
            onOpenWebhookWithPayment={handleOpenWebhookForPayment}
            onRefresh={() => fetchLinks()}
          />
        )}
      </section>

      <CreatePaymentLinkModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreated}
      />

      <WebhookSimulatorModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        defaultPaymentId={selectedPaymentIdForWebhook}
        onWebhookSent={() => fetchLinks(true)}
      />
    </div>
  );
};
