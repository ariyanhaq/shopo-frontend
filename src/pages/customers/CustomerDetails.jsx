/**
 * @file CustomerDetails.jsx
 * @description Customer Profile, Purchase History and ledger connected directly to MongoDB.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, Mail, MapPin, ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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
    if (id) load();
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
      <div className="space-y-4 font-sans">
        <Button variant="outline" size="sm" onClick={() => navigate('/customers')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Card className="p-8 text-center text-slate-400">Customer not found.</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <Button variant="outline" size="sm" onClick={() => navigate('/customers')} className="gap-1 text-xs dark:bg-zinc-900">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Button>

      {/* CUSTOMER PROFILE HEADER */}
      <Card className="p-6 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium text-lg border border-emerald-500/20">
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-medium text-slate-900 dark:text-white">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {customer.phone}</span>
              {customer.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {customer.address}</span>}
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
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Items</th>
                <th className="p-3.5 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {sales.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                  <td className="p-3.5 font-medium text-slate-900 dark:text-white">{s.invoice_number}</td>
                  <td className="p-3.5 text-slate-500">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="p-3.5 text-slate-600 dark:text-zinc-300">
                    {s.items?.map(i => `${i.name} (${i.quantity})`).join(', ')}
                  </td>
                  <td className="p-3.5 text-right font-medium text-[#00a86b] dark:text-[#00df89]">
                    ৳ {(s.total || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
