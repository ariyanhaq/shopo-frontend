/**
 * @file dropdown-menu.jsx
 * @description Smooth, modern Shadcn-style Dropdown Menu component with Framer Motion animations, dark mode support, and keyboard/click-outside handlers.
 */
import { useState, useRef, useEffect, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const DropdownContext = createContext(null);

export function DropdownMenu({ children, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={menuRef} className={cn("relative block text-left w-full max-w-full", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild, className, ...props }) {
  const { isOpen, setIsOpen } = useContext(DropdownContext);

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn("w-full inline-flex items-center justify-center cursor-pointer outline-none", className)}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  align = 'right', // 'left' | 'right' | 'center'
  className,
  width = 'w-56',
}) {
  const { isOpen, setIsOpen } = useContext(DropdownContext);

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className={cn(
            "absolute z-[100] mt-1.5 rounded-2xl bg-white dark:bg-[#18181b] border border-slate-200/90 dark:border-zinc-800 shadow-2xl p-1.5 text-slate-900 dark:text-zinc-100 text-xs backdrop-blur-md focus:outline-none",
            width,
            alignClasses[align],
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled = false,
  variant = 'default', // 'default' | 'danger' | 'success'
  className,
  ...props
}) {
  const { setIsOpen } = useContext(DropdownContext);

  const variantStyles = {
    default: 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-white',
    danger: 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300',
    success: 'text-[#00a86b] dark:text-[#00df89] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-[#00c97b]',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
        setIsOpen(false);
      }}
      className={cn(
        "w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left font-medium transition-all duration-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({ children, className }) {
  return (
    <div className={cn("px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500", className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }) {
  return <div className={cn("my-1 h-px bg-slate-100 dark:bg-zinc-800", className)} />;
}
