/**
 * @file GymPayments.jsx
 * @description Gym fee recording, dues management & printable cash memo invoices backed by MongoDB.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard, Plus, Printer, DollarSign, Search, CheckCircle2,
  Wallet, FileText, ArrowUpRight, Loader2
} from 'lucide-react';

import InvoiceModal from '@/components/gym/InvoiceModal';
import RecordPaymentModal from '@/components/gym/RecordPaymentModal';

export default function GymPayments() {
  const { lang } = useLanguage();

  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchPayments = async () => {
    try {
      const res = await api.gym.payments.list();
      if (res.data) {
        setPayments(res.data);
      }
    } catch (err) {
      console.warn('Failed to load gym payments:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalCollected = payments.reduce((acc, p) => acc + (p.paid || 0), 0);
  const totalPending = payments.reduce((acc, p) => acc + (p.due || 0), 0);
  const mobileBankingTotal = payments
    .filter(p => p.method === 'bKash' || p.method === 'Nagad' || p.method === 'Rocket')
    .reduce((acc, p) => acc + (p.paid || 0), 0);
  const cashTotal = payments
    .filter(p => p.method === 'Cash')
    .reduce((acc, p) => acc + (p.paid || 0), 0);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.memberName && p.memberName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Paid' && p.status === 'Paid') ||
      (statusFilter === 'Partial' && p.due > 0);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'পেমেন্ট ও বিলিং লেজার' : 'Gym Payments & Billing Ledger'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'ফি পেমেন্ট জমা, ইনভয়েস তৈরি ও বকেয়া হিসাব' : 'Record membership fee payments, issue invoices & track dues'}
          </p>
        </div>

        <Button
          onClick={() => setIsRecordModalOpen(true)}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'ফি গ্রহণ করুন' : 'Record Fee Payment'}</span>
        </Button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Total Collected</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">৳ {totalCollected.toLocaleString()}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-amber-500">Pending Dues</div>
          <div className="text-2xl font-medium text-amber-500 mt-1">৳ {totalPending.toLocaleString()}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">bKash & Mobile Money</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">৳ {mobileBankingTotal.toLocaleString()}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Cash Collections</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">৳ {cashTotal.toLocaleString()}</div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'ইনভয়েস বা সদস্যের নাম দিয়ে খুঁজুন...' : 'Search by invoice or athlete name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Paid', 'Partial'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-zinc-800'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Loading live payment ledger...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CreditCard className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Payments Recorded Yet</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Use 'Record Fee Payment' above to record initial collections.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Athlete Name</th>
                  <th className="p-3.5">Plan / Description</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Paid (৳)</th>
                  <th className="p-3.5">Due (৳)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">{p.invoiceNumber}</td>
                    <td className="p-3.5 text-slate-800 dark:text-zinc-200">{p.memberName}</td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-300">{p.package_name}</td>
                    <td className="p-3.5 text-slate-500">{p.date}</td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-300">{p.method}</td>
                    <td className="p-3.5 font-medium text-[#00a86b] dark:text-[#00df89]">৳ {(p.paid || 0).toLocaleString()}</td>
                    <td className="p-3.5 font-medium text-slate-700 dark:text-zinc-300">৳ {(p.due || 0).toLocaleString()}</td>
                    <td className="p-3.5">
                      <Badge variant={p.status === 'Paid' ? 'default' : 'warning'} className="text-[10px]">
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedInvoice(p)}
                        className="h-7 text-xs gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onRecordPayment={fetchPayments}
      />

      {/* Printable Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        payment={selectedInvoice}
      />

    </div>
  );
}
