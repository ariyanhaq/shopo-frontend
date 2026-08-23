/**
 * @file Modal.jsx
 * @description Modern Reusable Modal dialog component with body scroll lock and click isolation.
 */
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export default function Modal({ isOpen, onClose, children, maxWidth = 'max-w-md', className = '' }) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-[#121215] p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-2xl ${maxWidth} w-full relative overflow-hidden modal-dialog-content ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
