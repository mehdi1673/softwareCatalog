import React from 'react';
import { 
  ShieldCheck, 
  Sun, 
  Moon, 
  LogOut, 
  User as UserIcon, 
  KeyRound, 
  Clock, 
  ShieldAlert,
  ChevronDown,
  Layers
} from 'lucide-react';
import { User, Role } from '../types';
import { getCurrentShamsiDate } from '../utils/shamsi';

interface HeaderProps {
  currentUser: User;
  currentRole: Role;
  allRoles: Role[];
  onRoleSwitch: (roleId: string) => void;
  onLogout: () => void;
  onChangePasswordClick: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  allRoles,
  onRoleSwitch,
  onLogout,
  onChangePasswordClick,
  darkMode,
  onToggleDarkMode,
}) => {
  const shamsiToday = getCurrentShamsiDate();

  return (
    <header className="no-print sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                شناسنامه و کاتالوگ نرم‌افزارهای سازمان
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Enterprise SPM v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              سامانه یکپارچه مستندسازی معماری، ارزیابی امنیت و حاکمیت نرم‌افزارها
            </p>
          </div>
        </div>

        {/* Center: Shamsi Date Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>امروز: {shamsiToday} هجری شمسی</span>
        </div>

        {/* Right tools: Role Switcher, Dark mode, User profile, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher for dynamic RBAC testing */}
          <div className="relative group">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-900 dark:text-indigo-200 cursor-pointer">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold hidden sm:inline">نقش فعال:</span>
              <span className="font-bold max-w-[130px] truncate">{currentRole.nameFa}</span>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
            </div>

            {/* Role dropdown */}
            <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 hidden group-hover:block animate-in fade-in z-50">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                تغییر سریع نقش (ارزیابی ماتریس دسترسی RBAC):
              </div>
              {allRoles.map(r => (
                <button
                  key={r.id}
                  onClick={() => onRoleSwitch(r.id)}
                  className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                    r.id === currentRole.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{r.nameFa}</span>
                  {r.id === currentRole.id && <span className="text-[10px]">✓ فعال</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Dark / Light toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">تم روشن</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600 dark:text-slate-300" />
                <span className="hidden sm:inline">تم تاریک</span>
              </>
            )}
          </button>

          {/* Change password button */}
          <button
            onClick={onChangePasswordClick}
            title="تغییر رمز عبور"
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          {/* User badge */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] text-slate-400">
                {currentUser.username}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            title="خروج از سامانه"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
};
