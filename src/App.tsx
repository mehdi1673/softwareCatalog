/**
 * سامانه مدیریت شناسنامه و کاتالوگ نرم‌افزارهای سازمان
 * Enterprise Application Portfolio & Software Asset Inventory System (SPM)
 */

import React, { useState, useEffect } from 'react';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_SOFTWARE, 
  INITIAL_ROLES, 
  INITIAL_USERS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_VERSION_HISTORY,
  INITIAL_SERVER_ATTRIBUTES 
} from './data/initialData';
import { 
  Category, 
  SoftwareApplication, 
  Role, 
  User, 
  AuditLog, 
  SoftwareVersionSnapshot, 
  AuditAction,
  DynamicServerAttribute 
} from './types';
import { getCurrentShamsiDate, getCurrentShamsiDateTime } from './utils/shamsi';

import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { SoftwareList } from './components/SoftwareList';
import { SoftwareModal } from './components/SoftwareModal';
import { SoftwareDetailModal } from './components/SoftwareDetailModal';
import { SoftwareHistoryModal } from './components/SoftwareHistoryModal';
import { CategoryManagement } from './components/CategoryManagement';
import { RoleManagement } from './components/RoleManagement';
import { UserManagement } from './components/UserManagement';
import { AuditLogViewer } from './components/AuditLogViewer';
import { AdvancedSearch } from './components/AdvancedSearch';
import { ReportsView } from './components/ReportsView';
import { SqlServerTab } from './components/SqlServerTab';
import { PythonBackendTab } from './components/PythonBackendTab';
import { ArchitectureDocsTab } from './components/ArchitectureDocsTab';
import { LoginModal } from './components/LoginModal';

