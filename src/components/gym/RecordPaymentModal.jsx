import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { X, CreditCard, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export default function RecordPaymentModal({ isOpen, onClose, onRecordPayment, defaultMemberId = '' }) {
  useBodyScrollLock(isOpen);
  const { lang } = useLanguage();
  const [members, setMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    memberId: defaultMemberId || '',
    paymentType: 'Monthly Subscription Renewal',
    amount: 1500,
    paid: 1500,
    method: 'bKash',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) {
      const loadMembers = async () => {
        try {
          const res = await api.gym.members.list();
          if (res.data && res.data.length > 0) {
            setMembers(res.data);
            if (!defaultMemberId) {
              setFormData(prev => ({
                ...prev,
                memberId: res.data[0]._id,
                amount: res.data[0].monthlyFee || 1500,
                paid: res.data[0].monthlyFee || 1500,
              }));
            }
          }
        } catch (err) {
          console.warn('Failed to load members for payment modal:', err.message);
        }
      };
      loadMembers();
    }
  }, [isOpen, defaultMemberId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.memberId) {
      toast.error('Please select a member.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.gym.payments.create({
        member_id: formData.memberId,
        package_name: formData.paymentType,
        amount: parseFloat(formData.amount || 0),
        paid_amount: parseFloat(formData.paid || 0),
        due_amount: Math.max(0, parseFloat(formData.amount || 0) - parseFloat(formData.paid || 0)),
        payment_method: formData.method,
        payment_date: formData.date
      });

      toast.success(lang === 'bn' ? 'পেমেন্ট রেকর্ড সফলভাবে সংরক্ষিত হয়েছে!' : 'Gym payment recorded successfully!');
      if (onRecordPayment) {
        onRecordPayment(res.data);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to record gym fee payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Select Member</label>
            <Select
              value={formData.memberId}
              onValueChange={(val) => {
                const mem = members.find(m => m._id === val);
                setFormData(prev => ({
                  ...prev,
                  memberId: val,
                  amount: mem?.monthlyFee || prev.amount,
                  paid: mem?.monthlyFee || prev.paid,
                }));
              }}
            >
              <SelectTrigger className="w-full bg-slate-50 dark:bg-zinc-900">
                <SelectValue placeholder="Select Member" />
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m._id} value={m._id}>
                    {m.fullName} — {m.phone} ({m.membershipPackage})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Payment Purpose / Pass</label>
            <input
              type="text"
              value={formData.paymentType}
              onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#00df89]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Total Fee (৳)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#00df89]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Paid Amount (৳)</label>
              <input
                type="number"
                value={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#00df89]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Payment Method</label>
              <Select
                value={formData.method}
                onValueChange={(val) => setFormData({ ...formData, method: val })}
              >
                <SelectTrigger className="w-full bg-slate-50 dark:bg-zinc-900">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bKash">bKash</SelectItem>
                  <SelectItem value="Nagad">Nagad</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card / POS</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Payment Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#00df89]"
              />
            </div>
          </div>

          {/* Dues Preview */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 flex justify-between text-xs font-medium">
            <span className="text-slate-500 dark:text-zinc-400">Remaining Due:</span>
            <span className={Math.max(0, formData.amount - formData.paid) > 0 ? 'text-amber-500' : 'text-[#00a86b] dark:text-[#00df89]'}>
              ৳ {Math.max(0, formData.amount - formData.paid).toLocaleString()}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium rounded-xl text-xs flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{isSubmitting ? 'Saving...' : 'Record Payment in DB'}</span>
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}
