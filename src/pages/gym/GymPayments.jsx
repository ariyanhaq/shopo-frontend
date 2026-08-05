/**
 * @file GymPayments.jsx
 * @description Gym fee recording, dues management & printable cash memo invoices.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard, Plus, Printer, DollarSign, Search, CheckCircle2,
  Wallet, ShieldAlert, FileText, ArrowUpRight
} from 'lucide-react';

import InvoiceModal from '@/components/gym/InvoiceModal';
import RecordPaymentModal from '@/components/gym/RecordPaymentModal';
import { INITIAL_GYM_PAYMENTS } from '@/data/gymData';

export default function GymPayments() {
  const { lang } = useLanguage();

  const [payments, setPayments] = useState(INITIAL_GYM_PAYMENTS);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const totalCollected = payments.reduce((acc, p) => acc + p.paid, 0);
  const totalPending = payments.reduce((acc, p) => acc + p.due, 0);
  const mobileBankingTotal = payments.filter(p => p.method === 'bKash' || p.method === 'Nagad' || p.method === 'Rocket').reduce((acc, p) => acc + p.paid, 0);
  const cashTotal = payments.filter(p => p.method === 'Cash').reduce((acc, p) => acc + p.paid, 0);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Paid' && p.status === 'Paid') ||
      (statusFilter === 'Partial' && p.due > 0);
    return matchesSearch && matchesStatus;
  });

  const handleRecordPayment = (newPayment) => {
    setPayments([newPayment, ...payments]);
  };

  return (
    <div className="space-y-6 font-sans font-normal text-slate-800 dark:text-zinc-200">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#00df89]" />
            <span>Payments & Dues Billing</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Record membership fee payments, issue cash memos & manage pending dues.
          </p>
        </div>

        <Button
          onClick={() => setIsRecordModalOpen(true)}
          className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs sm:text-sm h-11 px-4 gap-2 shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Record New Payment
        </Button>
      </div>

      {/* STATS SUMMARY ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Total Revenue Collected</span>
          <div className="mt-1 text-2xl font-normal text-emerald-600 dark:text-[#00df89]">৳ {totalCollected.toLocaleString()}</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Pending Dues Balance</span>
          <div className="mt-1 text-2xl font-normal text-rose-500">৳ {totalPending.toLocaleString()}</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Mobile Banking (bKash/Nagad)</span>
          <div className="mt-1 text-xl font-normal text-pink-500">৳ {mobileBankingTotal.toLocaleString()}</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Cash Payments</span>
          <div className="mt-1 text-xl font-normal text-slate-900 dark:text-white">৳ {cashTotal.toLocaleString()}</div>
        </Card>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice number or member name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#00df89] font-normal"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto">
          {['All', 'Paid', 'Partial'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === tab
                  ? 'bg-[#00df89] text-[#011812]'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
              }`}
            >
              {tab === 'Partial' ? 'Pending Dues' : tab}
            </button>
          ))}
        </div>
      </Card>

      {/* PAYMENTS HISTORY TABLE */}
      <Card className="p-0 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-medium text-sm text-slate-900 dark:text-white">Transaction & Billing Log</span>
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] text-xs font-normal">
            {filteredPayments.length} Receipts Listed
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-zinc-900/80 text-slate-500 font-normal uppercase text-[10px]">
              <tr>
                <th className="p-3.5 font-medium">Invoice #</th>
                <th className="p-3.5 font-medium">Member Name</th>
                <th className="p-3.5 font-medium">Package</th>
                <th className="p-3.5 font-medium">Amount Paid</th>
                <th className="p-3.5 font-medium">Due Balance</th>
                <th className="p-3.5 font-medium">Payment Method</th>
                <th className="p-3.5 font-medium">Status</th>
                <th className="p-3.5 text-right font-medium">Cash Memo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200 font-normal">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3.5 font-mono text-emerald-600 dark:text-[#00df89] font-medium">{p.id}</td>
                  <td className="p-3.5 font-medium text-slate-900 dark:text-white">{p.memberName}</td>
                  <td className="p-3.5 text-slate-500 font-normal">{p.package}</td>
                  <td className="p-3.5 font-medium text-slate-900 dark:text-white">৳ {p.paid.toLocaleString()}</td>
                  <td className={`p-3.5 font-medium ${p.due > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                    ৳ {p.due.toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-[11px]">
                      {p.method}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <Badge variant={p.status === 'Paid' ? 'default' : 'warning'} className="text-[10px] font-normal">
                      {p.status}
                    </Badge>
                  </td>

                  <td className="p-3.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoice(p)}
                      className="h-8 text-xs font-medium gap-1 dark:bg-zinc-900"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#00df89]" /> Print Memo
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODALS */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onRecordPayment={handleRecordPayment}
      />

      <InvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        payment={selectedInvoice}
      />

    </div>
  );
}
