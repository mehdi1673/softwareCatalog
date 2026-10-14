import React, { useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { printHtmlContent, downloadPrintableHtml, PrintDocumentOptions } from '../utils/printHelper';

interface PrintPreviewModalProps {
  isOpen: boolean;
  options: PrintDocumentOptions;
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  options,
  onClose,
}) => {
  if (!isOpen) return null;

  const [printStatus, setPrintStatus] = useState<string | null>(null);

  const handleExecutePrint = () => {
    printHtmlContent(options);
    setPrintStatus('دستور چاپ به مرورگر ارسال شد.');
    setTimeout(() => setPrintStatus(null), 3000);
  };

  const handleDownloadHtml = () => {
    downloadPrintableHtml(options);
    setPrintStatus('فایل سند چاپی دانلود شد.');
    setTimeout(() => setPrintStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                پیش‌نمایش و صدور سند چاپی رسمی
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {options.title} | تنظیم‌شده برای ابعاد استاندارد A4 افقی (Landscape)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {printStatus && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                {printStatus}
              </span>
            )}

            <button
              onClick={handleExecutePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>ارسال به چاپگر (Print)</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              title="دانلود فایل HTML قابل چاپ آفلاین"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>دانلود فایل سند چاپی (.html)</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950/60">
          <div className="max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-xl border border-slate-300 font-sans text-xs min-h-[500px]">
            {/* Document Header */}
            <div className="border-b-2 border-slate-800 pb-4 mb-6 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1">
                  جمهوری اسلامی ایران - سامانه کاتالوگ و شناسنامه نرم‌افزارهای سازمانی
                </div>
                <h1 className="text-lg font-black text-slate-900">
                  {options.title}
                </h1>
                {options.subtitle && (
                  <p className="text-xs text-slate-600 mt-0.5">{options.subtitle}</p>
                )}
              </div>
              <div className="text-left font-mono text-[11px] text-slate-600 space-y-0.5">
                <div>تاریخ گزارش: <strong className="text-slate-900">{options.reportDateShamsi || '۱۴۰۳/۰۸/۱۲'}</strong></div>
                <div>واحد سازمانی: <strong className="text-slate-900">{options.department || 'فناوری اطلاعات'}</strong></div>
                <div>سطح دسته‌بندی: <strong className="text-slate-900">محرمانه سازمانی</strong></div>
              </div>
            </div>

            {/* Document Dynamic Content */}
            <div 
              className="print-content-wrapper overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: options.contentHtml }}
            />

            {/* Document Official Signatures */}
            <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
              <div className="border-t border-slate-400 pt-2 font-bold">
                کارشناس تنظیم‌کننده گزارش
                <div className="h-10"></div>
                امضا و تاریخ
              </div>
              <div className="border-t border-slate-400 pt-2 font-bold">
                رئیس گروه امنیت اطلاعات (افتا)
                <div className="h-10"></div>
                امضا و تاریخ
              </div>
              <div className="border-t border-slate-400 pt-2 font-bold">
                مدیرکل فناوری اطلاعات و دولت الکترونیک
                <div className="h-10"></div>
                مهر و امضا
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
