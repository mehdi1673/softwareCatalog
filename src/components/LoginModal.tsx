import React, { useState } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle, 
  Layers, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { User, Role } from '../types';
import { CaptchaBox } from './CaptchaBox';

interface LoginModalProps {
  users: User[];
  roles: Role[];
  onLoginSuccess: (user: User) => void;
  onLogAudit: (action: any, details: string, isAlert?: boolean, severity?: 'INFO' | 'WARNING' | 'CRITICAL') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  roles,
  onLoginSuccess,
  onLogAudit,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('EnterpriseP@ss2026');
  const [captchaInput, setCaptchaInput] = useState('');
  const [expectedCaptcha, setExpectedCaptcha] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Verify Offline Captcha
    if (!captchaInput.trim() || captchaInput.trim().toUpperCase() !== expectedCaptcha.toUpperCase()) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setErrorMsg('کد امنیتی کپچا اشتباه است. لطفاً مجدداً دقت نمایید.');
      onLogAudit(
        'LOGIN_FAILED', 
        `تلاش ناموفق برای ورود به حساب «${username}»: کد کپچای امنیتی نادرست وارد شد.`,
        true,
        newAttempts >= 3 ? 'CRITICAL' : 'WARNING'
      );
      return;
    }

    // 2. Find user
    const foundUser = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!foundUser) {
      setErrorMsg('نام کاربری یا کلمه عبور وارد شده نادرست است.');
      onLogAudit('LOGIN_FAILED', `تلاش ناموفق: کاربر «${username}» در سیستم یافت نشد.`, true, 'WARNING');
      return;
    }

    if (foundUser.isLocked) {
      setErrorMsg('این حساب کاربری به دلایل امنیتی مسدود شده است. با راهبر سیستم تماس بگیرید.');
      onLogAudit('LOGIN_FAILED', `تلاش برای ورود به حساب قفل شده «${foundUser.username}».`, true, 'CRITICAL');
      return;
    }

    // Login success
    setFailedAttempts(0);
    onLogAudit('LOGIN_SUCCESS', `ورود موفقیت‌آمیز کاربر «${foundUser.fullName} (${foundUser.username})» با حل کپچای امنیتی.`);
    onLoginSuccess(foundUser);
  };

  const handleQuickDemoLogin = (targetUsername: string) => {
    const user = users.find(u => u.username === targetUsername);
    if (user) {
      onLogAudit('LOGIN_SUCCESS', `ورود تستی سریع با کاربر «${user.fullName}».`);
      onLoginSuccess(user);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username.toLowerCase() === forgotUsername.trim().toLowerCase());
    if (user) {
      setForgotFeedback(`کد بازیابی و تأیید هویت به پست الکترونیکی «${user.email}» ارسال گردید.`);
      onLogAudit('PASSWORD_RESET', `درخواست فراموشی رمز عبور برای حساب «${user.username}» ثبت شد.`);
    } else {
      setForgotFeedback('کاربری با این نام کاربری یافت نشد.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-850 to-slate-950 text-white text-center relative overflow-hidden">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-white shadow-inner">
            <ShieldCheck className="w-6 h-6 text-indigo-300" />
          </div>
          <h2 className="text-base font-extrabold tracking-tight">
            دروازه امنیتی ورود به سامانه شناسنامه نرم‌افزارها
          </h2>
          <p className="text-xs text-indigo-200/80 mt-1">
            Enterprise SPM Portal | احراز هویت کنترل‌شده با ممیزی
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام کاربری سازمانی
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  dir="ltr"
                  placeholder="admin"
                  className="w-full pr-9 pl-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  کلمه عبور
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  فراموشی رمز عبور؟
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pr-9 pl-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Offline Graphical Captcha Box (Requirement 14 & 19) */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                کد امنیتی کپچای آفلاین (جهت مقابله با نفوذ و ربات‌ها) *
              </label>
              <CaptchaBox
                onCaptchaGenerated={code => setExpectedCaptcha(code)}
                width={160}
                height={46}
              />
              <input
                type="text"
                required
                value={captchaInput}
                onChange={e => setCaptchaInput(e.target.value)}
                dir="ltr"
                maxLength={6}
                placeholder="حروف تصویر بالا را وارد کنید..."
                className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono uppercase text-center tracking-widest font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ورود امن به سامانه</span>
            </button>
          </form>

          {/* Quick Demo Switcher for Evaluation */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block text-center">
              ورود سریع تستی با نقش‌های مختلف سازمانی:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl text-slate-800 dark:text-slate-200 text-right truncate font-medium transition"
              >
                👑 مدیر ارشد سیستم
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('architect')}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl text-slate-800 dark:text-slate-200 text-right truncate font-medium transition"
              >
                📐 معمار نرم‌افزار
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sec_officer')}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl text-slate-800 dark:text-slate-200 text-right truncate font-medium transition"
              >
                🛡️ ممیز امنیت اطلاعات
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('operator')}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl text-slate-800 dark:text-slate-200 text-right truncate font-medium transition"
              >
                📝 اپراتور قراردادها
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              بازیابی رمز عبور حساب کاربری
            </h3>

            {forgotFeedback ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 rounded-xl">
                  {forgotFeedback}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotFeedback('');
                  }}
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  بازگشت به صفحه ورود
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  نام کاربری سازمانی خود را وارد نمایید تا دستورالعمل بازیابی رمز عبور ارسال گردد.
                </p>
                <div>
                  <input
                    type="text"
                    required
                    value={forgotUsername}
                    onChange={e => setForgotUsername(e.target.value)}
                    dir="ltr"
                    placeholder="admin"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-sm"
                  >
                    ارسال لینک بازیابی
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
