import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Eye, 
  Edit3, 
  Trash2, 
  History, 
  ShieldAlert, 
  Layers, 
  Server, 
  CheckCircle2,
  AlertTriangle,
  Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SoftwareApplication, Category, Role, DependencyCheckResult } from '../types';
import { checkSoftwareDependencies } from '../utils/dependencyChecker';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { getCurrentShamsiDate } from '../utils/shamsi';

interface SoftwareListProps {
  softwareList: SoftwareApplication[];
  categories: Category[];
  currentRole: Role;
  onAddNew: () => void;
  onEdit: (app: SoftwareApplication) => void;
  onView: (app: SoftwareApplication) => void;
  onViewHistory: (app: SoftwareApplication) => void;
  onDelete: (appId: string) => void;
  onLogBlockedDelete: (app: SoftwareApplication, reason: string) => void;
}

export const SoftwareList: React.FC<SoftwareListProps> = ({
  softwareList,
  categories,
  currentRole,
  onAddNew,
  onEdit,
  onView,
  onViewHistory,
  onDelete,
  onLogBlockedDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriticality, setFilterCriticality] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<SoftwareApplication | null>(null);
  const [checkResult, setCheckResult] = useState<DependencyCheckResult | null>(null);

  // Check if role has rights to create or delete
  const canCreateAny = Object.values(currentRole.categoryPermissions).some(p => p.canCreate);
  const canDeleteAny = Object.values(currentRole.categoryPermissions).some(p => p.canDelete);
  const canEditAny = Object.values(currentRole.categoryPermissions).some(p => p.canEdit);

  // Filter logic
  const filteredApps = softwareList.filter(app => {
    const matchesSearch = 
      app.nameFa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.nameEn && app.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      app.ownerDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.vendorName && app.vendorName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCriticality = filterCriticality === 'ALL' || app.criticality === filterCriticality;
    const matchesStatus = filterStatus === 'ALL' || app.status === filterStatus;

    return matchesSearch && matchesCriticality && matchesStatus;
  });

  const handleDeleteClick = (app: SoftwareApplication) => {
    const result = checkSoftwareDependencies(app.id, softwareList);
    setCheckResult(result);
    setDeleteTarget(app);

    if (!result.canDelete) {
      onLogBlockedDelete(app, result.blockedReasons.join(' | '));
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget && checkResult?.canDelete) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
      setCheckResult(null);
    }
  };

  // Export to Excel using XLSX library
  const handleExportExcel = () => {
    const rows = filteredApps.map(app => {
      // Find backend tech from category values
      const techCat = categories.find(c => c.code === 'TECH_STACK');
      const techVals = techCat ? app.categoryValues?.[techCat.id] : [];
      const backendVal = techVals?.find(v => v.attributeCode === 'BACKEND_FRAMEWORKS')?.values.join('، ') || '-';
      const dbVal = techVals?.find(v => v.attributeCode === 'DATABASES')?.values.join('، ') || '-';

      return {
        'کد ردیابی': app.code,
        'نام فارسی نرم‌افزار': app.nameFa,
        'نام لاتین': app.nameEn || '',
        'نسخه فعلی': app.version,
        'وضعیت': app.status,
        'سطح اهمیت': app.criticality,
        'معاونت متولی': app.ownerDepartment,
        'سرپرست فنی': app.technicalLead || '',
        'پیمانکار / توسعه‌دهنده': app.vendorName || '',
        'بستر استقرار': app.deployEnvironment,
        'تعداد سرورها': (app.servers || []).length,
        'اسامی سرورها': (app.servers || []).map(s => s.hostname).join(' | ') || '-',
        'آدرس‌های IP سرورها': (app.servers || []).map(s => `${s.hostname}: ${s.ipInternal}`).join(' | ') || '-',
        'فریم‌ورک‌های بک‌اند': backendVal,
        'پایگاه‌های داده': dbVal,
        'تاریخ ثبت': app.createdDateShamsi,
        'آخرین ویرایش': app.updatedDateShamsi,
        'شماره بازنگری': app.currentVersionNumber,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'شناسنامه نرم‌افزارها');
    XLSX.writeFile(workbook, `شناسنامه_نرم‌افزارهای_سازمان_${Date.now()}.xlsx`);
  };

  const criticalityConfig: { [key: string]: { label: string; bg: string; text: string } } = {
    TIER_1_CRITICAL: { label: 'حیاتی درجه ۱', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-400' },
    TIER_2_IMPORTANT: { label: 'مهم سازمانی', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-400' },
    TIER_3_NORMAL: { label: 'عادی', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-400' },
    TIER_4_LOW: { label: 'پشتیبان', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
  };

  const statusConfig: { [key: string]: { label: string; color: string } } = {
    ACTIVE: { label: 'فعال در مدار', color: 'text-emerald-600 dark:text-emerald-400' },
    DEVELOPMENT: { label: 'در حال توسعه', color: 'text-indigo-600 dark:text-indigo-400' },
    MAINTENANCE: { label: 'پشتیبانی', color: 'text-amber-600 dark:text-amber-400' },
    DEPRECATED: { label: 'منسوخ', color: 'text-orange-600 dark:text-orange-400' },
    RETIRED: { label: 'خارج از سرویس', color: 'text-slate-400' },
  };

  return (
    <div className="space-y-5">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>فهرست و شناسنامه نرم‌افزارهای سازمان</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
              {filteredApps.length} نرم‌افزار
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            کنترل یکپارچه نسخ، پشته فناوری، زیرساخت و ماتریس دسترسی طبقات
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>چاپ فهرست</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>خروجی اکسل</span>
          </button>

          {canCreateAny && (
            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-md shadow-indigo-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت نرم‌افزار جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام نرم‌افزار، کد ردیابی، متولی یا پیمانکار..."
            className="w-full pr-9 pl-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={filterCriticality}
            onChange={e => setFilterCriticality(e.target.value)}
            className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="ALL">همه سطوح اهمیت (Criticality)</option>
            <option value="TIER_1_CRITICAL">حیاتی درجه ۱ (Tier-1)</option>
            <option value="TIER_2_IMPORTANT">مهم سازمانی (Tier-2)</option>
            <option value="TIER_3_NORMAL">عادی (Tier-3)</option>
            <option value="TIER_4_LOW">پشتیبان (Tier-4)</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="ALL">همه وضعیت‌های عملیاتی</option>
            <option value="ACTIVE">فعال در مدار</option>
            <option value="DEVELOPMENT">در حال توسعه</option>
            <option value="MAINTENANCE">پشتیبانی و نگهداری</option>
            <option value="DEPRECATED">منسوخ‌شده</option>
            <option value="RETIRED">خارج از سرویس</option>
          </select>
        </div>
      </div>

      {/* Main Software Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4">کد ردیابی</th>
                <th className="py-3 px-4">نام نرم‌افزار</th>
                <th className="py-3 px-4">نسخه و بازنگری</th>
                <th className="py-3 px-4">سطح اهمیت</th>
                <th className="py-3 px-4">معاونت متولی</th>
                <th className="py-3 px-4">سرورها و زیرساخت</th>
                <th className="py-3 px-4">بستر استقرار</th>
                <th className="py-3 px-4">وضعیت</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredApps.map(app => {
                const crit = criticalityConfig[app.criticality] || criticalityConfig.TIER_3_NORMAL;
                const stat = statusConfig[app.status] || { label: app.status, color: 'text-slate-500' };
                const serverCount = (app.servers || []).length;

                return (
                  <tr key={app.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {app.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {app.nameFa}
                      </div>
                      {app.nameEn && (
                        <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                          {app.nameEn}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-slate-700 dark:text-slate-300">v{app.version}</span>
                      <span className="text-[10px] text-slate-400 mr-1.5">(Rev #{app.currentVersionNumber})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${crit.bg} ${crit.text}`}>
                        {crit.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {app.ownerDepartment}
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        title={`${serverCount} سرور استقرار برای این سامانه ثبت شده است.`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80"
                      >
                        <Server className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>{serverCount} سرور</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {app.deployEnvironment}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={stat.color}>{stat.label}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Passport */}
                        <button
                          onClick={() => onView(app)}
                          title="مشاهده شناسنامه کامل و چاپ"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Version History */}
                        <button
                          onClick={() => onViewHistory(app)}
                          title="تاریخچه نسخ و بازنگری‌ها"
                          className="p-1.5 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Edit - Guarded by Permission */}
                        {canEditAny && (
                          <button
                            onClick={() => onEdit(app)}
                            title="ویرایش متادیتا و خصوصیات"
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete - Guarded by Permission & Triggers Dependency Check */}
                        {canDeleteAny && (
                          <button
                            onClick={() => handleDeleteClick(app)}
                            title="حذف شناسنامه (با کنترل وابستگی)"
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    هیچ نرم‌افزاری منطبق با فیلترهای جستجو یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dependency-Controlled Delete Confirmation Modal */}
      {deleteTarget && checkResult && (
        <ConfirmDeleteModal
          isOpen={Boolean(deleteTarget)}
          title={`درخواست حذف شناسنامه: ${deleteTarget.nameFa}`}
          itemName={deleteTarget.nameFa}
          itemType="نرم‌افزار"
          checkResult={checkResult}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteTarget(null);
            setCheckResult(null);
          }}
        />
      )}

      {/* Software Catalog Print Modal */}
      {isPrintModalOpen && (
        <PrintPreviewModal
          isOpen={isPrintModalOpen}
          options={{
            title: 'فهرست رسمی نرم‌افزارهای سازمان و وضعیت عملیاتی',
            subtitle: `تعداد سامانه‌ها: ${filteredApps.length} نرم‌افزار سازمانی`,
            reportDateShamsi: getCurrentShamsiDate(),
            department: 'اداره کل فناوری اطلاعات و دولت الکترونیک',
            contentHtml: `
              <table style="width:100%;border-collapse:collapse;font-size:10px;text-align:right;">
                <thead>
                  <tr style="background:#f1f5f9;">
                    <th style="border:1px solid #cbd5e1;padding:6px;">ردیف</th>
                    <th style="border:1px solid #cbd5e1;padding:6px;">کد ردیابی</th>
                    <th style="border:1px solid #cbd5e1;padding:6px;">نام نرم‌افزار</th>
                    <th style="border:1px solid #cbd5e1;padding:6px;">نسخه</th>
                    <th style="border:1px solid #cbd5e1;padding:6px;">سطح اهمیت</th>
                    <th style="border:1px solid #cbd5e1;padding:6px;">معاونت متولی</th>
                    <th style="border:1px solid #cbd5e1;padding:6px;">پیمانکار / توسعه</th>
                    <th style="border:1px solid #cbd5e1;padding:6px;">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredApps.map((app, idx) => `
                    <tr>
                      <td style="border:1px solid #e2e8f0;padding:5px;text-align:center;">${idx + 1}</td>
                      <td style="border:1px solid #e2e8f0;padding:5px;font-family:monospace;font-weight:bold;">${app.code}</td>
                      <td style="border:1px solid #e2e8f0;padding:5px;font-weight:bold;">${app.nameFa}</td>
                      <td style="border:1px solid #e2e8f0;padding:5px;font-family:monospace;">v${app.version}</td>
                      <td style="border:1px solid #e2e8f0;padding:5px;">${criticalityConfig[app.criticality]?.label || app.criticality}</td>
                      <td style="border:1px solid #e2e8f0;padding:5px;">${app.ownerDepartment}</td>
                      <td style="border:1px solid #e2e8f0;padding:5px;">${app.vendorName || 'بومی'}</td>
                      <td style="border:1px solid #e2e8f0;padding:5px;">${statusConfig[app.status]?.label || app.status}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `,
          }}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
