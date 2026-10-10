import React, { useState } from 'react';
import { PaymentLink } from '../types';
import { formatPaiseToRupees, formatDate } from '../utils/formatters';
import {
  Copy,
  Check,
  ExternalLink,
  Radio,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Webhook,
  Search,
  Filter,
} from 'lucide-react';

interface PaymentLinksTableProps {
  links: PaymentLink[];
  onOpenCustomerPay: (linkId: string) => void;
  onOpenWebhookWithPayment: (paymentId: string) => void;
  onRefresh: () => void;
}

export const PaymentLinksTable: React.FC<PaymentLinksTableProps> = ({
  links,
  onOpenCustomerPay,
  onOpenWebhookWithPayment,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleCopyLink = (linkId: string) => {
    const url = `${window.location.origin}/pay/${linkId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.linkId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.latestPayment?.paymentId &&
        link.latestPayment.paymentId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || link.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            PAID
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            EXPIRED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (paymentStatus?: string) => {
    if (!paymentStatus) {
      return <span className="text-xs text-slate-400 italic">No attempts</span>;
    }
    switch (paymentStatus) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Radio className="w-3 h-3 text-amber-500 animate-pulse" />
            PENDING
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" />
            SUCCESS
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3 h-3 text-rose-500" />
            FAILED
          </span>
        );
      default:
        return <span className="text-xs">{paymentStatus}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Link ID, Description, or Payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'ACTIVE', 'PAID', 'EXPIRED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === s
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Link Identifier</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Link Status</th>
              <th className="py-3.5 px-4">Latest Payment</th>
              <th className="py-3.5 px-4">Created</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredLinks.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Radio className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">No payment links found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'Try adjusting your search query or status filter.'
                        : 'Create your first payment link to start receiving payments.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLinks.map((link) => (
                <tr key={link.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {link.linkId}
                      </span>
                      <button
                        onClick={() => handleCopyLink(link.linkId)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                        title="Copy Checkout URL"
                      >
                        {copiedId === link.linkId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="py-4 px-4 max-w-xs">
                    <p className="font-medium text-slate-800 truncate" title={link.description}>
                      {link.description}
                    </p>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">
                        {formatPaiseToRupees(link.amount)}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {link.amount.toLocaleString('en-IN')} paise
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4">{getStatusBadge(link.status)}</td>

                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      {getPaymentStatusBadge(link.latestPayment?.status)}
                      {link.latestPayment && (
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                          {link.latestPayment.paymentId}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(link.createdAt)}
                  </td>

                  <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {link.latestPayment?.paymentId && (
                        <button
                          onClick={() => onOpenWebhookWithPayment(link.latestPayment!.paymentId)}
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition flex items-center gap-1"
                          title="Simulate Webhook for this payment"
                        >
                          <Webhook className="w-3 h-3" />
                          <span className="hidden lg:inline">Webhook</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenCustomerPay(link.linkId)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition flex items-center gap-1.5"
                        title="Open Customer Checkout Page"
                      >
                        <span>Customer Pay</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          Showing <span className="font-semibold text-slate-700">{filteredLinks.length}</span> of{' '}
          <span className="font-semibold text-slate-700">{links.length}</span> payment links
        </span>
        <span className="text-slate-400">
          Amounts stored in integer paise &bull; Links change to PAID automatically when webhook arrives
        </span>
      </div>
    </div>
  );
};
