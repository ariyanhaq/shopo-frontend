/**
 * @file CustomerDetails.jsx
 * @description Customer Profile, Purchase History and ledger connected directly to MongoDB.
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/common/Pagination';
import ReturnOrderModal from '@/components/sales/ReturnOrderModal';
import { Users, Phone, Mail, MapPin, ArrowLeft, ShoppingCart, Loader2, Undo2 } from 'lucide-react';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [returningSale, setReturningSale] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sales.slice(start, start + pageSize);
  }, [sales, currentPage, pageSize]);

  const loadData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.customers.getById(id),
        api.sales.list({ customer_id: id }).catch(() => ({ data: [] })),
      ]);
      if (cRes.data) setCustomer(cRes.data);
      if (sRes.data) setSales(sRes.data);
    } catch (err) {
      console.warn('Failed to load customer profile:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
        Loading customer profile...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-12 text-center space-y-3">
        <h2 className="text-base font-medium text-slate-800 dark:text-zinc-200">Customer Not Found</h2>
        <Button onClick={() => navigate('/customers')} className="text-xs">Back to Customer Directory</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-12">
      <Button variant="outline" size="sm" onClick={() => navigate('/customers')} className="gap-1.5 text-xs font-medium dark:bg-zinc-900 cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Button>

      {/* HEADER HERO */}
      <Card className="p-6 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium text-xl">
            {customer.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-medium text-slate-900 dark:text-white flex items-center gap-2">
              <span>{customer.name}</span>
              <Badge variant="default" className="text-[10px]">{customer.customer_type || 'Retail'}</Badge>
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {customer.phone || 'N/A'}</span>
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {customer.email || 'N/A'}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {customer.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">Total Purchase History</div>
          <div className="text-2xl font-medium text-[#00a86b] dark:text-[#00df89]">৳ {(customer.total_spent || 0).toLocaleString()}</div>
        </div>
      </Card>

      {/* SALES HISTORY TABLE */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 font-medium text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#00df89]" />
          <span>Purchase History & Invoices</span>
        </div>

        {sales.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No purchase records found for this customer.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5 text-right">Amount (৳)</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {paginatedSales.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">{s.invoice_number}</td>
                    <td className="p-3.5 text-slate-500">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-300">
                      {s.items?.map(i => `${i.name} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="p-3.5 text-right font-medium text-[#00a86b] dark:text-[#00df89]">
                      ৳ {(s.total || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setReturningSale(s)}
                        className="h-8 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="Return items from this purchase"
                      >
                        <Undo2 className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'রিটার্ন' : 'Return'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sales.length > pageSize && (
              <Pagination
                currentPage={currentPage}
                totalItems={sales.length}
                pageSize={pageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        )}
      </Card>

      {/* Return & Refund Modal */}
      <ReturnOrderModal
        isOpen={Boolean(returningSale)}
        onClose={() => setReturningSale(null)}
        order={returningSale}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
