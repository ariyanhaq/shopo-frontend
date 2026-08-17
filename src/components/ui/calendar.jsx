/**
 * @file calendar.jsx
 * @description Premium Shadcn-style Calendar & Popover DatePicker component with Framer Motion animations, dark mode support, quick navigation, and bilingual capability.
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function Calendar({
  selected,
  onSelect,
  className,
  minDate,
  maxDate
}) {
  const initialDate = selected ? new Date(selected) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Update view when selected prop changes
  useEffect(() => {
    if (selected) {
      const d = new Date(selected);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [selected]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const isoString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    onSelect?.(isoString);
  };

  // Build grid days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days = [];

  // Previous month padding days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      month: viewMonth - 1,
      year: viewMonth === 0 ? viewYear - 1 : viewYear,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
    });
  }

  // Next month padding days to complete 35 or 42 grid cells
  const remainingCells = 42 - days.length;
  if (remainingCells < 7) {
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        month: viewMonth + 1,
        year: viewMonth === 11 ? viewYear + 1 : viewYear,
        isCurrentMonth: false,
      });
    }
  } else {
    const fillTo35 = 35 - days.length;
    for (let i = 1; i <= fillTo35; i++) {
      days.push({
        day: i,
        month: viewMonth + 1,
        year: viewMonth === 11 ? viewYear + 1 : viewYear,
        isCurrentMonth: false,
      });
    }
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const selectedStr = selected
    ? typeof selected === 'string'
      ? selected
      : selected.toISOString().split('T')[0]
    : '';

  return (
    <div className={cn("p-3 w-64 select-none bg-white dark:bg-[#18181b] text-slate-900 dark:text-zinc-100", className)}>
      {/* Header navigation */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Next Month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center mb-1">
        {WEEKDAY_NAMES.map((d, i) => (
          <span key={i} className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase">
            {d}
          </span>
        ))}
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((item, idx) => {
          const m = item.month < 0 ? 12 + item.month : item.month % 12;
          const formattedDate = `${item.year}-${String(m + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
          const isSelected = selectedStr === formattedDate;
          const isToday = todayStr === formattedDate;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelect?.(formattedDate);
              }}
              className={cn(
                "h-7 w-7 text-xs rounded-lg flex items-center justify-center font-medium transition-all cursor-pointer",
                !item.isCurrentMonth && "text-slate-300 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-zinc-400",
                item.isCurrentMonth && "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800",
                isToday && !isSelected && "border border-[#00df89] text-[#00a86b] dark:text-[#00df89] font-bold",
                isSelected && "bg-[#00df89] text-[#011812] font-bold shadow-xs hover:bg-[#00df89] hover:text-[#011812]"
              )}
            >
              {item.day}
            </button>
          );
        })}
      </div>

      {/* Footer Quick Actions */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
        <button
          type="button"
          onClick={handleGoToday}
          className="text-[#00a86b] dark:text-[#00df89] font-medium hover:underline cursor-pointer"
        >
          Today
        </button>

        {selected && (
          <button
            type="button"
            onClick={() => onSelect?.('')}
            className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  align = 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
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

  const formattedDisplay = value ? (() => {
    try {
      const parts = value.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return value;
    } catch {
      return value;
    }
  })() : null;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8.5 px-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-medium flex items-center gap-2 hover:border-slate-300 dark:hover:border-zinc-700 transition-all outline-none focus:ring-1 focus:ring-[#00df89] cursor-pointer",
          value ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-zinc-400",
          className
        )}
      >
        <CalendarIcon className={cn("w-3.5 h-3.5", value ? "text-[#00a86b] dark:text-[#00df89]" : "text-slate-400")} />
        <span>{formattedDisplay || placeholder}</span>
        {value && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange?.('');
              setIsOpen(false);
            }}
            className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={cn(
              "absolute z-50 mt-1.5 rounded-2xl bg-white dark:bg-[#18181b] border border-slate-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden backdrop-blur-md",
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            <Calendar
              selected={value}
              onSelect={(val) => {
                onChange?.(val);
                setIsOpen(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
