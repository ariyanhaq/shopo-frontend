/**
 * @file button.jsx
 * @description Shadcn UI inspired Button primitive component with pitch dark charcoal dark mode colors.
 */
import * as React from 'react';

const variantStyles = {
  default: 'bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium shadow-xs active:scale-95',
  primary: 'bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium shadow-xs active:scale-95',
  secondary: 'bg-slate-100 dark:bg-zinc-800/60 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-medium',
  outline: 'border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 font-medium shadow-xs',
  ghost: 'hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 font-medium',
  destructive: 'bg-rose-500 hover:bg-rose-600 text-white font-medium shadow-xs active:scale-95',
  link: 'text-[#00a86b] dark:text-[#00df89] underline-offset-4 hover:underline font-medium p-0 h-auto'
};

const sizeStyles = {
  default: 'h-10 px-4 py-2 text-xs sm:text-sm rounded-xl',
  sm: 'h-8 px-3 text-xs rounded-lg',
  lg: 'h-11 px-5 text-xs sm:text-sm rounded-xl',
  icon: 'h-8 w-8 p-0 rounded-xl'
};

const Button = React.forwardRef(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const variantClass = variantStyles[variant] || variantStyles.default;
    const sizeClass = sizeStyles[size] || sizeStyles.default;

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 font-sans transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#00df89]/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variantClass} ${sizeClass} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
