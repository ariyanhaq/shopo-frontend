/**
 * @file ReturnOrderModal.jsx
 * @description Reusable Modal Component for processing item returns and refunds on sales orders.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Undo2, X, Minus, Plus, Coins, Loader2 } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const getItemDocId = (val) => {
  if (!val) return '';
  if (typeof val === 'object') {
    return String(val._id || val.id || '');
  }
  return String(val);
};

const safeMoney = (val, fallback = 0) => {
  const n = parseFloat(val);
  return isNaN(n) ? fallback.toLocaleString() : n.toLocaleString();
};

export default function ReturnOrderModal({ isOpen, onClose, order, onSuccess }) {
  const { lang } = useLanguage();
  useBodyScrollLock(isOpen);

  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnReason, setReturnReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      const returnedMap = {};
      if (Array.isArray(order.return_history)) {
        order.return_history.forEach((rev) => {
          (rev.items || []).forEach((rit) => {
            const prodId = getItemDocId(rit.product_id);
            const varId = getItemDocId(rit.variant_id);
            const key = `${prodId}_${varId || 'none'}`;
            returnedMap[key] = (returnedMap[key] || 0) + (rit.quantity || 0);
          });
        });
      }

      const initialQty = {};
      (order.items || []).forEach((it) => {
        const prodId = getItemDocId(it.product_id);
        const varId = getItemDocId(it.variant_id);
        const key = `${prodId}_${varId || 'none'}`;
        const alreadyReturned = returnedMap[key] || 0;
        const maxAvailable = Math.max(0, (it.quantity || 0) - alreadyReturned);
        initialQty[key] = maxAvailable;
      });

      setReturnQuantities(initialQty);
      setReturnReason('');
    }
  }, [order, isOpen]);

  const returnSummary = useMemo(() => {
    if (!order || !Array.isArray(order.items)) {
      return { totalReturnGross: 0, netRefund: 0, pointsToDeduct: 0, pointsToRefund: 0, itemsCount: 0, dueReduction: 0, cashRefund: 0 };
    }

    let totalReturnGross = 0;
    let itemsCount = 0;

    (order.items || []).forEach((it) => {
      const prodId = getItemDocId(it.product_id);
      const varId = getItemDocId(it.variant_id);
      const key = `${prodId}_${varId || 'none'}`;
      const qty = Number(returnQuantities[key]) || 0;
      if (qty > 0) {
        totalReturnGross += (Number(it.unit_price) || 0) * qty;
        itemsCount += qty;
      }
    });

    const discountRatio = order.subtotal > 0 ? Math.min(1, totalReturnGross / order.subtotal) : 0;
    const generalDiscountRefund = (order.discount || 0) * discountRatio;
    const tierDiscountRefund = (order.tier_discount_amount || 0) * discountRatio;
    const rewardDiscountRefund = (order.reward_discount_amount || 0) * discountRatio;

    const netRefund = Math.max(0, Math.round((totalReturnGross - generalDiscountRefund - tierDiscountRefund - rewardDiscountRefund) * 100) / 100);
    const pointsToDeduct = Math.round((order.reward_points_earned || 0) * discountRatio);
    const pointsToRefund = Math.round((order.reward_points_redeemed || 0) * discountRatio);

    let dueReduction = 0;
    let cashRefund = 0;
    const currentDue = order.due_amount || 0;

    if (currentDue > 0) {
      if (netRefund <= currentDue) {
        dueReduction = netRefund;
      } else {
        dueReduction = currentDue;
        cashRefund = netRefund - currentDue;
      }
    } else {
      cashRefund = netRefund;
    }

    return {
      totalReturnGross,
      netRefund,
      pointsToDeduct,
      pointsToRefund,
      itemsCount,
      dueReduction,
      cashRefund,
    };
  }, [order, returnQuantities]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (returnSummary.itemsCount <= 0) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে ফেরত দেওয়ার জন্য পণ্য নির্বাচন করুন।' : 'Please select at least 1 item to return.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadItems = (order.items || []).map((it) => {
        const prodId = getItemDocId(it.product_id);
        const varId = getItemDocId(it.variant_id);
        const key = `${prodId}_${varId || 'none'}`;
        const qty = Number(returnQuantities[key]) || 0;
        return {
          product_id: prodId,
          name: it.name,
          variant_id: varId || undefined,
          variant_name: it.variant_name || '',
          quantity: qty,
        };
      }).filter((it) => it.quantity > 0);

      await api.sales.return(order._id, {
        items: payloadItems,
        reason: returnReason,
      });

      toast.success(
        lang === 'bn'
          ? `পণ্য ফেরত ও রিফান্ড সম্পন্ন! রিফান্ড: ৳${returnSummary.netRefund.toLocaleString()}`
          : `Return processed successfully! Refund: ৳${returnSummary.netRefund.toLocaleString()}`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error processing return:', err);
      toast.error(err.response?.data?.message || (lang === 'bn' ? 'রিটার্ন প্রসেস করতে ব্যর্থ হয়েছে' : 'Failed to process return'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <Card className="max-w-xl w-full p-6 bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500 shrink-0">
              <Undo2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{lang === 'bn' ? 'পণ্য ফেরত ও রিফান্ড' : 'Return & Refund Sale'}</span>
                <Badge variant="outline" className="text-[10px] font-mono border-rose-500/30 text-rose-500">
                  {order.invoice_number}
                </Badge>
              </h2>
              <p className="text-xs text-slate-400">
                {order.customer_id?.name || order.customer_name || (lang === 'bn' ? 'খুচরা ক্রেতা' : 'Walk-in Customer')}
                {order.customer_id?.phone || order.customer_phone ? ` • ${order.customer_id?.phone || order.customer_phone}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Items Return Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'ফেরত দেওয়ার পণ্য ও পরিমাণ নির্বাচন করুন:' : 'Select Items & Quantities to Return:'}
              </span>
              <span className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'স্টক স্বয়ংক্রিয়ভাবে ইনভেন্টরিতে জমা হবে' : 'Stock will be auto-restored to inventory'}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800/80 bg-slate-50 dark:bg-[#09090b] overflow-hidden">
              {order.items?.map((it, idx) => {
                const prodId = getItemDocId(it.product_id);
                const varId = getItemDocId(it.variant_id);
                const key = `${prodId}_${varId || 'none'}`;
                const currentQty = returnQuantities[key] || 0;

                let alreadyReturned = 0;
                if (Array.isArray(order.return_history)) {
                  order.return_history.forEach((rev) => {
                    (rev.items || []).forEach((rit) => {
                      const rProdId = getItemDocId(rit.product_id);
                      const rVarId = getItemDocId(rit.variant_id);
                      if (rProdId === prodId && (rVarId || 'none') === (varId || 'none')) {
                        alreadyReturned += rit.quantity || 0;
                      }
                    });
                  });
                }
                const maxReturnable = Math.max(0, (it.quantity || 0) - alreadyReturned);

                return (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs truncate">{it.name}</span>
                        {it.variant_name && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#00df89] border border-emerald-500/20">
                            {it.variant_name}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Unit: ৳{safeMoney(it.unit_price)}</span>
                        <span>•</span>
                        <span>Sold: {it.quantity}</span>
                        {alreadyReturned > 0 && (
                          <span className="text-amber-500 font-medium">(Prev. Returned: {alreadyReturned})</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={currentQty <= 0}
                        onClick={() => setReturnQuantities((prev) => ({ ...prev, [key]: Math.max(0, currentQty - 1) }))}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={maxReturnable}
                        value={currentQty}
                        onChange={(e) => {
                          const val = Math.min(maxReturnable, Math.max(0, parseInt(e.target.value) || 0));
                          setReturnQuantities((prev) => ({ ...prev, [key]: val }));
                        }}
                        className="w-12 h-7 text-center font-bold font-mono rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs outline-none"
                      />
                      <button
                        type="button"
                        disabled={currentQty >= maxReturnable}
                        onClick={() => setReturnQuantities((prev) => ({ ...prev, [key]: Math.min(maxReturnable, currentQty + 1) }))}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Return Impact Summary Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="font-semibold text-slate-700 dark:text-zinc-300 pb-1 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
              <span>{lang === 'bn' ? 'রিফান্ড ও হিসাবের প্রভাব' : 'Return & Refund Breakdown'}</span>
              <Badge variant="outline" className="text-[10px] font-medium">
                {returnSummary.itemsCount} {lang === 'bn' ? 'টি পণ্য ফেরত' : 'items returning'}
              </Badge>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>{lang === 'bn' ? 'মোট পণ্যের মূল্য:' : 'Gross Items Subtotal:'}</span>
                <span>৳ {safeMoney(returnSummary.totalReturnGross)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>{lang === 'bn' ? 'ডিসকাউন্ট সমন্বয়:' : 'Discount Adjustment:'}</span>
                  <span>- ৳ {safeMoney(returnSummary.totalReturnGross - returnSummary.netRefund)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-zinc-800">
                <span>{lang === 'bn' ? 'মোট রিফান্ড পরিমাণ:' : 'Net Refund Amount:'}</span>
                <span className="text-rose-600 dark:text-rose-400">৳ {safeMoney(returnSummary.netRefund)}</span>
              </div>

              {/* Settlement split */}
              <div className="pt-1 text-[11px] space-y-0.5 border-t border-dashed border-slate-200 dark:border-zinc-800">
                {returnSummary.dueReduction > 0 && (
                  <div className="flex justify-between text-amber-600 font-medium">
                    <span>{lang === 'bn' ? 'বকেয়া থেকে কর্তন:' : 'Due Deducted / Cancelled:'}</span>
                    <span>- ৳ {safeMoney(returnSummary.dueReduction)}</span>
                  </div>
                )}
                {returnSummary.cashRefund > 0 && (
                  <div className="flex justify-between text-slate-700 dark:text-zinc-300 font-semibold">
                    <span>{lang === 'bn' ? 'ক্যাশ/পেমেন্ট ফেরত:' : 'Cash / Payment Refund to Customer:'}</span>
                    <span>৳ {safeMoney(returnSummary.cashRefund)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Loyalty Points Clawback Warning */}
            {returnSummary.pointsToDeduct > 0 && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                <Coins className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? `কাস্টমারের অর্জিত পয়েন্ট থেকে ${returnSummary.pointsToDeduct} পয়েন্ট কর্তন হবে।`
                    : `${returnSummary.pointsToDeduct} earned loyalty points will be deducted from customer.`}
                </span>
              </div>
            )}
          </div>

          {/* Return Reason */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
              {lang === 'bn' ? 'পণ্য ফেরত নেওয়ার কারণ (ঐচ্ছিক)' : 'Return Reason / Notes (Optional)'}
            </label>
            <input
              type="text"
              placeholder={lang === 'bn' ? 'যেমন: ডিফেক্টিভ পণ্য, ভুল সাইজ, কাস্টমার পছন্দ করেনি' : 'e.g. Defective item, size mismatch, customer mind changed'}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || returnSummary.itemsCount <= 0}
              size="sm"
              className="bg-rose-500 hover:bg-rose-600 text-white font-bold gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
              <span>{lang === 'bn' ? 'ফেরত নিশ্চিত করুন' : 'Confirm Return & Refund'}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