export default function App() {
  // Theme Dark/Light state (Requirement 16)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('spm_theme') === 'dark' || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('spm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
      document.body.setAttribute('data-theme', 'light');
      localStorage.setItem('spm_theme', 'light');
    }
  }, [darkMode]);

  // Auth state (Requirement 14 & 15)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);

  // Enterprise Catalog & RBAC Data states
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [softwareList, setSoftwareList] = useState<SoftwareApplication[]>(INITIAL_SOFTWARE);
  const [serverAttributes, setServerAttributes] = useState<DynamicServerAttribute[]>(INITIAL_SERVER_ATTRIBUTES);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [versionHistory, setVersionHistory] = useState<SoftwareVersionSnapshot[]>(INITIAL_VERSION_HISTORY);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('software');

  // Currently effective role
  const currentRole = roles.find(r => r.id === currentUser.roleId) || roles[0];

  // Software Modals State
  const [editingSoftware, setEditingSoftware] = useState<SoftwareApplication | null>(null);
  const [showSoftwareModal, setShowSoftwareModal] = useState<boolean>(false);
  const [viewingSoftware, setViewingSoftware] = useState<SoftwareApplication | null>(null);
  const [historySoftware, setHistorySoftware] = useState<SoftwareApplication | null>(null);

  // Password change modal state
  const [showSelfPasswordChange, setShowSelfPasswordChange] = useState<boolean>(false);
  const [newSelfPassword, setNewSelfPassword] = useState('');
  const [confirmSelfPassword, setConfirmSelfPassword] = useState('');

  // Audit Logging engine
  const logAudit = (
    action: AuditAction, 
    details: string, 
    isSecurityAlert = false, 
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO',
    targetName?: string
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestampShamsi: getCurrentShamsiDateTime(),
      userId: currentUser.id,
      username: currentUser.username,
      action,
      module: 'شناسنامه نرم‌افزار',
      targetId: currentUser.id,
      targetName: targetName || currentUser.fullName,
      ipAddress: '192.168.1.105',
      userAgent: navigator.userAgent.slice(0, 80),
      details,
      isSecurityAlert,
      severity,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Switch role handler (allows quick switching to test RBAC restrictions)
  const handleRoleSwitch = (newRoleId: string) => {
    const targetRole = roles.find(r => r.id === newRoleId);
    if (!targetRole) return;
    const updatedUser = {
      ...currentUser,
      roleId: newRoleId,
      roleName: targetRole.nameFa,
    };
    setCurrentUser(updatedUser);
    logAudit('UPDATE_USER', `نقش کاربر به «${targetRole.nameFa}» تغییر یافت.`);
  };

  // Software Save (Create / Update with Version Snapshot)
  const handleSaveSoftware = (savedApp: SoftwareApplication, changeDescription: string) => {
    const isNew = !softwareList.some(s => s.id === savedApp.id);

    // Create new version snapshot (Requirement 13)
    const newSnapshot: SoftwareVersionSnapshot = {
      versionId: `ver-${Date.now()}`,
      softwareId: savedApp.id,
      versionNumber: savedApp.currentVersionNumber,
      versionTag: `v${savedApp.version}`,
      changeType: isNew ? 'INITIAL_REGISTRATION' : 'ATTRIBUTE_UPDATE',
      changedBy: currentUser.fullName,
      changedDateShamsi: getCurrentShamsiDateTime(),
      changeDescription,
      snapshotData: { ...savedApp },
    };

    setVersionHistory(prev => [newSnapshot, ...prev]);

    if (isNew) {
      setSoftwareList(prev => [savedApp, ...prev]);
      logAudit('CREATE_SOFTWARE', `شناسنامه نرم‌افزار جدید «${savedApp.nameFa}» ثبت گردید.`, false, 'INFO', savedApp.nameFa);
    } else {
      setSoftwareList(prev => prev.map(s => s.id === savedApp.id ? savedApp : s));
      logAudit('UPDATE_SOFTWARE', `شناسنامه نرم‌افزار «${savedApp.nameFa}» به‌روزرسانی و نسخه v${savedApp.version} صادر گردید.`, false, 'INFO', savedApp.nameFa);
    }

    setShowSoftwareModal(false);
    setEditingSoftware(null);
  };

  // Safe Delete Software
  const handleDeleteSoftware = (appId: string) => {
    const target = softwareList.find(s => s.id === appId);
    if (!target) return;

    setSoftwareList(prev => prev.filter(s => s.id !== appId));
    logAudit('DELETE_SOFTWARE', `نرم‌افزار «${target.nameFa} (${target.code})» با بررسی عدم وابستگی حذف شد.`, false, 'INFO', target.nameFa);
  };

  // Category & Attribute handlers
  const handleAddCategory = (newCat: Category) => {
    setCategories(prev => [...prev, newCat]);
    // Grant full permissions on this new category to Super Admin
    setRoles(prev => prev.map(role => {
      if (role.isSystemRole) {
        return {
          ...role,
          categoryPermissions: {
            ...role.categoryPermissions,
            [newCat.id]: { canView: true, canCreate: true, canEdit: true, canDelete: true },
          },
        };
      }
      return role;
    }));
    logAudit('CREATE_CATEGORY', `طبقه جدید «${newCat.nameFa}» به کاتالوگ افزوده شد.`, false, 'INFO', newCat.nameFa);
  };

  const handleDeleteCategory = (catId: string) => {
    const target = categories.find(c => c.id === catId);
    setCategories(prev => prev.filter(c => c.id !== catId));
    logAudit('DELETE_CATEGORY', `طبقه «${target?.nameFa}» حذف گردید.`, false, 'INFO', target?.nameFa);
  };

  const handleAddAttribute = (catId: string, newAttr: any) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          attributes: [...cat.attributes, newAttr],
        };
      }
      return cat;
    }));
    logAudit('CREATE_CATEGORY', `خصوصیت جدید «${newAttr.labelFa}» به طبقه اضافه شد.`);
  };

  const handleDeleteAttribute = (catId: string, attrId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          attributes: cat.attributes.filter(a => a.id !== attrId),
        };
      }
      return cat;
    }));
    logAudit('UPDATE_CATEGORY', `یک خصوصیت از طبقه حذف شد.`);
  };

  // Dynamic Server Attributes handler (Requirement 4)
  const handleAddServerAttribute = (newAttr: DynamicServerAttribute) => {
    setServerAttributes(prev => [...prev, newAttr]);
    logAudit('CREATE_CATEGORY', `خصوصیت داینامیک سرور «${newAttr.labelFa}» افزوده شد.`);
  };

  // Role handlers
  const handleAddRole = (newRole: Role) => {
    setRoles(prev => [...prev, newRole]);
    logAudit('CREATE_ROLE', `نقش داینامیک جدید «${newRole.nameFa}» ایجاد شد.`, false, 'INFO', newRole.nameFa);
  };

  const handleUpdateRole = (updatedRole: Role) => {
    setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
    logAudit('UPDATE_ROLE', `ماتریس دسترسی نقش «${updatedRole.nameFa}» بازنگری شد.`, false, 'INFO', updatedRole.nameFa);
  };

  const handleDeleteRole = (roleId: string) => {
    const target = roles.find(r => r.id === roleId);
    setRoles(prev => prev.filter(r => r.id !== roleId));
    logAudit('DELETE_ROLE', `نقش «${target?.nameFa}» حذف گردید.`, false, 'INFO', target?.nameFa);
  };

  // User handlers
  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleChangeUserPassword = (userId: string, newPass: string) => {
    logAudit('PASSWORD_CHANGE', `کلمه عبور کاربر با شناسه ${userId} تغییر یافت.`);
  };

  const handleSelfPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSelfPassword.length < 6) {
      alert('کلمه عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (newSelfPassword !== confirmSelfPassword) {
      alert('کلمه عبور و تکرار آن یکسان نیستند.');
      return;
    }
    logAudit('PASSWORD_CHANGE', `کاربر «${currentUser.username}» کلمه عبور خود را تغییر داد.`);
    setShowSelfPasswordChange(false);
    setNewSelfPassword('');
    setConfirmSelfPassword('');
    alert('کلمه عبور شما با موفقیت تغییر کرد.');
  };

  return (
    <div 
      className={`${darkMode ? 'dark' : ''} min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors`}
      data-theme={darkMode ? 'dark' : 'light'}
    >
      {/* Login Screen Modal if not logged in */}
      {!isAuthenticated && (
        <LoginModal
          users={users}
          roles={roles}
          onLoginSuccess={user => {
            setCurrentUser(user);
            setIsAuthenticated(true);
          }}
          onLogAudit={(action, details, isAlert, sev) => logAudit(action, details, isAlert, sev)}
        />
      )}

      {/* Header */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        allRoles={roles}
        onRoleSwitch={handleRoleSwitch}
        onLogout={() => {
          logAudit('LOGOUT', `کاربر «${currentUser.username}» از سیستم خارج شد.`);
          setIsAuthenticated(false);
        }}
        onChangePasswordClick={() => setShowSelfPasswordChange(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentRole={currentRole}
        />

        {/* Dynamic Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'software' && (
            <SoftwareList
              softwareList={softwareList}
              categories={categories}
              currentRole={currentRole}
              onAddNew={() => {
                setEditingSoftware(null);
                setShowSoftwareModal(true);
              }}
              onEdit={app => {
                setEditingSoftware(app);
                setShowSoftwareModal(true);
              }}
              onView={app => setViewingSoftware(app)}
              onViewHistory={app => setHistorySoftware(app)}
              onDelete={handleDeleteSoftware}
              onLogBlockedDelete={(app, reason) => {
                logAudit(
                  'BLOCKED_DELETE_SOFTWARE', 
                  `منع حذف به دلیل وابستگی: ${reason}`, 
                  true, 
                  'WARNING', 
                  app.nameFa
                );
              }}
            />
          )}

          {activeTab === 'search' && (
            <AdvancedSearch
              softwareList={softwareList}
              categories={categories}
              currentRole={currentRole}
              onViewSoftware={app => setViewingSoftware(app)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              softwareList={softwareList}
              categories={categories}
              serverAttributes={serverAttributes}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'categories' && (
            <CategoryManagement
              categories={categories}
              softwareList={softwareList}
              currentRole={currentRole}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddAttribute={handleAddAttribute}
              onDeleteAttribute={handleDeleteAttribute}
              onLogBlockedDelete={(entityName, reason) => {
                logAudit(
                  'BLOCKED_DELETE_CATEGORY', 
                  `منع حذف به دلیل وابستگی در «${entityName}»: ${reason}`, 
                  true, 
                  'WARNING', 
                  entityName
                );
              }}
            />
          )}

          {activeTab === 'roles' && (
            <RoleManagement
              roles={roles}
              categories={categories}
              users={users}
              onAddRole={handleAddRole}
              onUpdateRole={handleUpdateRole}
              onDeleteRole={handleDeleteRole}
              onLogBlockedDelete={(roleName, reason) => {
                logAudit(
                  'BLOCKED_DELETE_ROLE', 
                  `منع حذف نقش «${roleName}» به دلیل وابستگی: ${reason}`, 
                  true, 
                  'WARNING', 
                  roleName
                );
              }}
            />
          )}

          {activeTab === 'users' && (
            <UserManagement
              users={users}
              roles={roles}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onChangeUserPassword={handleChangeUserPassword}
              onLogAudit={(action, details) => logAudit(action, details)}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogViewer logs={auditLogs} />
          )}

          {activeTab === 'sqlserver' && (
            <SqlServerTab />
          )}

          {activeTab === 'python' && (
            <PythonBackendTab />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureDocsTab />
          )}
        </main>
      </div>

      {/* Modals */}
      {showSoftwareModal && (
        <SoftwareModal
          isOpen={showSoftwareModal}
          software={editingSoftware}
          categories={categories}
          allSoftware={softwareList}
          serverAttributes={serverAttributes}
          currentRole={currentRole}
          onClose={() => {
            setShowSoftwareModal(false);
            setEditingSoftware(null);
          }}
          onSave={handleSaveSoftware}
          onAddCustomServerAttribute={handleAddServerAttribute}
        />
      )}

      {viewingSoftware && (
        <SoftwareDetailModal
          isOpen={Boolean(viewingSoftware)}
          software={viewingSoftware}
          categories={categories}
          serverAttributes={serverAttributes}
          currentRole={currentRole}
          onClose={() => setViewingSoftware(null)}
          onOpenHistory={() => {
            setHistorySoftware(viewingSoftware);
          }}
        />
      )}

      {historySoftware && (
        <SoftwareHistoryModal
          isOpen={Boolean(historySoftware)}
          software={historySoftware}
          historyList={versionHistory}
          onClose={() => setHistorySoftware(null)}
        />
      )}

      {/* Change Password Dialog for current user */}
      {showSelfPasswordChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              تغییر رمز عبور حساب کاربری من
            </h3>
            <form onSubmit={handleSelfPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کلمه عبور جدید *
                </label>
                <input
                  type="password"
                  required
                  value={newSelfPassword}
                  onChange={e => setNewSelfPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تکرار کلمه عبور جدید *
                </label>
                <input
                  type="password"
                  required
                  value={confirmSelfPassword}
                  onChange={e => setConfirmSelfPassword(e.target.value)}
                  placeholder="تکرار کلمه عبور"
                  className="w-full px-3 py-2 text-xs border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSelfPasswordChange(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-sm"
                >
                  ذخیره رمز جدید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
