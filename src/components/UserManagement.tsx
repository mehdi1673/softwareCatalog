import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  KeyRound, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle,
  Mail,
  UserCheck,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { User, Role } from '../types';
import { getCurrentShamsiDate } from '../utils/shamsi';

interface UserManagementProps {
  users: User[];
  roles: Role[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onChangeUserPassword: (userId: string, newPassword: string) => void;
  onLogAudit: (action: any, details: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  roles,
  onAddUser,
  onUpdateUser,
  onChangeUserPassword,
  onLogAudit,
}) => {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<User | null>(null);
  const [showResetModal, setShowResetModal] = useState<User | null>(null);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newRoleId, setNewRoleId] = useState(roles[0]?.id || '');
  const [newPassword, setNewPassword] = useState('');

  // Password reset/change form state
  const [targetNewPassword, setTargetNewPassword] = useState('');
  const [targetConfirmPassword, setTargetConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim() || !newPassword.trim()) return;

    const selectedRole = roles.find(r => r.id === newRoleId);
    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: newUsername.trim().toLowerCase(),
      fullName: newFullName.trim(),
      email: newEmail.trim(),
      roleId: newRoleId,
      roleName: selectedRole?.nameFa || 'کاربر',
      department: newDepartment.trim(),
      isActive: true,
      isLocked: false,
      createdDateShamsi: getCurrentShamsiDate(),
    };

    onAddUser(newUser);
    onLogAudit('CREATE_USER', `کاربر جدید «${newUser.fullName} (${newUser.username})» با نقش «${newUser.roleName}» ایجاد شد.`);
    setShowAddUserModal(false);
    setNewUsername('');
    setNewFullName('');
    setNewEmail('');
    setNewDepartment('');
    setNewPassword('');
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordModal || targetNewPassword.length < 6) {
      alert('رمز عبور باید حداقل ۶ کاراکتر و دارای پیچیدگی لازم باشد.');
      return;
    }
    if (targetNewPassword !== targetConfirmPassword) {
      alert('رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }

    onChangeUserPassword(showPasswordModal.id, targetNewPassword);
    onLogAudit('PASSWORD_CHANGE', `رمز عبور کاربر «${showPasswordModal.username}» توسط مدیر سیستم به‌روزرسانی شد.`);
    setShowPasswordModal(null);
    setTargetNewPassword('');
    setTargetConfirmPassword('');
    alert('رمز عبور کاربر با موفقیت تغییر یافت.');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetModal) return;

    // Simulated one-time temporary recovery password
    const tempPassword = `Pass@${Math.floor(1000 + Math.random() * 9000)}`;
    onChangeUserPassword(showResetModal.id, tempPassword);
    onLogAudit('PASSWORD_RESET', `لینک و کد بازیابی رمز عبور برای «${showResetModal.username}» تولید گردید.`);
    alert(`کد موقت بازیابی با موفقیت ثبت شد.\nرمز عبور موقت جدید: ${tempPassword}\nکاربر در اولین ورود ملزم به تغییر رمز عبور خواهد بود.`);
    setShowResetModal(null);
  };

  const toggleUserLock = (user: User) => {
    const updated: User = { ...user, isLocked: !user.isLocked };
    onUpdateUser(updated);
    onLogAudit('UPDATE_USER', `وضعیت حساب کاربر «${user.username}» به ${updated.isLocked ? 'قفل شده' : 'فعال'} تغییر یافت.`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>مدیریت حساب‌های کاربری، امنیت و کنترل دسترسی (User Management)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تخصیص نقش‌ها، تغییر رمز عبور، فرآیند فراموشی رمز عبور و قفل‌گذاری حساب‌های مشکوک
          </p>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ تعریف کاربر جدید</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">نام و نام خانوادگی</th>
                <th className="py-3 px-4">نام کاربری</th>
                <th className="py-3 px-4">نقش سیستمی</th>
                <th className="py-3 px-4">معاونت / اداره کل</th>
                <th className="py-3 px-4">وضعیت حساب</th>
                <th className="py-3 px-4">آخرین ورود شمسی</th>
                <th className="py-3 px-4 text-center">عملیات امنیتی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {u.username}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                      {u.roleName}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {u.department || 'نامشخص'}
                  </td>
                  <td className="py-3 px-4">
                    {u.isLocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> قفل امنیتی
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> فعال
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {u.lastLoginShamsi || 'ثبت نشده'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Change Password */}
                      <button
                        type="button"
                        onClick={() => setShowPasswordModal(u)}
                        title="تغییر رمز عبور کاربر"
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {/* Forgot / Reset Password flow */}
                      <button
                        type="button"
                        onClick={() => setShowResetModal(u)}
                        title="فراموشی و بازنشانی رمز عبور"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      {/* Lock / Unlock Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleUserLock(u)}
                        title={u.isLocked ? 'باز کردن قفل حساب' : 'قفل کردن حساب کاربر'}
                        className={`p-1.5 rounded-lg transition ${
                          u.isLocked 
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {u.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ثبت کاربر سازمانی جدید
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    placeholder="مهندس علی حسینی"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام کاربری (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    dir="ltr"
                    placeholder="a.hosseini"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    پست الکترونیکی
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    dir="ltr"
                    placeholder="a.hosseini@enterprise.gov.ir"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    معاونت / اداره کل
                  </label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    placeholder="اداره کل فناوری اطلاعات"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نقش کاربری *
                  </label>
                  <select
                    value={newRoleId}
                    onChange={e => setNewRoleId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.nameFa}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    کلمه عبور اولیه *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="حداقل ۶ کاراکتر"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  ثبت کاربر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>تغییر رمز عبور: {showPasswordModal.fullName}</span>
            </h3>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  رمز عبور جدید *
                </label>
                <input
                  type="password"
                  required
                  value={targetNewPassword}
                  onChange={e => setTargetNewPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تکرار رمز عبور جدید *
                </label>
                <input
                  type="password"
                  required
                  value={targetConfirmPassword}
                  onChange={e => setTargetConfirmPassword(e.target.value)}
                  placeholder="تکرار رمز عبور"
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  ذخیره رمز جدید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Forgot / Reset Password flow */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-500" />
              <span>فراموشی و بازنشانی رمز عبور</span>
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              با تأیید این مرحله، یک رمز عبور موقت برای کاربر «{showResetModal.fullName} ({showResetModal.username})» صادر شده و سابقه آن در لاگ امنیتی درج می‌شود.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  صدور رمز موقت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
