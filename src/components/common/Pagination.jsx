/**
 * @file Pagination.jsx
 * @description Modern, responsive pagination control component with page size selector, smart ellipses, and i18n support.
 */
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  className = '',
}) {
  const { lang } = useLanguage();

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    if (safeCurrentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (safeCurrentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const handlePageClick = (page) => {
    if (page === '...' || page === safeCurrentPage) return;
    if (onPageChange) onPageChange(page);
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white/50 dark:bg-zinc-900/40 border-t border-slate-200/80 dark:border-zinc-800/80 text-xs ${className}`}
    >
      {/* Showing X - Y of Z entries */}
      <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-400 font-medium">
        <span>
          {lang === 'bn' ? (
            <>
              মোট <strong className="text-slate-900 dark:text-white font-semibold">{totalItems.toLocaleString('bn-BD')}</strong> টির মধ্যে{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">{startItem.toLocaleString('bn-BD')}</strong>-
              <strong className="text-slate-900 dark:text-white font-semibold">{endItem.toLocaleString('bn-BD')}</strong> দেখানো হচ্ছে
            </>
          ) : (
            <>
              Showing <strong className="text-slate-900 dark:text-white font-semibold">{startItem}</strong> to{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">{endItem}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">{totalItems}</strong> entries
            </>
          )}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-zinc-800">
            <span className="text-[11px] text-slate-400">{lang === 'bn' ? 'প্রতি পেজে:' : 'Rows:'}</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-100 dark:bg-zinc-800/90 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700/80 rounded-md px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-[#00df89] cursor-pointer"
            >
              {pageSizeOptions.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Nav Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page Button */}
        <button
          onClick={() => handlePageClick(1)}
          disabled={safeCurrentPage === 1}
          title={lang === 'bn' ? 'প্রথম পাতা' : 'First Page'}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => handlePageClick(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          title={lang === 'bn' ? 'আগের পাতা' : 'Previous Page'}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-400 dark:text-zinc-600 select-none text-xs"
                >
                  ...
                </span>
              );
            }

            const isActive = page === safeCurrentPage;
            return (
              <button
                key={`page-${page}`}
                onClick={() => handlePageClick(page)}
                className={`min-w-7 h-7 px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00df89] text-[#011812] shadow-xs font-bold'
                    : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800'
                }`}
              >
                {lang === 'bn' ? page.toLocaleString('bn-BD') : page}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => handlePageClick(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          title={lang === 'bn' ? 'পরের পাতা' : 'Next Page'}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => handlePageClick(totalPages)}
          disabled={safeCurrentPage >= totalPages}
          title={lang === 'bn' ? 'শেষ পাতা' : 'Last Page'}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
