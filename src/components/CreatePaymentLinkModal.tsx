import React, { useState } from 'react';
import { CreateLinkInput, PaymentLink } from '../types';
import { api } from '../services/api';
import { rupeesToPaise, formatPaiseToRupees } from '../utils/formatters';
import { X, IndianRupee, FileText, Clock, AlertCircle, Sparkles } from 'lucide-react';

interface CreatePaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newLink: PaymentLink) => void;
}

export const CreatePaymentLinkModal: React.FC<CreatePaymentLinkModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [rupees, setRupees] = useState<string>('500');
  const [description, setDescription] = useState<string>('');
  const [expiryHours, setExpiryHours] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculatedPaise = rupeesToPaise(rupees);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (calculatedPaise <= 0) {
      setError('Amount must be greater than ₹0 (at least 100 paise / ₹1).');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateLinkInput = {
        amount: calculatedPaise,
        description: description.trim(),
        expiresInMinutes: Number(expiryHours) > 0 ? Number(expiryHours) * 60 : undefined,
      };

      const result = await api.createPaymentLink(payload);
      onCreated(result);
      onClose();
      setRupees('500');
      setDescription('');
      setExpiryHours('0');
    } catch (err: any) {
      setError(err?.message || 'Failed to create payment link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create New Payment Link</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates an ACTIVE link for customer payment checkout
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Amount (in ₹ Rupees)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="1"
                value={rupees}
                onChange={(e) => setRupees(e.target.value)}
                required
                placeholder="500.00"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 text-base font-semibold transition"
              />
            </div>

            <div className="mt-2 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                API Payload Value (Paise):
              </span>
              <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                {calculatedPaise.toLocaleString('en-IN')} paise
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Payment Description
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
                placeholder="e.g. Website redesign 50% deposit, Consulting session invoice #108..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 text-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Link Expiration (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Clock className="w-4 h-4" />
              </div>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 text-sm bg-white transition"
              >
                <option value="0">Never expires</option>
                <option value="0.25">Expires in 15 minutes</option>
                <option value="1">Expires in 1 hour</option>
                <option value="24">Expires in 24 hours</option>
                <option value="72">Expires in 3 days</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Link...</span>
                </>
              ) : (
                <span>Generate Link ({formatPaiseToRupees(calculatedPaise)})</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
