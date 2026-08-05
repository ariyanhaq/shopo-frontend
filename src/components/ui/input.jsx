/**
 * @file input.jsx
 * @description Shadcn UI inspired Input primitive component.
 */
import * as React from 'react';

const Input = React.forwardRef(({ className = '', type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm font-semibold ring-offset-background placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00df89] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
