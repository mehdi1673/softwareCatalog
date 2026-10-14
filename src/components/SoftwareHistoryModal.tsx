import React from 'react';
import { X, History, GitCommit, UserCheck, Calendar, ShieldCheck, Tag } from 'lucide-react';
import { SoftwareApplication, SoftwareVersionSnapshot } from '../types';

interface SoftwareHistoryModalProps {
  isOpen: boolean;
  software: SoftwareApplication | null;
  historyList: SoftwareVersionSnapshot[];
  onClose: () => void;
}

export const SoftwareHistoryModal: React.FC<SoftwareHistoryModalProps> = ({
  isOpen,
  software,
  historyList,
  onClose,
}) => {
  if (!isOpen || !software) return null;

  const relevantHistory = historyList
    .filter(h => h.softwareId === software.id)
    .sort((a, b) => b.versionNumber - a.versionNumber);

  const changeTypeLabels: { [key: string]: { label: string; color: string } } = {
    INITIAL_REGISTRATION: { label: 'ثبت اولیه', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    ATTRIBUTE_UPDATE: { label: 'تغییر خصوصیات', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
    MAJOR_UPGRADE: { label: 'ارتقای عمده', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
    SECURITY_PATCH: { label: 'پچ امنیتی', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
    CONFIG_CHANGE: { label: 'تغییر پیکربندی', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                تاریخچه تغییرات و نسخه‌بندی: {software.nameFa}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                شناسه: {software.code} | مجموع نسخ ثبت‌شده: {relevantHistory.length} بازنگری
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {relevantHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              هنوز نسخه ثانویه‌ای برای این نرم‌افزار ثبت نشده است.
            </div>
          ) : (
            <div className="relative border-r-2 border-indigo-200 dark:border-indigo-900/60 mr-4 space-y-6">
              {relevantHistory.map((item, index) => {
                const badge = changeTypeLabels[item.changeType] || { label: item.changeType, color: 'bg-slate-100 text-slate-800' };

                return (
                  <div key={item.versionId} className="relative pr-6">
                    {/* Node Dot */}
                    <div className="absolute -right-2.25 top-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-400 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-indigo-600 text-white">
                            {item.versionTag}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            (بازنگری شماره {item.versionNumber})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{item.changedDateShamsi}</span>
                        </div>
                      </div>

                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                        {item.changeDescription}
                      </p>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                          <span>ثبت‌کننده: {item.changedBy}</span>
                        </div>
                        <div className="font-mono text-[10px]">
                          شناسه رهگیری: {item.versionId}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
