/**
 * @file select.jsx
 * @description Smooth, custom Shadcn-style Select dropdown component powered by Framer Motion, matching the dark/emerald aesthetics.
 */
import { useState, useRef, useEffect, useMemo, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SelectContext = createContext(null);

function normalizeValue(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'object') {
    if (val._id) return String(val._id);
    if (val.id) return String(val.id);
    if (val.value) return String(val.value);
  }
  return String(val);
}

function extractText(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object') {
    if (node.props) {
      if (node.props.children !== undefined) {
        return extractText(node.props.children);
      }
      if (node.props.label !== undefined) {
        return extractText(node.props.label);
      }
    }
  }
  return '';
}

function extractItemLabels(nodes) {
  const map = {};
  const scan = (curr) => {
    if (!curr) return;
    if (Array.isArray(curr)) {
      for (let i = 0; i < curr.length; i++) {
        scan(curr[i]);
      }
      return;
    }
    if (typeof curr !== 'object') return;

    if (curr.props) {
      if (curr.props.value !== undefined) {
        const valStr = normalizeValue(curr.props.value);
        const text = extractText(curr.props.children) || (curr.props.label ? String(curr.props.label) : '') || valStr;
        if (text && valStr !== '') {
          map[valStr] = text.trim();
        }
      }
      if (curr.props.children) {
        scan(curr.props.children);
      }
    }
  };
  scan(nodes);
  return map;
}

export function Select({
  value,
  onValueChange,
  defaultValue,
  disabled = false,
  children,
  className,
}) {
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : defaultValue);
  const selectedValue = value !== undefined ? value : internalValue;
  const [registeredLabels, setRegisteredLabels] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const scannedLabels = useMemo(() => extractItemLabels(children), [children]);
  const itemLabelsMap = useMemo(() => ({ ...scannedLabels, ...registeredLabels }), [scannedLabels, registeredLabels]);

  const registerItem = (val, text) => {
    const valStr = normalizeValue(val);
    if (valStr !== '' && text) {
      setRegisteredLabels((prev) => (prev[valStr] === text ? prev : { ...prev, [valStr]: text }));
    }
  };

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

  const handleSelect = (val, label) => {
    setInternalValue(val);
    if (label) {
      registerItem(val, label);
    }
    onValueChange?.(val);
    setIsOpen(false);
  };

  const strVal = normalizeValue(selectedValue);
  const currentDisplayLabel =
    strVal !== ''
      ? itemLabelsMap[strVal] ||
        (typeof selectedValue === 'object' ? (selectedValue.name || selectedValue.label || '') : '') ||
        (strVal === '__general__' ? 'General' : '') ||
        (strVal === '__walk_in__' ? 'General / Walk-in Supplier' : '') ||
        (strVal === '__none__' ? 'None / Generic' : '')
      : '';

  return (
    <SelectContext.Provider
      value={{
        value: selectedValue,
        selectedValue,
        selectedLabel: currentDisplayLabel,
        handleSelect,
        registerItem,
        itemLabelsMap,
        isOpen,
        setIsOpen,
        disabled,
      }}
    >
      <div
        ref={containerRef}
        className={cn(
          "relative inline-block text-left w-full",
          isOpen ? "z-[99999]" : "z-auto",
          className
        )}
      >
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  children,
  className,
  placeholder = 'Select an option...',
  size = 'default', // 'sm' | 'default' | 'lg'
  icon: CustomIcon,
  ...props
}) {
  const { isOpen, setIsOpen, disabled, value, selectedLabel } = useContext(SelectContext);

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-lg',
    default: 'h-10 px-3.5 text-xs sm:text-sm rounded-xl',
    lg: 'h-12 px-4 text-sm rounded-2xl',
  };

  const normVal = normalizeValue(value);
  const isHexId = /^[0-9a-fA-F]{24}$/.test(normVal);
  const resolvedText = selectedLabel || (!isHexId && normVal !== '' ? normVal : '');

  const displayContent =
    children !== undefined && children !== null ? (
      children
    ) : resolvedText ? (
      resolvedText
    ) : (
      <span className="text-slate-400 dark:text-zinc-500 font-normal">{placeholder}</span>
    );

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && setIsOpen(!isOpen)}
      className={cn(
        "flex w-full items-center justify-between gap-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 font-medium transition-all duration-150 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#00df89] disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses[size],
        isOpen && "ring-2 ring-[#00df89] border-[#00df89]",
        className
      )}
      aria-expanded={isOpen}
      {...props}
    >
      <div className="flex items-center gap-2 truncate">
        {CustomIcon && <CustomIcon className="w-4 h-4 text-slate-400 shrink-0" />}
        <span className="truncate">
          {displayContent}
        </span>
      </div>
      <ChevronDown
        className={cn(
          "w-4 h-4 text-slate-400 dark:text-zinc-500 transition-transform duration-200 shrink-0",
          isOpen && "rotate-180 text-[#00df89]"
        )}
      />
    </button>
  );
}

