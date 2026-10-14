import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Save, 
  Lock, 
  Eye, 
  Edit, 
  CheckSquare, 
  AlertCircle,
  Users,
  Server,
  Database,
  Code2,
  BookOpen,
  SlidersHorizontal
} from 'lucide-react';
import { Role, Category, User, CategoryPermission, DependencyCheckResult } from '../types';
import { checkRoleDependencies } from '../utils/dependencyChecker';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface RoleManagementProps {
  roles: Role[];
  categories: Category[];
  users: User[];
  onAddRole: (role: Role) => void;
  onUpdateRole: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
  onLogBlockedDelete: (roleName: string, reason: string) => void;
}

export const RoleManagement: React.FC<RoleManagementProps> = ({
  roles,
  categories,
  users,
  onAddRole,
  onUpdateRole,
  onDeleteRole,
  onLogBlockedDelete,
}) => {
  const [selectedRole, setSelectedRole] = useState<Role>(roles[0] || null);

  // New Role Form State
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleNameFa, setNewRoleNameFa] = useState('');
  const [newRoleCode, setNewRoleCode] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    role: Role | null;
    checkResult: DependencyCheckResult | null;
  }>({
    isOpen: false,
    role: null,
    checkResult: null,
  });

  const handleCategoryPermissionToggle = (
    catId: string, 
    permType: keyof CategoryPermission
  ) => {
    if (!selectedRole || selectedRole.isSystemRole) return;

    const currentPerm = selectedRole.categoryPermissions[catId] || {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };

    const updatedPerm: CategoryPermission = {
      ...currentPerm,
      [permType]: !currentPerm[permType],
    };

    // If unchecking canView, also uncheck create, edit, delete
    if (permType === 'canView' && !updatedPerm.canView) {
      updatedPerm.canCreate = false;
      updatedPerm.canEdit = false;
      updatedPerm.canDelete = false;
    }

    // If checking create/edit/delete, ensure canView is true
    if (permType !== 'canView' && updatedPerm[permType]) {
      updatedPerm.canView = true;
    }

    const updatedRole: Role = {
      ...selectedRole,
      categoryPermissions: {
        ...selectedRole.categoryPermissions,
        [catId]: updatedPerm,
      },
    };

    setSelectedRole(updatedRole);
    onUpdateRole(updatedRole);
  };

  const handleServerPermissionToggle = (permType: keyof CategoryPermission) => {
    if (!selectedRole || selectedRole.isSystemRole) return;

    const currentPerm = selectedRole.serverPermissions || {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };

    const updatedPerm: CategoryPermission = {
      ...currentPerm,
      [permType]: !currentPerm[permType],
    };

    // If unchecking canView, also uncheck create, edit, delete
    if (permType === 'canView' && !updatedPerm.canView) {
      updatedPerm.canCreate = false;
      updatedPerm.canEdit = false;
      updatedPerm.canDelete = false;
    }

    // If checking create/edit/delete, ensure canView is true
    if (permType !== 'canView' && updatedPerm[permType]) {
      updatedPerm.canView = true;
    }

    const updatedRole: Role = {
      ...selectedRole,
      serverPermissions: updatedPerm,
    };

    setSelectedRole(updatedRole);
    onUpdateRole(updatedRole);
  };

  const handleSystemPermissionToggle = (key: keyof Role['systemPermissions']) => {
    if (!selectedRole || selectedRole.isSystemRole) return;

    const updatedRole: Role = {
      ...selectedRole,
      systemPermissions: {
        ...selectedRole.systemPermissions,
        [key]: !selectedRole.systemPermissions[key],
      },
    };

    setSelectedRole(updatedRole);
    onUpdateRole(updatedRole);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleNameFa.trim() || !newRoleCode.trim()) return;

    // Default permissions: empty
    const defaultCatPerms: Role['categoryPermissions'] = {};
    categories.forEach(c => {
      defaultCatPerms[c.id] = { canView: true, canCreate: false, canEdit: false, canDelete: false };
    });

    const newRole: Role = {
      id: `role-${Date.now()}`,
      code: newRoleCode.trim().toUpperCase(),
      nameFa: newRoleNameFa.trim(),
      description: newRoleDesc.trim(),
      isSystemRole: false,
      categoryPermissions: defaultCatPerms,
      serverPermissions: {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      },
      systemPermissions: {
        manageCategories: false,
        manageRoles: false,
        manageUsers: false,
        viewAuditLogs: false,
        exportReports: true,
        manageServerAttributes: false,
        viewArchitectureDocs: true,
        viewSqlServerScript: true,
        viewPythonBackend: true,
      },
    };

    onAddRole(newRole);
    setSelectedRole(newRole);
    setShowAddRoleModal(false);
    setNewRoleNameFa('');
    setNewRoleCode('');
    setNewRoleDesc('');
  };

  const handleDeleteRoleClick = (role: Role) => {
    const result = checkRoleDependencies(role.id, roles, users);
    setDeleteModalState({
      isOpen: true,
      role,
      checkResult: result,
    });

    if (!result.canDelete) {
      onLogBlockedDelete(`نقش ${role.nameFa}`, result.blockedReasons.join(' | '));
    }
  };

  const handleConfirmDelete = () => {
    if (deleteModalState.role && deleteModalState.checkResult?.canDelete) {
      onDeleteRole(deleteModalState.role.id);
      setSelectedRole(roles.find(r => r.id !== deleteModalState.role!.id) || roles[0]);
      setDeleteModalState({ isOpen: false, role: null, checkResult: null });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <span>مدیریت نقش‌ها و ماتریس دسترسی داینامیک طبقات (Dynamic RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تعریف دسترسی مجزا بر روی هر طبقه نرم‌افزاری تا سطح فقط ویو (Read-Only)، درج، ویرایش و حذف
          </p>
        </div>

        <button
          onClick={() => setShowAddRoleModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ تعریف نقش داینامیک جدید</span>
        </button>
      </div>

      {/* 2-Column: Left Role List, Right Category Permission Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Roles List */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            نقش‌های ثبت‌شده ({roles.length})
          </div>

          <div className="space-y-2">
            {roles.map(role => {
              const isSelected = selectedRole?.id === role.id;
              const assignedCount = users.filter(u => u.roleId === role.id).length;

              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="space-y-1 truncate pr-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs truncate">{role.nameFa}</span>
                      {role.isSystemRole && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          سیستمی
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      کد: {role.code} | {assignedCount} کاربر اختصاصی
                    </div>
                  </div>

                  {!role.isSystemRole && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteRoleClick(role);
                      }}
                      title="حذف نقش با کنترل وابستگی کاربران"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
          {selectedRole ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>ماتریس دسترسی نقش: {selectedRole.nameFa}</span>
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">[{selectedRole.code}]</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedRole.description}
                  </p>
                </div>
                {selectedRole.isSystemRole && (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 font-medium">
                    نقش محافظت‌شده سیستمی
                  </span>
                )}
              </div>

              {/* Category-Level Permission Matrix (Requirement 7 & 9) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  دسترسی مجزا به تفکیک طبقات نرم‌افزاری (Category-Level RBAC):
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">طبقه نرم‌افزاری</th>
                        <th className="py-2.5 px-3 text-center">مشاهده (View)</th>
                        <th className="py-2.5 px-3 text-center">ایجاد (Create)</th>
                        <th className="py-2.5 px-3 text-center">ویرایش (Edit)</th>
                        <th className="py-2.5 px-3 text-center">حذف (Delete)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {categories.map(cat => {
                        const perm = selectedRole.categoryPermissions[cat.id] || {
                          canView: false,
                          canCreate: false,
                          canEdit: false,
                          canDelete: false,
                        };

                        return (
                          <tr key={cat.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              <div>{cat.nameFa}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{cat.code}</div>
                            </td>

                            {/* View */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                disabled={selectedRole.isSystemRole}
                                checked={perm.canView}
                                onChange={() => handleCategoryPermissionToggle(cat.id, 'canView')}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                              />
                            </td>

                            {/* Create */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                disabled={selectedRole.isSystemRole}
                                checked={perm.canCreate}
                                onChange={() => handleCategoryPermissionToggle(cat.id, 'canCreate')}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                              />
                            </td>

                            {/* Edit */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                disabled={selectedRole.isSystemRole}
                                checked={perm.canEdit}
                                onChange={() => handleCategoryPermissionToggle(cat.id, 'canEdit')}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                              />
                            </td>

                            {/* Delete */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                disabled={selectedRole.isSystemRole}
                                checked={perm.canDelete}
                                onChange={() => handleCategoryPermissionToggle(cat.id, 'canDelete')}
                                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer disabled:opacity-50"
                              />
                            </td>
                          </tr>
                        );
                      })}

                      {/* Server Topology & Infrastructure Row */}
                      {(() => {
                        const srvPerm = selectedRole.serverPermissions || {
                          canView: false,
                          canCreate: false,
                          canEdit: false,
                          canDelete: false,
                        };

                        return (
                          <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 border-t-2 border-indigo-200 dark:border-indigo-900/60 font-semibold transition">
                            <td className="py-3 px-3 text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-1.5">
                                <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>توپولوژی سرورها و ماشین‌های استقرار</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold">
                                  زیرساخت سرورها
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">SERVER_TOPOLOGY_INFRA</div>
                            </td>

                            {/* View */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                disabled={selectedRole.isSystemRole}
                                checked={srvPerm.canView}
                                onChange={() => handleServerPermissionToggle('canView')}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                              />
                            </td>

                            {/* Create */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                disabled={selectedRole.isSystemRole}
                                checked={srvPerm.canCreate}
                                onChange={() => handleServerPermissionToggle('canCreate')}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                              />
                            </td>

                            {/* Edit */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                disabled={selectedRole.isSystemRole}
                                checked={srvPerm.canEdit}
                                onChange={() => handleServerPermissionToggle('canEdit')}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                              />
                            </td>

                            {/* Delete */}
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                disabled={selectedRole.isSystemRole}
                                checked={srvPerm.canDelete}
                                onChange={() => handleServerPermissionToggle('canDelete')}
                                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer disabled:opacity-50"
                              />
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* System Module Permissions */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  دسترسی به ماژول‌های مدیریتی سیستم:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'manageCategories', label: 'مدیریت و افزودن طبقات و خصوصیات داینامیک', icon: null },
                    { key: 'manageRoles', label: 'مدیریت نقش‌ها و ماتریس دسترسی داینامیک', icon: null },
                    { key: 'manageUsers', label: 'مدیریت حساب کاربران و رمز عبور', icon: null },
                    { key: 'viewAuditLogs', label: 'مشاهده لاگ‌های امنیتی و ممیزی سامانه (OWASP)', icon: null },
                    { key: 'exportReports', label: 'استخراج گزارشات جامع و خروجی فایل اکسل', icon: null },
                    { key: 'manageServerAttributes', label: 'مدیریت و تعریف خصوصیات داینامیک سرورها (Server Attributes)', icon: SlidersHorizontal },
                    { key: 'viewArchitectureDocs', label: 'مشاهده مستندات معماری ۶ گانه سیستم', icon: BookOpen },
                    { key: 'viewSqlServerScript', label: 'مشاهده و دریافت اسکریپت کامل SQL Server (T-SQL)', icon: Database },
                    { key: 'viewPythonBackend', label: 'دسترسی به سورس کد بک‌اند پایتون (FastAPI)', icon: Code2 },
                  ].map(mod => {
                    const isChecked = selectedRole.systemPermissions?.[mod.key as keyof Role['systemPermissions']];
                    const Icon = mod.icon;

                    return (
                      <label key={mod.key} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition">
                        <input
                          type="checkbox"
                          disabled={selectedRole.isSystemRole}
                          checked={Boolean(isChecked)}
                          onChange={() => handleSystemPermissionToggle(mod.key as any)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                        />
                        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{mod.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              یک نقش را از لیست سمت راست انتخاب کنید.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Role */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              تعریف نقش کاربری داینامیک جدید
            </h3>

            <form onSubmit={handleCreateRole} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام فارسی نقش *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleNameFa}
                  onChange={e => setNewRoleNameFa(e.target.value)}
                  placeholder="مثلاً: کارشناس نظارت بر زیرساخت"
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد یکتای انگلیسی (Role Code) *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleCode}
                  onChange={e => setNewRoleCode(e.target.value)}
                  dir="ltr"
                  placeholder="INFRA_SUPERVISOR"
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شرح وظایف و محدوده نقش
                </label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  placeholder="محدوده اختیارات این نقش را مشخص کنید..."
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  ثبت نقش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Dependency Checking */}
      {deleteModalState.isOpen && deleteModalState.role && deleteModalState.checkResult && (
        <ConfirmDeleteModal
          isOpen={deleteModalState.isOpen}
          title={`درخواست حذف نقش «${deleteModalState.role.nameFa}»`}
          itemName={deleteModalState.role.nameFa}
          itemType="نقش کاربری"
          checkResult={deleteModalState.checkResult}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModalState({ isOpen: false, role: null, checkResult: null })}
        />
      )}
    </div>
  );
};
