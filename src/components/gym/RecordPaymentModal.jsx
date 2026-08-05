/**
 * @file RecordPaymentModal.jsx
 * @description Modal dialog for recording monthly subscription renewals, admission fees & gym merchandise billing.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { X, CreditCard, DollarSign, CheckCircle2, ShieldCheck } from 'lucide-react';
import { INITIAL_GYM_MEMBERS } from '@/data/gymData';

export default function RecordPaymentModal({ isOpen, onClose, onRecordPayment }) {
  const { lang } = useLanguage();

  const [formData, setFormData] = useState({
    memberId: 'GM-1001',
    paymentType: 'Monthly Subscription Renewal',
    amount: 1500,
    paid: 1500,
    method: 'bKash',
    date: new Date().toISOString().split('T')[0]
  });

  if (!isOpen) return null;

  const selectedMember = INITIAL_GYM_MEMBERS.find(m => m.id === formData.memberId) || INITIAL_GYM_MEMBERS[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    const paidNum = parseFloat(formData.paid);
    const totalNum = parseFloat(formData.amount);
    const dueNum = Math.max(0, totalNum - paidNum);

    const newPayment = {
      id: `INV-GYM-${Math.floor(900 + Math.random() * 900)}`,
      memberId: formData.memberId,
      memberName: selectedMember.fullName,
      package: formData.paymentType,
      amount: totalNum,
      paid: paidNum,
      due: dueNum,
      date: formData.date,
      method: formData.method,
      status: dueNum === 0 ? 'Paid' : 'Partial'
    };

    onRecordPayment(newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans font-normal text-slate-800 dark:text-zinc-200">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#00df89]" />
            <span className="font-medium text-base text-slate-900 dark:text-white">Record Gym Payment / Subscription</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-normal">
          <div>
            <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Select Member</label>
            <select
              value={formData.memberId}
              onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
            >
              {INITIAL_GYM_MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>{m.fullName} ({m.phone})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Payment Purpose / Subscription Type</label>
            <select
              value={formData.paymentType}
              onChange={(e) => {
                const val = e.target.value;
                let price = 1500;
                if (val.includes('Admission')) price = 2500; // 1000 admission + 1500 sub
                if (val.includes('Personal Trainer')) price = 3000;
                setFormData({ ...formData, paymentType: val, amount: price, paid: price });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
            >
              <option value="Monthly Subscription Renewal">Monthly Subscription Renewal (মাসিক সাবস্ক্রিপশন নবায়ন)</option>
              <option value="New Member Admission + 1st Month Subscription">New Member Admission + 1st Month Subscription (ভর্তি ফি + ১ মাসের সাবস্ক্রিপশন)</option>
              <option value="Personal Trainer Monthly Fee">Personal Trainer Monthly Fee (পার্সোনাল ট্রেইনার ফি)</option>
              <option value="Merchandise & Supplements Purchase">Merchandise & Supplements Purchase (মালামাল ক্রয়)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Total Amount Due (৳)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Amount Paid Now (৳)</label>
              <input
                type="number"
                value={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Payment Method</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
            >
              <option value="bKash">bKash Mobile Banking</option>
              <option value="Nagad">Nagad Mobile Banking</option>
              <option value="Rocket">Rocket</option>
              <option value="Cash">Cash Receipt</option>
              <option value="Card">Credit / Debit Card</option>
              <option value="Bank">Bank Transfer</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <Button variant="outline" type="button" onClick={onClose} className="text-xs font-medium">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs px-5 gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Save & Issue Subscription Memo
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