export function SelectValue({ placeholder = 'Select...', children }) {
  const { value, selectedLabel } = useContext(SelectContext);
  const normVal = normalizeValue(value);
  const isHexId = /^[0-9a-fA-F]{24}$/.test(normVal);
  const resolvedText = selectedLabel || (!isHexId && normVal !== '' ? normVal : '');

  if (children) return children;
  if (resolvedText) {
    return resolvedText;
  }
  return <span className="text-slate-400 dark:text-zinc-500 font-normal">{placeholder}</span>;
}

export function SelectContent({
  children,
  className,
  align = 'left',
  maxHeight = 'max-h-64',
}) {
  const { isOpen } = useContext(SelectContext);

  const alignClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className={cn(
            "absolute z-[99999] w-full min-w-full max-w-[calc(100vw-2rem)] mt-1.5 rounded-2xl bg-white dark:bg-[#18181b] border border-slate-200/90 dark:border-zinc-800 shadow-2xl p-1.5 text-slate-900 dark:text-zinc-100 text-xs overflow-y-auto overscroll-contain backdrop-blur-md focus:outline-none scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent",
            maxHeight,
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

export function SelectItem({
  value,
  children,
  disabled = false,
  onDelete,
  deleteTitle = 'Delete option',
  className,
  ...props
}) {
  const { selectedValue, handleSelect, registerItem } = useContext(SelectContext);
  const normalizedVal = normalizeValue(value);
  const normalizedSelected = normalizeValue(selectedValue);
  const isSelected = normalizedVal !== '' && normalizedSelected !== '' && normalizedVal === normalizedSelected;
  const itemText = extractText(children) || (typeof children === 'string' ? children : normalizedVal);

  useEffect(() => {
    if (value !== undefined && itemText) {
      registerItem(value, itemText);
    }
  }, [value, itemText]);

  return (
    <div
      onClick={() => {
        if (!disabled) {
          handleSelect(value, itemText);
        }
      }}
      className={cn(
        "group relative flex w-full items-center justify-between px-2.5 py-2 rounded-xl text-left font-medium transition-all duration-100 cursor-pointer select-none",
        isSelected
          ? "bg-emerald-500/10 dark:bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] font-bold"
          : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-white",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className
      )}
      {...props}
    >
      <span className="truncate flex-1 pr-2">{children}</span>
      <div className="flex items-center gap-1 shrink-0">
        {onDelete && (
          <button
            type="button"
            title={deleteTitle}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(value, itemText);
            }}
            className="opacity-60 hover:opacity-100 p-1 rounded-md hover:bg-rose-500/15 text-rose-500/80 hover:text-rose-500 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        {isSelected && (
          <Check className="w-3.5 h-3.5 text-[#00a86b] dark:text-[#00df89] shrink-0 stroke-[2.5]" />
        )}
      </div>
    </div>
  );
}

export function SelectGroup({ children, className }) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}

export function SelectLabel({ children, className }) {
  return (
    <div className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500", className)}>
      {children}
    </div>
  );
}

export function SelectSeparator({ className }) {
  return <div className={cn("my-1 h-px bg-slate-100 dark:bg-zinc-800", className)} />;
}

export default Select;
