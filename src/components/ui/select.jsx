/**
 * @file select.jsx
 * @description Smooth, custom Shadcn-style Select dropdown component powered by Framer Motion, matching the dark/emerald aesthetics.
 */
import { useState, useRef, useEffect, useMemo, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SelectContext = createContext(null);

function extractText(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object') {
    if (node.props && node.props.children !== undefined) {
      return extractText(node.props.children);
    }
  }
  return '';
}

function extractItemLabels(children) {
  const map = {};
  const scan = (nodes) => {
    if (!nodes) return;
    const array = Array.isArray(nodes) ? nodes : [nodes];
    for (const child of array) {
      if (!child || typeof child !== 'object') continue;
      if (child.props) {
        if (child.props.value !== undefined) {
          const text = extractText(child.props.children);
          if (text) map[String(child.props.value)] = text.trim();
        }
        if (child.props.children) {
          scan(child.props.children);
        }
      }
    }
  };
  scan(children);
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
  const [selectedValue, setSelectedValue] = useState(value !== undefined ? value : defaultValue);
  const [registeredLabels, setRegisteredLabels] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const scannedLabels = useMemo(() => extractItemLabels(children), [children]);
  const itemLabelsMap = useMemo(() => ({ ...scannedLabels, ...registeredLabels }), [scannedLabels, registeredLabels]);

  const registerItem = (val, text) => {
    if (val !== undefined && text) {
      setRegisteredLabels((prev) => (prev[String(val)] === text ? prev : { ...prev, [String(val)]: text }));
    }
  };

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

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
    setSelectedValue(val);
    if (label) {
      registerItem(val, label);
    }
    onValueChange?.(val);
    setIsOpen(false);
  };

  const currentDisplayLabel =
    itemLabelsMap[String(selectedValue)] ||
    (selectedValue === '__general__' ? 'General' : '') ||
    (selectedValue === '__walk_in__' ? 'General / Walk-in Supplier' : '') ||
    (selectedValue === '__none__' ? 'General / Walk-in Supplier' : '');

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

  const isHexId = typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
  const resolvedText = selectedLabel || (!isHexId && value ? String(value) : '');

  const displayContent =
    children ||
    (resolvedText ? (
      resolvedText
    ) : (
      <span className="text-slate-400 dark:text-zinc-500 font-normal">{placeholder}</span>
    ));

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
  const isHexId = typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
  const resolvedText = selectedLabel || (!isHexId && value ? String(value) : '');

  if (children) return children;
  if (resolvedText) {
    return resolvedText;
  }
  return <span className="text-slate-400 dark:text-zinc-500">{placeholder}</span>;
}

export function SelectContent({
  children,
  className,
  align = 'left',
  maxHeight = 'max-h-60',
}) {
  const { isOpen } = useContext(SelectContext);

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
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
            "absolute z-[99999] w-full min-w-full min-w-[200px] mt-1.5 rounded-2xl bg-white dark:bg-[#18181b] border border-slate-200/90 dark:border-zinc-800 shadow-2xl p-1.5 text-slate-900 dark:text-zinc-100 text-xs overflow-y-auto backdrop-blur-md focus:outline-none",
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
  const isSelected = String(selectedValue) === String(value);
  const itemText = extractText(children) || (typeof children === 'string' ? children : String(value));

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
            className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
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
