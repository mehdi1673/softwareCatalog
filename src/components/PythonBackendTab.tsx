import React, { useState } from 'react';
import { Code2, Copy, Check, Download, FileCode, CheckCircle2, ShieldCheck, Terminal } from 'lucide-react';
import { PYTHON_BACKEND_FILES } from '../services/pythonBackendCode';

export const PythonBackendTab: React.FC = () => {
  const fileKeys = Object.keys(PYTHON_BACKEND_FILES);
  const [activeFile, setActiveFile] = useState<string>(fileKeys[0]);
  const [copied, setCopied] = useState(false);

  const currentFile = PYTHON_BACKEND_FILES[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-600" />
            <span>سورس‌کد کامل بک‌اند پایتون (Python FastAPI + SQLAlchemy 2.0)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ارائه‌شده توسط Principal Architect & DevOps Engineer | معماری لایه‌ای، کنترل وابستگی قبل از حذف، متادیتاهای داینامیک و اتصال به SQL Server
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد ✓' : `کپی ${activeFile}`}</span>
          </button>
          <button
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
          >
            <Download className="w-4 h-4" />
            <span>دانلود {activeFile}</span>
          </button>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {fileKeys.map(fileName => {
          const isActive = activeFile === fileName;
          return (
            <button
              key={fileName}
              onClick={() => setActiveFile(fileName)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{fileName}</span>
            </button>
          );
        })}
      </div>

      {/* File Description Banner */}
      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        <span>کارکرد این ماژول: {currentFile.description}</span>
      </div>

      {/* Code Display */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="mr-2 text-slate-300">{activeFile}</span>
          </div>
          <span className="font-mono text-indigo-400">Python 3.11+ / FastAPI / SQLAlchemy</span>
        </div>

        <div className="p-4 max-h-[600px] overflow-y-auto">
          <pre className="text-xs font-mono text-cyan-300 leading-relaxed overflow-x-auto whitespace-pre selection:bg-indigo-600 selection:text-white" dir="ltr">
            {currentFile.code}
          </pre>
        </div>
      </div>
    </div>
  );
};
