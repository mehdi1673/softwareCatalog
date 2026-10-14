import React from 'react';
import { 
  Layers, 
  FolderTree, 
  ShieldAlert, 
  Users, 
  FileText, 
  FileSpreadsheet, 
  Database, 
  Code2, 
  BookOpen, 
  Search,
  Lock
} from 'lucide-react';
import { Role } from '../types';

export type NavTab = 
  | 'software'
  | 'search'
  | 'categories'
  | 'roles'
  | 'users'
  | 'audit'
  | 'reports'
  | 'sqlserver'
  | 'python'
  | 'architecture';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentRole: Role;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentRole,
}) => {
  // Enforce Requirement 21: if the user does NOT have permission, the item is completely hidden from UI!
  const hasCategoryViewPermission = Object.values(currentRole.categoryPermissions).some(p => p.canView);

  const navItems = [
    {
      id: 'software' as NavTab,
      label: 'شناسنامه نرم‌افزارها',
      icon: Layers,
      visible: hasCategoryViewPermission,
      badge: 'اصلی',
    },
    {
      id: 'search' as NavTab,
      label: 'جستجوی پیشرفته متادیتا',
      icon: Search,
      visible: hasCategoryViewPermission,
    },
    {
      id: 'reports' as NavTab,
      label: 'گزارش‌گیری و خروجی اکسل',
      icon: FileSpreadsheet,
      visible: currentRole.systemPermissions.exportReports,
    },
    {
      id: 'categories' as NavTab,
      label: 'مدیریت طبقات و خصوصیات',
      icon: FolderTree,
      visible: currentRole.systemPermissions.manageCategories,
    },
    {
      id: 'roles' as NavTab,
      label: 'نقش‌ها و دسترسی داینامیک',
      icon: Lock,
      visible: currentRole.systemPermissions.manageRoles,
    },
    {
      id: 'users' as NavTab,
      label: 'مدیریت کاربران و کلمات عبور',
      icon: Users,
      visible: currentRole.systemPermissions.manageUsers,
    },
    {
      id: 'audit' as NavTab,
      label: 'لاگ‌های امنیتی و ممیزی',
      icon: ShieldAlert,
      visible: currentRole.systemPermissions.viewAuditLogs,
      badge: 'OWASP',
    },
    {
      id: 'sqlserver' as NavTab,
      label: 'اسکریپت کامل SQL Server',
      icon: Database,
      visible: currentRole.systemPermissions.viewSqlServerScript ?? currentRole.systemPermissions.viewArchitectureDocs,
      badge: 'T-SQL',
    },
    {
      id: 'python' as NavTab,
      label: 'سورس کد بک‌اند پایتون',
      icon: Code2,
      visible: currentRole.systemPermissions.viewPythonBackend ?? currentRole.systemPermissions.viewArchitectureDocs,
      badge: 'FastAPI',
    },
    {
      id: 'architecture' as NavTab,
      label: 'مستندات معماری ۶ گانه',
      icon: BookOpen,
      visible: currentRole.systemPermissions.viewArchitectureDocs,
    },
  ];

  return (
    <aside className="no-print w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          بخش‌های عملیاتی
        </div>
        {navItems.filter(item => item.visible).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Info Box at bottom */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400">
        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
          <span>وضعیت دسترسی:</span>
          <span className="text-emerald-600 dark:text-emerald-400">احراز شده ✓</span>
        </div>
        <p className="line-clamp-2 leading-tight text-[10px]">
          {currentRole.description}
        </p>
      </div>
    </aside>
  );
};
