/**
 * @file Loader.jsx
 * @description Full-screen or container loading overlay component with Shopo branding and animation.
 */
import { Store } from 'lucide-react';

export default function Loader({ message = 'Checking store data & profile...', fullScreen = true }) {
  return (
    <div className={`${fullScreen ? 'min-h-screen w-full fixed inset-0 z-50' : 'py-12 w-full'} flex flex-col items-center justify-center bg-[#FAFBFD] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100`}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#00df89] text-[#011812] flex items-center justify-center font-bold shadow-lg shadow-[#00df89]/25 animate-pulse">
            <Store className="w-7 h-7" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-[#00df89]/30 border-t-[#00df89] animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Shopo<span className="text-[#00df89]">.</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium animate-pulse">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
