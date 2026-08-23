/**
 * @file InvoiceModal.jsx
 * @description Printable payment receipt and official invoice modal for gym memberships.
 */
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Printer, Download, CheckCircle2, Dumbbell, ShieldCheck } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export default function InvoiceModal({ isOpen, onClose, payment }) {
  useBodyScrollLock(isOpen && Boolean(payment));
  const { lang } = useLanguage();

  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#00df89]" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">Official Gym Cash Memo</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Memo Content */}
        <div className="p-6 overflow-y-auto space-y-6 print:p-0 font-sans">
          
          {/* Gym Brand Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-[#00df89] font-extrabold text-xl">
                <Dumbbell className="w-6 h-6 stroke-[2.5]" />
                <span>Shopo Gym & Fitness</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Level 4, Banani Super Market, Dhaka</p>
              <p className="text-xs text-slate-500">Hotline: +880 1700-GYMFIT • www.shopogym.bd</p>
            </div>

            <div className="text-right">
              <Badge className="bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] border border-emerald-500/20 text-xs px-2.5 py-1">
                RECEIPT #{payment.id}
              </Badge>
              <p className="text-xs text-slate-400 mt-2 font-mono">{payment.date}</p>
            </div>
          </div>

          {/* Member Details */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <div>
              <span className="text-slate-400 block font-medium">Billed To Member:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">{payment.memberName}</span>
              <span className="text-slate-500">Member ID: {payment.memberId}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Payment Method:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">{payment.method}</span>
              <span className="text-emerald-600 font-semibold">Status: {payment.status}</span>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200 font-medium">
                <tr>
                  <td className="p-3">
                    <span className="font-bold">{payment.package}</span>
                    <span className="block text-[11px] text-slate-400">Gym Membership Renewal & Access Pass</span>
                  </td>
                  <td className="p-3 text-right font-bold">৳ {payment.amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-2 text-xs">
            <div className="w-48 space-y-1.5 font-medium">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>৳ {payment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Paid:</span>
                <span className="text-emerald-600 font-bold">৳ {payment.paid.toLocaleString()}</span>
              </div>
              {payment.due > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Due Balance:</span>
                  <span>৳ {payment.due.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 dark:text-white font-extrabold text-sm pt-2 border-t border-slate-200 dark:border-zinc-800">
                <span>Total Paid:</span>
                <span className="text-emerald-600 dark:text-[#00df89]">৳ {payment.paid.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-400">
            Thank you for training with Shopo Gym! Keep crushing your fitness goals.
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button onClick={handlePrint} className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-bold gap-2">
            <Printer className="w-4 h-4" /> Print Cash Memo
          </Button>
        </div>

      </div>
    </div>
  );
}
