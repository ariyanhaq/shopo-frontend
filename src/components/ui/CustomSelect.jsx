/**
 * @file CustomSelect.jsx
 * @description Premium custom dropdown selector with icons, badges, subtitles, animations, and keyboard accessibility.
 */
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  icon: Icon = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Selected item object
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full h-10 px-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs font-medium text-left outline-none ${
          isOpen
            ? 'border-[#00a86b] ring-2 ring-[#00a86b]/20 bg-white dark:bg-zinc-900 shadow-xs'
            : 'border-slate-200 dark:border-zinc-700/90 bg-slate-50/70 dark:bg-zinc-800/70 hover:bg-slate-100/80 dark:hover:bg-zinc-800'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {Icon && <Icon className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />}
          {selectedOption?.icon && (
            <selectedOption.icon className="w-4 h-4 text-[#00a86b] dark:text-[#00df89] shrink-0" />
          )}
          
          <div className="truncate">
            <span className="text-slate-900 dark:text-white font-medium">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.badge && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {selectedOption.badge}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-zinc-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#00a86b]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl py-1.5 max-h-64 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150 ${menuClassName}`}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            const OptIcon = opt.icon;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {OptIcon && (
                    <OptIcon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#00a86b]' : 'text-slate-400 dark:text-zinc-500'
                      }`}
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {opt.sublabel && (
                      <span className="text-[10.5px] text-slate-400 dark:text-zinc-500 truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-[#00a86b] dark:text-[#00df89] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
