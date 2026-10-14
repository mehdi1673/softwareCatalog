import React, { useState } from 'react';
import { X, Printer, Layers, Shield, Calendar, Server, Building2, CheckCircle2, Cpu, HardDrive } from 'lucide-react';
import { SoftwareApplication, Category, Role, DynamicServerAttribute } from '../types';
import { PrintPreviewModal } from './PrintPreviewModal';
import { ServerTopologyWidget } from './ServerTopologyWidget';
import { printHtmlContent } from '../utils/printHelper';
import { getCurrentShamsiDate } from '../utils/shamsi';

interface SoftwareDetailModalProps {
  isOpen: boolean;
  software: SoftwareApplication | null;
  categories: Category[];
  serverAttributes: DynamicServerAttribute[];
  currentRole: Role;
  onClose: () => void;
  onOpenHistory: () => void;
}

export const SoftwareDetailModal: React.FC<SoftwareDetailModalProps> = ({
  isOpen,
  software,
  categories,
  serverAttributes,
  currentRole,
  onClose,
  onOpenHistory,
}) => {
  const [showPrintModal, setShowPrintModal] = useState(false);

  if (!isOpen || !software) return null;

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  // Filter categories user is allowed to view (Requirement 21)
  const allowedCategories = categories.filter(cat => {
    const perm = currentRole.categoryPermissions[cat.id];
    return perm ? perm.canView : false;
  });

  // Server Topology View Permission
  const canViewServers = currentRole.serverPermissions ? currentRole.serverPermissions.canView : true;

  const criticalityLabels = {
    TIER_1_CRITICAL: 'حیاتی درجه ۱ (Tier-1)',
    TIER_2_IMPORTANT: 'مهم سازمانی (Tier-2)',
    TIER_3_NORMAL: 'عادی (Tier-3)',
    TIER_4_LOW: 'پشتیبان (Tier-4)',
  };

  const statusLabels = {
    ACTIVE: 'فعال و در مدار',
    DEVELOPMENT: 'در حال توسعه',
    MAINTENANCE: 'پشتیبانی و نگهداری',
    DEPRECATED: 'منسوخ‌شده',
    RETIRED: 'خارج از مدار',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header - Hidden in Print */}
        <div className="no-print px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                شناسنامه فنی و حاکمیتی نرم‌افزار
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                کد سامانه: {software.code} | نسخه: {software.version} (Rev #{software.currentVersionNumber})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenHistory}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl border border-indigo-200 dark:border-indigo-900/60 transition"
            >
              تاریخچه تغییرات نسخ
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 transition"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ شناسنامه</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Passport Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-slate-900 dark:text-slate-100">
          {/* Printable Official Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
                جمهوری اسلامی ایران - سامانه ثبت و ممیزی دارایی‌های نرم‌افزاری سازمان
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {software.nameFa}
              </h1>
              {software.nameEn && (
                <div className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">
                  {software.nameEn}
                </div>
              )}
            </div>
            <div className="text-left font-mono text-xs text-slate-600 dark:text-slate-400">
              <div>کد شناسه: <strong className="text-slate-900 dark:text-white">{software.code}</strong></div>
              <div>تاریخ ثبت: {software.createdDateShamsi}</div>
              <div>آخرین بازنگری: {software.updatedDateShamsi}</div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400 block mb-1">وضعیت عملیاتی</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {statusLabels[software.status] || software.status}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400 block mb-1">سطح اهمیت</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {criticalityLabels[software.criticality] || software.criticality}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400 block mb-1">معاونت متولی</span>
              <span className="text-xs font-bold truncate block">{software.ownerDepartment}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400 block mb-1">پیمانکار / توسعه</span>
              <span className="text-xs font-bold truncate block">{software.vendorName || 'بومی سازمانی'}</span>
            </div>
          </div>

          {software.description && (
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                شرح و مأموریت سامانه
              </h3>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {software.description}
              </p>
            </div>
          )}

          {/* Dynamic Categories Section */}
          <div className="space-y-6">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-r-4 border-indigo-600 pr-2">
              طبقات داینامیک و مشخصات فنی شناسنامه
            </h2>

            {allowedCategories.map(cat => {
              const catRecords = software.categoryValues?.[cat.id] || [];

              return (
                <div key={cat.id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {cat.nameFa}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {cat.code}
                    </span>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cat.attributes.map(attr => {
                      const record = catRecords.find(r => r.attributeId === attr.id);
                      const values = record?.values || [];

                      return (
                        <div key={attr.id} className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                            {attr.labelFa}:
                          </span>

                          {values.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">ثبت نشده</span>
                          ) : attr.isMultiValue ? (
                            <div className="flex flex-wrap gap-1.5">
                              {values.map((v, vIdx) => (
                                <span
                                  key={vIdx}
                                  className="px-2 py-0.5 rounded-md text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/80 font-medium"
                                >
                                  {v}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {attr.dataType === 'boolean'
                                ? (values[0] === 'true' ? 'بله ✓' : 'خیر ✕')
                                : values[0]}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dependencies Section */}
          {software.dependencies && software.dependencies.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>سامانه‌های متصل و وابستگی‌ها ({software.dependencies.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {software.dependencies.map((dep, dIdx) => (
                  <div key={dIdx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">{dep.targetSoftwareName}</span>
                    <span className="text-[11px] text-slate-500">{dep.relationType} - {dep.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Server Infrastructure Topology Section (Requirement 4 & RBAC) */}
          {canViewServers && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>توپولوژی سرورها و ماشین‌های استقرار ({(software.servers || []).length} سرور)</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  مشخصات سخت‌افزاری، آدرس‌های شبکه و خصوصیات داینامیک سرورها
                </span>
              </div>

              <ServerTopologyWidget
                servers={software.servers || []}
                softwareId={software.id}
                softwareName={software.nameFa}
                serverAttributes={serverAttributes}
                onAddServer={() => {}}
                onUpdateServer={() => {}}
                onDeleteServer={() => {}}
                onAddCustomServerAttribute={() => {}}
                isReadOnly={true}
              />
            </div>
          )}

          {/* Official Signatures in Print */}
          <div className="print-only hidden pt-12 border-t border-slate-300 mt-8">
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              <div>
                <p className="font-bold">تأیید سرپرست فنی نرم‌افزار</p>
                <p className="mt-8 text-slate-400">امضا و تاریخ</p>
              </div>
              <div>
                <p className="font-bold">تأیید ممیز امنیت اطلاعات (افتا)</p>
                <p className="mt-8 text-slate-400">امضا و تاریخ</p>
              </div>
              <div>
                <p className="font-bold">تأیید مدیر کل فناوری اطلاعات</p>
                <p className="mt-8 text-slate-400">مهر و امضا</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPrintModal && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          options={{
            title: `شناسنامه فنی و حاکمیتی نرم‌افزار: ${software.nameFa}`,
            subtitle: `کد ردیابی: ${software.code} | نسخه: ${software.version} | بازنگری: #${software.currentVersionNumber}`,
            reportDateShamsi: getCurrentShamsiDate(),
            department: software.ownerDepartment,
            contentHtml: `
              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 13px; font-weight: bold; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin-bottom: 8px;">
                  ۱. مشخصات عمومی و سازمانی
                </h3>
                <table style="width:100%; border-collapse:collapse; font-size:10px;">
                  <tr>
                    <td style="width:25%; font-weight:bold; background:#f1f5f9;">کد ردیابی:</td>
                    <td style="width:25%; font-family:monospace;">${software.code}</td>
                    <td style="width:25%; font-weight:bold; background:#f1f5f9;">نسخه نرم‌افزار:</td>
                    <td style="width:25%; font-family:monospace;">v${software.version} (Rev #${software.currentVersionNumber})</td>
                  </tr>
                  <tr>
                    <td style="font-weight:bold; background:#f1f5f9;">نام کامل فارسی:</td>
                    <td>${software.nameFa}</td>
                    <td style="font-weight:bold; background:#f1f5f9;">نام انگلیسی:</td>
                    <td style="font-family:monospace;">${software.nameEn || '-'}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:bold; background:#f1f5f9;">سطح اهمیت:</td>
                    <td>${criticalityLabels[software.criticality] || software.criticality}</td>
                    <td style="font-weight:bold; background:#f1f5f9;">وضعیت عملیاتی:</td>
                    <td>${statusLabels[software.status] || software.status}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:bold; background:#f1f5f9;">معاونت متولی:</td>
                    <td>${software.ownerDepartment}</td>
                    <td style="font-weight:bold; background:#f1f5f9;">پیمانکار / توسعه:</td>
                    <td>${software.vendorName || 'بومی سازمانی'}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:bold; background:#f1f5f9;">سرپرست فنی:</td>
                    <td>${software.technicalLead || '-'}</td>
                    <td style="font-weight:bold; background:#f1f5f9;">بستر استقرار:</td>
                    <td>${software.deployEnvironment}</td>
                  </tr>
                </table>
              </div>

              ${software.description ? `
                <div style="margin-bottom: 15px; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10px;">
                  <strong>شرح و مأموریت سامانه:</strong> ${software.description}
                </div>
              ` : ''}

              <div style="margin-bottom: 15px;">
                <h3 style="font-size: 13px; font-weight: bold; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin-bottom: 8px;">
                  ۲. خصوصیات فنی طبقات داینامیک
                </h3>
                ${allowedCategories.map(cat => {
                  const records = software.categoryValues?.[cat.id] || [];
                  return `
                    <div style="margin-bottom: 10px;">
                      <div style="font-weight: bold; font-size: 11px; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; margin-bottom: 4px;">
                        ${cat.nameFa} (${cat.code})
                      </div>
                      <table style="width:100%; border-collapse:collapse; font-size:10px;">
                        ${cat.attributes.map(attr => {
                          const r = records.find(item => item.attributeId === attr.id);
                          const valStr = r && r.values && r.values.length > 0 ? r.values.join('، ') : '-';
                          return `
                            <tr>
                              <td style="width:35%; font-weight:600; border:1px solid #e2e8f0; padding:4px 8px; background:#f8fafc;">
                                ${attr.labelFa}:
                              </td>
                              <td style="border:1px solid #e2e8f0; padding:4px 8px;">
                                ${valStr}
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </table>
                    </div>
                  `;
                }).join('')}
              </div>

              ${software.dependencies && software.dependencies.length > 0 ? `
                <div style="margin-bottom: 15px;">
                  <h3 style="font-size: 13px; font-weight: bold; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin-bottom: 8px;">
                    ۳. وابستگی‌ها و ارتباطات سامانه‌ای
                  </h3>
                  <table style="width:100%; border-collapse:collapse; font-size:10px;">
                    <thead>
                      <tr style="background:#f1f5f9;">
                        <th style="border:1px solid #cbd5e1; padding:5px;">سامانه وابسته</th>
                        <th style="border:1px solid #cbd5e1; padding:5px;">نوع رابطه</th>
                        <th style="border:1px solid #cbd5e1; padding:5px;">شرح پروتکل / وب‌سرویس</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${software.dependencies.map(d => `
                        <tr>
                          <td style="border:1px solid #e2e8f0; padding:5px; font-weight:bold;">${d.targetSoftwareName}</td>
                          <td style="border:1px solid #e2e8f0; padding:5px;">${d.relationType}</td>
                          <td style="border:1px solid #e2e8f0; padding:5px;">${d.description}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              ${software.servers && software.servers.length > 0 ? `
                <div style="margin-bottom: 15px;">
                  <h3 style="font-size: 13px; font-weight: bold; border-bottom: 1px solid #94a3b8; padding-bottom: 4px; margin-bottom: 8px;">
                    ۴. زیرساخت سرورها، شبکه و ماشین‌های استقرار (${software.servers.length} سرور)
                  </h3>
                  <table style="width:100%; border-collapse:collapse; font-size:10px;">
                    <thead>
                      <tr style="background:#f1f5f9;">
                        <th style="border:1px solid #cbd5e1; padding:5px;">نام میزبان (Hostname)</th>
                        <th style="border:1px solid #cbd5e1; padding:5px;">نقش سرور</th>
                        <th style="border:1px solid #cbd5e1; padding:5px;">محیط</th>
                        <th style="border:1px solid #cbd5e1; padding:5px;">آدرس IP داخلی / خارجی</th>
                        <th style="border:1px solid #cbd5e1; padding:5px;">مشخصات سخت‌افزاری</th>
                        <th style="border:1px solid #cbd5e1; padding:5px;">سیستم‌عامل و پلتفرم</th>
                        <th style="border:1px solid #cbd5e1; padding:5px;">زون امنیتی و دیتاسنتر</th>
                        <th style="border:1px solid #cbd5e1; padding:5px;">وضعیت</th>
                        <th style="border:1px solid #cbd5e1; padding:5px;">خصوصیات داینامیک سرور</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${software.servers.map(s => {
                        const customPropsStr = serverAttributes
                          .map(attr => {
                            const vals = s.customAttributeValues?.[attr.id] || [];
                            return vals.length > 0 ? `${attr.labelFa}: ${vals.join(', ')}` : null;
                          })
                          .filter(Boolean)
                          .join(' | ');

                        return `
                          <tr>
                            <td style="border:1px solid #e2e8f0; padding:5px; font-family:monospace; font-weight:bold;">${s.hostname}</td>
                            <td style="border:1px solid #e2e8f0; padding:5px;">${s.serverRole}</td>
                            <td style="border:1px solid #e2e8f0; padding:5px;">${s.environment}</td>
                            <td style="border:1px solid #e2e8f0; padding:5px; font-family:monospace;">${s.ipInternal} ${s.ipExternal ? ` / ${s.ipExternal}` : ''}</td>
                            <td style="border:1px solid #e2e8f0; padding:5px;">${s.vcpu} vCPU / ${s.ramGb}GB RAM / ${s.storageDisk}</td>
                            <td style="border:1px solid #e2e8f0; padding:5px;">${s.operatingSystem} (${s.virtualization})</td>
                            <td style="border:1px solid #e2e8f0; padding:5px;">${s.securityZone} - ${s.datacenterLocation}</td>
                            <td style="border:1px solid #e2e8f0; padding:5px; font-weight:bold;">${s.status}</td>
                            <td style="border:1px solid #e2e8f0; padding:5px; font-size:9px;">${customPropsStr || '-'}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}
            `,
          }}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
