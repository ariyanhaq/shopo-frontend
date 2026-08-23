/**
 * @file ConfirmDialog.jsx
 * @description Sleek, modern confirmation modal for deletions and critical operations with loader state and button disable.
 */
import { X, AlertTriangle, Trash2, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure you want to delete?',
  description = 'This action cannot be undone.',
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  loadingText,
  variant = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const activeLoadingText = loadingText || (confirmText?.includes('মুছ') || title?.includes('মুছ') ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...');

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading && onCancel) {
      onCancel();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="max-w-sm w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 shadow-2xl space-y-4 relative modal-dialog-content"
      >
        
        {/* Close Icon */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Message */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-500/10 text-rose-500'
                : variant === 'warning'
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-emerald-500/10 text-[#00df89]'
            }`}
          >
            {variant === 'danger' ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1 pr-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={onCancel}
            className="text-xs h-9 px-3.5 dark:bg-[#09090b] border-slate-200 dark:border-zinc-800 font-medium cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isLoading}
            onClick={onConfirm}
            className={`text-xs h-9 px-4 font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[#00df89] hover:bg-[#00c97b] text-[#011812]'
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isLoading ? activeLoadingText : confirmText}</span>
          </Button>
        </div>

      </Card>
    </div>
  );
}
