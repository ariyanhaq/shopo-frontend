/**
 * @file badge.jsx
 * @description Shadcn UI inspired Badge primitive component.
 */
import * as React from 'react';

const badgeVariants = {
  default: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  lime: 'bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-500/20',
  secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  destructive: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  outline: 'text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800'
};

function Badge({ className = '', variant = 'default', ...props }) {
  const variantClass = badgeVariants[variant] || badgeVariants.default;
  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClass} ${className}`}
      {...props}
    />
  );
}

export { Badge };
