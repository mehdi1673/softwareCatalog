import React from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Terminal, 
  Layers, 
  Server, 
  Lock, 
  Workflow,
  CheckCircle2
} from 'lucide-react';

export const ArchitectureDocsTab: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-900/60 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>سند فنی و نقشه راه معماری سامانه (Architectural Blueprint)</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight">
          تحلیل و طراحی جامع سامانه شناسنامه و کاتالوگ نرم‌افزارهای سازمانی
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          تنظیم‌شده بر مبنای استانداردهای سازمانی از دیدگاه ۶ نقش تخصصی: معمار ارشد، مهندس ارشد پایگاه داده و .NET، مهندس سیستم‌های توزیع‌شده، مهندس DevOps، مهندس امنیت و مربی فنی.
        </p>
      </div>

      {/* 1. Principal Software Architect */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              ۱. دیدگاه Principal Software Architect (معماری کلان و مدل داده داینامیک)
            </h2>
            <span className="text-xs text-slate-400">طراحی دامنه (Domain Design) و حل چالش خصوصیات نامحدود</span>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
          <p>
            یکی از بزرگترین چالش‌های سامانه‌های شناسنامه نرم‌افزار، <strong>پویایی کامل متادیتاها</strong> است. سازمان‌ها در طول زمان نیازمند تعریف طبقات جدید (مثل «انطباق هوش مصنوعی»، «مدیریت لایسنس‌ها») و اضافه کردن خصوصیات چند مقداری (مثل چندین پایگاه داده، چندین آدرس IP، پروتکل‌های گوناگون) به هر طبقه بدون تغییر در DDL جداول هستند.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-bold text-slate-900 dark:text-slate-100">راهکار معماری هیبریدی (Relational EAV + JSON Snapshots):</div>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <li><strong>موجودیت‌های پایه (First-Class Entities):</strong> مشخصاتی که در همه نرم‌افزارها مشترک و نیازمند یکپارچگی ارجاعی هستند (کد ردیابی، نام، وضعیت عملیاتی، متولی، سطح اهمیت) به صورت ستون‌های نرمال در جدول اصلی قرار دارند.</li>
              <li><strong>مدل داده داینامیک رابطه‌ای (Software_AttributeMultiValues):</strong> خصوصیات متغیر به همراه مقادیر چندگانه (Multi-Value) در جدولی رابطه‌ای با ایندکس‌های کامپوزیت ذخیره می‌شوند تا جستجوهای فیلتری فوق‌العاده سریع باشند.</li>
              <li><strong>اسنپ‌شات‌های تغییرات (Software_VersionHistory):</strong> در هر بار به‌روزرسانی شناسنامه، علاوه بر افزایش شماره بازنگری، کل درخت داده به صورت اسنپ‌شات JSON ذخیره می‌شود تا قابلیت ممیزی و بازگشت به عقب (Point-in-time Recovery) فراهم باشد.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2. Senior .NET Backend Engineer */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              ۲. دیدگاه Senior .NET Backend & SQL Server Database Engineer
            </h2>
            <span className="text-xs text-slate-400">عملکرد پایگاه داده، تراکنش‌ها و سطوح ایزولاسیون</span>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
          <p>
            در مقیاس سازمانی، پایگاه داده SQL Server قلب سیستم است. پیکربندی زیر برای بهینه‌سازی اعمال گردیده است:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <strong className="block text-slate-900 dark:text-slate-100 mb-1 font-bold">فعال‌سازی RCSI (Read Committed Snapshot):</strong>
              <p className="text-slate-500 leading-tight">با فعال‌سازی RCSI، کوئری‌های خواندن (Select) نیازی به قفل‌های اشتراکی نخواهند داشت و عملیات خواندن هرگز بلاک نمی‌شود که مانع بروز Deadlock در ترافیک‌های سنگین می‌گردد.</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <strong className="block text-slate-900 dark:text-slate-100 mb-1 font-bold">کالکشن زبان فارسی:</strong>
              <p className="text-slate-500 leading-tight">تعیین <code className="font-mono text-indigo-600">Persian_100_CI_AI</code> برای پشتیبانی کامل از حروف «ی» و «ک»، مرتب‌سازی الفبایی صحیح و جستجوی بدون حساسیت به حروف بزرگ/کوچک و اعراب.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Distributed Systems Engineer */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              ۳. دیدگاه Distributed Systems Engineer (مقیاس‌پذیری و ارتباطات)
            </h2>
            <span className="text-xs text-slate-400">مدیریت اتصال، کشینگ لایه دوم و مش وابستگی سامانه‌ها</span>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
          <p>
            برای پاسخگویی به درخواست‌های همزمان بدون افت کارایی:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <li><strong>Connection Pool بهینه:</strong> در بک‌اند پایتون اندازه استخر اتصالات با <code className="font-mono">pool_size=20</code> و <code className="font-mono">max_overflow=10</code> تنظیم شده و با قابلیت <code className="font-mono">fast_executemany=True</code> سرعت عملیات گروهی تا ۱۰ برابر بهبود یافته است.</li>
            <li><strong>گراف وابستگی سامانه‌ها (Dependency Graph):</strong> جدول <code className="font-mono">Software_Dependencies</code> روابط یکپارچگی بین سرویس‌ها (API، پایگاه داده مشترک، احراز هویت یکتا) را مدل‌سازی می‌کند تا هرگونه قطعی یا حذف نرم‌افزار پیش از وقوع تحلیل شود.</li>
          </ul>
        </div>
      </section>

      {/* 4. DevOps-Aware Backend Engineer */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              ۴. دیدگاه DevOps-Aware Backend Engineer (استقرار، کانتینر و CI/CD)
            </h2>
            <span className="text-xs text-slate-400">کانتینرسازی با Docker Compose، پروب‌های سلامت و مایگریشن</span>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
          <p>
            پشته سیستم برای استقرار در محیط‌های Enterprise On-Premise و Private Cloud به صورت کانتینری آماده است:
          </p>
          <div className="bg-slate-950 p-3.5 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto" dir="ltr">
            <pre>{`# docker-compose.yml
version: '3.8'
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=EnterpriseP@ssw0rd2026!
      - MSSQL_COLLATION=Persian_100_CI_AI
    ports:
      - "1433:1433"
    volumes:
      - mssql_data:/var/opt/mssql

  backend:
    build: .
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
    depends_on:
      - sqlserver
    environment:
      - DB_SERVER=sqlserver
      - DB_NAME=EnterpriseSoftwareCatalogDB
    ports:
      - "8000:8000"`}</pre>
          </div>
        </div>
      </section>

      {/* 5. Security Engineer */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              ۵. دیدگاه Security Engineer (امنیت نفوذ‌ناپذیر و انطباق با OWASP Top 10)
            </h2>
            <span className="text-xs text-slate-400">کپچای آفلاین، کنترل وابستگی قبل از حذف، ممیزی بدون دستکاری</span>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60">
              <strong className="block text-rose-900 dark:text-rose-200 font-bold mb-1">
                منع حذف به دلیل وابستگی (Delete Restriction Due to Dependency):
              </strong>
              <p className="text-rose-800 dark:text-rose-300 leading-tight">
                هیچ طبقه، نقش یا نرم‌افزاری که داده وابسته دارد امکان حذف ندارد. کلیدهای خارجی دیتابیس با <code className="font-mono">ON DELETE NO ACTION</code> تعریف شده‌اند و پروسیجرهای سیستمی مانع بروز خطای آبشاری می‌شوند.
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
              <strong className="block text-emerald-900 dark:text-emerald-200 font-bold mb-1">
                کپچای گرافیکی کاملاً آفلاین (Offline Graphical CAPTCHA):
              </strong>
              <p className="text-emerald-800 dark:text-emerald-300 leading-tight">
                تصویر کپچا بدون نیاز به اینترنت یا ابزارهای ردیابی خارجی در لایه سرور/کلاینت با نویز، خطوط اعوجاج بزیر و چرخش تصادفی حروف ساخته شده و حملات Brute-Force و اسکنرهای خودکار را خنثی می‌کند.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Technical Instructor */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              ۶. راهنمای گام‌به‌گام Technical Instructor (راه‌اندازی گام به گام)
            </h2>
            <span className="text-xs text-slate-400">مراحل عملیاتی استقرار از ابتدا تا پایان</span>
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
              ۱
            </div>
            <div>
              <strong className="text-slate-900 dark:text-slate-100 block font-bold">اجرای اسکریپت SQL Server:</strong>
              <span>وارد نرم‌افزار SSMS (SQL Server Management Studio) شوید و اسکریپت کامل ارائه‌شده در تب «اسکریپت کامل SQL Server» را اجرا نمایید تا پایگاه داده و پروسیجرها ساخته شوند.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
              ۲
            </div>
            <div>
              <strong className="text-slate-900 dark:text-slate-100 block font-bold">راه‌اندازی بک‌اند پایتون:</strong>
              <span>پکیج‌های <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">pip install fastapi uvicorn sqlalchemy pyodbc pydantic pyjwt openpyxl</code> را نصب نموده و دستور <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">uvicorn main:app --reload</code> را اجرا نمایید.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
              ۳
            </div>
            <div>
              <strong className="text-slate-900 dark:text-slate-100 block font-bold">ورود به مستندات تعاملی Swagger:</strong>
              <span>آدرس <code className="font-mono text-indigo-600" dir="ltr">http://localhost:8000/api/docs</code> را باز کرده و با کاربر admin و حل کپچای امنیتی، توکن Bearer دریافت و کلیه اندپوینت‌ها را تست نمایید.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
