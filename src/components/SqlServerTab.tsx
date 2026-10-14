import React, { useState } from 'react';
import { Database, Copy, Check, Download, Layers, ShieldCheck, Terminal } from 'lucide-react';
import { SQL_SERVER_FULL_SCRIPT } from '../services/sqlServerScripts';

export const SqlServerTab: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SERVER_FULL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([SQL_SERVER_FULL_SCRIPT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Enterprise_Software_Catalog_DB_Setup.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>اسکریپت کامل پایگاه داده Microsoft SQL Server 2019/2022 (T-SQL)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            طراحی‌شده توسط Senior .NET Backend & SQL Server Architect | شامل DDL، ایندکس‌های استراتژیک، پروسیجرهای کنترل وابستگی و تریگرهای ممیزی
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد ✓' : 'کپی کل اسکریپت'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل Setup.sql</span>
          </button>
        </div>
      </div>

      {/* Architectural Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>مدل داده داینامیک ترکیبی (Hybrid EAV)</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            استفاده از جدول رابطه‌ای <code className="text-indigo-600 font-mono">Software_AttributeMultiValues</code> جهت پشتیبانی نامحدود از مقادیر چندگانه به همراه ذخیره اسنپ‌شات JSON در نسخه‌بندی.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>منع حذف به دلیل وابستگی (Integrity Stored Procedures)</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            پروسیجرهای <code className="text-emerald-600 font-mono">sp_CheckCategoryDependencies</code> و <code className="text-emerald-600 font-mono">sp_CheckSoftwareDependencies</code> مانع حذف رکوردهای دارای ارجاع فعال می‌شوند.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Terminal className="w-4 h-4 text-purple-600" />
            <span>پشتیبانی کامل از زبان فارسی و RCSI</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            کالکشن <code className="text-purple-600 font-mono">Persian_100_CI_AI</code> برای مرتب‌سازی بدون اشکال «ی» و «ک» و فعال‌سازی Read Committed Snapshot Isolation جهت جلوگیری از Deadlock.
          </p>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="mr-2 text-slate-300">Enterprise_Software_Catalog_DB_Setup.sql</span>
          </div>
          <span>Microsoft SQL Server T-SQL Script</span>
        </div>

        <div className="p-4 max-h-[600px] overflow-y-auto">
          <pre className="text-xs font-mono text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre selection:bg-indigo-600 selection:text-white" dir="ltr">
            {SQL_SERVER_FULL_SCRIPT}
          </pre>
        </div>
      </div>
    </div>
  );
};
