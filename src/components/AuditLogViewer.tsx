import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Terminal,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AuditLog } from '../types';

interface AuditLogViewerProps {
  logs: AuditLog[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetName && log.targetName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);

    const matchesSeverity = filterSeverity === 'ALL' || log.severity === filterSeverity;
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;

    return matchesSearch && matchesSeverity && matchesAction;
  });

  const handleExportExcel = () => {
    const rows = filteredLogs.map(l => ({
      'شناسه لاگ': l.id,
      'زمان (شمسی)': l.timestampShamsi,
      'کاربر': l.username,
      'عملیات': l.action,
      'بخش / ماژول': l.module,
      'موجودیت هدف': l.targetName || '',
      'آدرس IP': l.ipAddress,
      'سطح هشدار': l.severity,
      'هشدار امنیتی؟': l.isSecurityAlert ? 'بله' : 'خیر',
      'جزئیات رویداد': l.details,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'لاگ‌های امنیتی');
    XLSX.writeFile(wb, `لاگ_ممیزی_امنیتی_${Date.now()}.xlsx`);
  };

  const severityConfig = {
    INFO: { label: 'عادی (Info)', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    WARNING: { label: 'هشدار (Warning)', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    CRITICAL: { label: 'بحرانی (Critical)', bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <span>دفتر ثبت وقایع امنیتی، ممیزی و لاگ‌های دسترسی (Audit & Security Trail)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            نگهداری تمام رخدادهای ورود، ویرایش، حذف‌های موفق و منع حذف به دلیل وابستگی، به همراه IP و مشخصات کاربری
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>خروجی اکسل لاگ‌ها</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس کاربر، موجودیت، IP یا جزئیات..."
            className="w-full pr-9 pl-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="ALL">همه سطوح رخداد</option>
            <option value="INFO">عادی (Info)</option>
            <option value="WARNING">هشدار امنیتی (Warning / Blocked Delete)</option>
            <option value="CRITICAL">بحرانی (Critical)</option>
          </select>
        </div>

        <div>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="ALL">همه انواع عملیات</option>
            <option value="LOGIN_SUCCESS">ورود موفق به سامانه</option>
            <option value="LOGIN_FAILED">تلاش ناموفق ورود</option>
            <option value="UPDATE_SOFTWARE">ویرایش شناسنامه</option>
            <option value="DELETE_SOFTWARE">حذف شناسنامه</option>
            <option value="BLOCKED_DELETE_CATEGORY">منع حذف طبقه (وابستگی)</option>
            <option value="BLOCKED_DELETE_ROLE">منع حذف نقش (وابستگی)</option>
            <option value="EXPORT_REPORT">خروجی گزارشات</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">زمان ثبت (شمسی)</th>
                <th className="py-3 px-4">کاربر</th>
                <th className="py-3 px-4">عملیات</th>
                <th className="py-3 px-4">بخش / ماژول</th>
                <th className="py-3 px-4">موجودیت هدف</th>
                <th className="py-3 px-4">آدرس IP</th>
                <th className="py-3 px-4">سطح رویداد</th>
                <th className="py-3 px-4">شرح رویداد و ممیزی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map(log => {
                const sev = severityConfig[log.severity] || severityConfig.INFO;

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {log.timestampShamsi}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {log.username}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {log.module}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {log.targetName || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500" dir="ltr">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sev.bg}`}>
                        {sev.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs leading-relaxed text-[11px]">
                      {log.details}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    هیچ رخدادی با معیارهای انتخاب‌شده یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
