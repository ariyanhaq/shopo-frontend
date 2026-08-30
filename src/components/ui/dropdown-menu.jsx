/**
 * @file dropdown-menu.jsx
 * @description Smooth, modern Shadcn-style Dropdown Menu component with Framer Motion animations, dark mode support, and keyboard/click-outside handlers.
 */
import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
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
    <DropdownContext.Provider value={{ isOpen, setIsOpen, menuRef }}>
      <div
        ref={menuRef}
        className={cn(
          "relative inline-block text-left",
          isOpen ? "z-50" : "z-auto",
          className
        )}
      >
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild, className, ...props }) {
  const { isOpen, setIsOpen } = useContext(DropdownContext);

  const handleClick = (e) => {
    if (props.onClick) props.onClick(e);
    setIsOpen(!isOpen);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        if (children.props.onClick) children.props.onClick(e);
        handleClick(e);
      },
      'aria-expanded': isOpen,
      className: cn(children.props.className, className),
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
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
  align = 'right', // 'left' | 'right' | 'start' | 'end' | 'center'
  side = 'auto', // 'auto' | 'top' | 'bottom'
  className,
  width = 'w-52',
}) {
  const { isOpen, setIsOpen, menuRef } = useContext(DropdownContext);
  const [placementSide, setPlacementSide] = useState(side === 'top' ? 'top' : 'bottom');

  useEffect(() => {
    if (isOpen && menuRef?.current) {
      if (side === 'top') {
        setPlacementSide('top');
      } else if (side === 'bottom') {
        setPlacementSide('bottom');
      } else {
        // Auto-detect based on screen viewport space below trigger
        const rect = menuRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const estimatedHeight = 240;
        if (spaceBelow < estimatedHeight && rect.top > estimatedHeight) {
          setPlacementSide('top');
        } else {
          setPlacementSide('bottom');
        }
      }
    }
  }, [isOpen, side, menuRef]);

  const isTop = placementSide === 'top';

  const alignClasses = {
    left: isTop ? 'left-0 bottom-full mb-1.5 mt-0 origin-bottom-left' : 'left-0 top-full mt-1.5 origin-top-left',
    start: isTop ? 'left-0 bottom-full mb-1.5 mt-0 origin-bottom-left' : 'left-0 top-full mt-1.5 origin-top-left',
    right: isTop ? 'right-0 bottom-full mb-1.5 mt-0 origin-bottom-right' : 'right-0 top-full mt-1.5 origin-top-right',
    end: isTop ? 'right-0 bottom-full mb-1.5 mt-0 origin-bottom-right' : 'right-0 top-full mt-1.5 origin-top-right',
    center: isTop ? 'left-1/2 -translate-x-1/2 bottom-full mb-1.5 mt-0 origin-bottom' : 'left-1/2 -translate-x-1/2 top-full mt-1.5 origin-top',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: isTop ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: isTop ? 4 : -4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className={cn(
            "absolute z-[9999] rounded-2xl bg-white dark:bg-[#18181b] border border-slate-200/90 dark:border-zinc-800 shadow-2xl p-1.5 text-slate-900 dark:text-zinc-100 text-xs backdrop-blur-md focus:outline-none max-w-[calc(100vw-2rem)]",
            width,
            alignClasses[align] || (isTop ? 'right-0 bottom-full mb-1.5 mt-0 origin-bottom-right' : 'right-0 top-full mt-1.5 origin-top-right'),
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
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition-all duration-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap",
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
