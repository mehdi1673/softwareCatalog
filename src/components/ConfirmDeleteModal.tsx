import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, X, Lock } from 'lucide-react';
import { DependencyCheckResult } from '../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemType: string;
  checkResult: DependencyCheckResult;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemName,
  itemType,
  checkResult,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isBlocked = !checkResult.canDelete;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isBlocked 
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50' 
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50'
        }`}>
          <div className="flex items-center gap-3">
            {isBlocked ? (
              <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isBlocked ? 'خطای کنترل یکپارچگی ارجاعات (Referential Integrity Block)' : 'تأییدیه حذف نهایی از بانک اطلاعاتی'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isBlocked ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-sm text-rose-900 dark:text-rose-200">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>منع حذف به دلیل وابستگی (Delete Restriction Due to Dependency)</span>
                </div>
                <p className="text-xs leading-relaxed text-rose-800 dark:text-rose-300">
                  طبق الزامات مهندسی داده و استانداردهای یکپارچگی اطلاعات، حذف فیزیکی این {itemType} مسدود شده است زیرا سایر بخش‌های سامانه به آن وابسته‌اند.
                </p>
              </div>

              {/* Reasons */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  علل مسدودسازی حذف:
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {checkResult.blockedReasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* References list if any */}
              {checkResult.references && checkResult.references.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    موجودیت‌های وابسته در سامانه:
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                    {checkResult.references.map((ref, idx) => (
                      <div key={idx} className="text-xs p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                          {ref.type} (تعداد: {ref.count}):
                        </span>
                        <div className="flex flex-wrap gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                          {ref.details.map((d, dIdx) => (
                            <span key={dIdx} className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                * تلاش ناموفق برای این حذف به همراه مشخصات کاربری و IP در لاگ امنیتی سامانه به ثبت رسید.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-sm text-amber-900 dark:text-amber-200">
                <p className="leading-relaxed">
                  آیا از حذف <strong className="font-bold text-slate-900 dark:text-white">«{itemName}»</strong> مطمئن هستید؟
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>بررسی وابستگی‌ها (Dependency Check): هیچ وابستگی فعالی یافت نشد و حذف امن است.</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p>• این عملیات در پایگاه داده ثبت شده و در لاگ ممیزی امنیتی نگهداری خواهد شد.</p>
                <p>• کلیه سوابق نسخه یا ارجاعات تاریخی مرتبط نیز به صورت کنترل‌شده مدیریت می‌گردند.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            {isBlocked ? 'بستن پنجره' : 'انصراف'}
          </button>
          {!isBlocked && (
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-md transition"
            >
              تأیید و حذف قطعی
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
