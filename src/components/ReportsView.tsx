import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Layers, 
  CheckSquare, 
  Square, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Download, 
  ShieldCheck, 
  Server, 
  Sparkles, 
  RefreshCw, 
  FolderTree, 
  Eye, 
  Search, 
  Cpu, 
  HardDrive, 
  Check 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SoftwareApplication, Category, Role, DynamicServerAttribute } from '../types';
import { PrintPreviewModal } from './PrintPreviewModal';
import { printHtmlContent, PrintDocumentOptions } from '../utils/printHelper';
import { getCurrentShamsiDate } from '../utils/shamsi';

interface ReportsViewProps {
  softwareList: SoftwareApplication[];
  categories: Category[];
  serverAttributes: DynamicServerAttribute[];
  currentRole: Role;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  softwareList,
  categories,
  serverAttributes,
  currentRole,
}) => {
  // Only categories user has view permission for (Requirement 21)
  const allowedCategories = categories.filter(c => currentRole.categoryPermissions[c.id]?.canView);

  // Search keyword state
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Categories map: { [catId: string]: boolean }
  const [selectedCategories, setSelectedCategories] = useState<{ [catId: string]: boolean }>(() => {
    const initial: { [catId: string]: boolean } = {};
    // By default, select first 3 categories
    allowedCategories.slice(0, 3).forEach(c => {
      initial[c.id] = true;
    });
    return initial;
  });

  // Selected Attributes map: { [catId: string]: { [attrId: string]: boolean } }
  const [selectedAttributes, setSelectedAttributes] = useState<{ [catId: string]: { [attrId: string]: boolean } }>(() => {
    const initial: { [catId: string]: { [attrId: string]: boolean } } = {};
    allowedCategories.forEach(c => {
      initial[c.id] = {};
      c.attributes.forEach(a => {
        initial[c.id][a.id] = true;
      });
    });
    return initial;
  });

  // General fields selection
  const [generalFields, setGeneralFields] = useState({
    code: true,
    nameFa: true,
    version: true,
    status: true,
    criticality: true,
    ownerDepartment: true,
    technicalLead: false,
    vendorName: false,
    deployEnvironment: true,
  });

  // Server & Infrastructure fields selection (Requirement 4)
  const [serverFields, setServerFields] = useState({
    includeServers: true,
    serverCount: true,
    hostnames: true,
    serverRoles: true,
    ipAddresses: true,
    hardwareSpecs: true,
    operatingSystems: false,
    datacenterZones: false,
    serverStatus: false,
    customAttributes: true,
  });

  // Selected Dynamic Server Custom Attributes: { [attrId: string]: boolean }
  const [selectedServerAttrs, setSelectedServerAttrs] = useState<{ [attrId: string]: boolean }>(() => {
    const initial: { [attrId: string]: boolean } = {};
    serverAttributes.forEach(attr => {
      initial[attr.id] = true;
    });
    return initial;
  });

  // Filter state
  const [filterCriticality, setFilterCriticality] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Expanded categories accordion in configuration
  const [expandedCats, setExpandedCats] = useState<{ [catId: string]: boolean }>({});
  const [expandedServerSection, setExpandedServerSection] = useState<boolean>(true);

  // Print Preview Modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [directPrintFeedback, setDirectPrintFeedback] = useState<string | null>(null);

  // Toggle Category selection
  const handleToggleCategory = (catId: string) => {
    const nextState = !selectedCategories[catId];
    setSelectedCategories(prev => ({ ...prev, [catId]: nextState }));
    if (nextState) {
      setExpandedCats(prev => ({ ...prev, [catId]: true }));
      setSelectedAttributes(prev => {
        const cat = allowedCategories.find(c => c.id === catId);
        const catAttrs: { [attrId: string]: boolean } = {};
        cat?.attributes.forEach(a => { catAttrs[a.id] = true; });
        return { ...prev, [catId]: catAttrs };
      });
    }
  };

  // Toggle Attribute selection
  const handleToggleAttribute = (catId: string, attrId: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || {}),
        [attrId]: !prev[catId]?.[attrId],
      },
    }));
  };

  // Select all categories & attributes
  const handleSelectAll = () => {
    const catMap: { [catId: string]: boolean } = {};
    const attrMap: { [catId: string]: { [attrId: string]: boolean } } = {};
    allowedCategories.forEach(c => {
      catMap[c.id] = true;
      attrMap[c.id] = {};
      c.attributes.forEach(a => {
        attrMap[c.id][a.id] = true;
      });
    });
    setSelectedCategories(catMap);
    setSelectedAttributes(attrMap);
    setServerFields(prev => ({ ...prev, includeServers: true }));
  };

  // Deselect all categories
  const handleDeselectAll = () => {
    const catMap: { [catId: string]: boolean } = {};
    allowedCategories.forEach(c => {
      catMap[c.id] = false;
    });
    setSelectedCategories(catMap);
    setServerFields(prev => ({ ...prev, includeServers: false }));
  };

  // Filter software list
  const filteredSoftware = softwareList.filter(app => {
    const matchesCrit = filterCriticality === 'ALL' || app.criticality === filterCriticality;
    const matchesStat = filterStatus === 'ALL' || app.status === filterStatus;
    const matchesSearch = !searchTerm.trim() || 
      app.nameFa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.ownerDepartment.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCrit && matchesStat && matchesSearch;
  });

  // Calculate active categories and columns
  const activeSelectedCategories = allowedCategories.filter(c => selectedCategories[c.id]);

  // Generate Excel Export (.xlsx)
  const handleExportExcel = () => {
    const rows = filteredSoftware.map(app => {
      const rowData: { [colName: string]: any } = {};

      // General fields
      if (generalFields.code) rowData['کد ردیابی'] = app.code;
      if (generalFields.nameFa) rowData['نام نرم‌افزار'] = app.nameFa;
      if (generalFields.version) rowData['نسخه'] = `v${app.version}`;
      if (generalFields.status) rowData['وضعیت عملیاتی'] = app.status;
      if (generalFields.criticality) rowData['سطح اهمیت'] = app.criticality;
      if (generalFields.ownerDepartment) rowData['معاونت متولی'] = app.ownerDepartment;
      if (generalFields.technicalLead) rowData['سرپرست فنی'] = app.technicalLead || '-';
      if (generalFields.vendorName) rowData['پیمانکار / توسعه'] = app.vendorName || 'بومی';
      if (generalFields.deployEnvironment) rowData['بستر استقرار'] = app.deployEnvironment;

      // Dynamic Categories and Selected Attributes
      activeSelectedCategories.forEach(cat => {
        const catRecords = app.categoryValues?.[cat.id] || [];
        const activeCatAttrs = cat.attributes.filter(a => selectedAttributes[cat.id]?.[a.id]);

        activeCatAttrs.forEach(attr => {
          const rec = catRecords.find(r => r.attributeId === attr.id);
          const colTitle = `[${cat.nameFa}] ${attr.labelFa}`;
          if (rec && rec.values && rec.values.length > 0) {
            rowData[colTitle] = rec.values.join('، ');
          } else {
            rowData[colTitle] = '-';
          }
        });
      });

      // Servers & Infrastructure Fields (Requirement 4)
      if (serverFields.includeServers) {
        const servers = app.servers || [];
        if (serverFields.serverCount) {
          rowData['[زیرساخت] تعداد سرورها'] = servers.length;
        }
        if (serverFields.hostnames) {
          rowData['[زیرساخت] اسامی سرورها'] = servers.map(s => s.hostname).join(' | ') || '-';
        }
        if (serverFields.serverRoles) {
          rowData['[زیرساخت] نقش‌های سرورها'] = servers.map(s => `${s.hostname}: ${s.serverRole}`).join(' | ') || '-';
        }
        if (serverFields.ipAddresses) {
          rowData['[زیرساخت] آدرس‌های IP'] = servers.map(s => `${s.hostname}: ${s.ipInternal}${s.ipExternal ? ` (${s.ipExternal})` : ''}`).join(' | ') || '-';
        }
        if (serverFields.hardwareSpecs) {
          const totalVcpu = servers.reduce((acc, s) => acc + (s.vcpu || 0), 0);
          const totalRam = servers.reduce((acc, s) => acc + (s.ramGb || 0), 0);
          rowData['[زیرساخت] مجموع سخت‌افزار'] = servers.length > 0 ? `${totalVcpu} vCPU / ${totalRam} GB RAM` : '-';
        }
        if (serverFields.operatingSystems) {
          rowData['[زیرساخت] سیستم‌عامل'] = servers.map(s => `${s.hostname}: ${s.operatingSystem}`).join(' | ') || '-';
        }
        if (serverFields.datacenterZones) {
          rowData['[زیرساخت] زون‌های امنیتی و دیتاسنتر'] = servers.map(s => `${s.hostname}: ${s.securityZone} (${s.datacenterLocation})`).join(' | ') || '-';
        }
        if (serverFields.serverStatus) {
          rowData['[زیرساخت] وضعیت سرورها'] = servers.map(s => `${s.hostname}: ${s.status}`).join(' | ') || '-';
        }

        // Custom Server Dynamic Attributes
        if (serverFields.customAttributes) {
          serverAttributes.filter(attr => selectedServerAttrs[attr.id]).forEach(attr => {
            const valsList = servers.map(s => {
              const vals = s.customAttributeValues?.[attr.id] || [];
              return vals.length > 0 ? `${s.hostname}: [${vals.join(', ')}]` : null;
            }).filter(Boolean);
            rowData[`[سرور-داینامیک] ${attr.labelFa}`] = valsList.join(' | ') || '-';
          });
        }
      }

      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'گزارش جامع نرم‌افزارها');
    XLSX.writeFile(wb, `گزارش_جامع_شناسنامه_نرم‌افزارها_${Date.now()}.xlsx`);
  };

  // Generate HTML for print
  const generatePrintHtml = (): string => {
    let theadHtml = '<thead><tr>';

    // General columns
    if (generalFields.code) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#f1f5f9;">کد</th>';
    if (generalFields.nameFa) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#f1f5f9;">نام نرم‌افزار</th>';
    if (generalFields.version) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#f1f5f9;">نسخه</th>';
    if (generalFields.status) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#f1f5f9;">وضعیت</th>';
    if (generalFields.criticality) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#f1f5f9;">اهمیت</th>';
    if (generalFields.ownerDepartment) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#f1f5f9;">متولی</th>';
    if (generalFields.deployEnvironment) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#f1f5f9;">بستر</th>';

    // Categories attributes
    activeSelectedCategories.forEach(cat => {
      const activeCatAttrs = cat.attributes.filter(a => selectedAttributes[cat.id]?.[a.id]);
      activeCatAttrs.forEach(attr => {
        theadHtml += `<th style="border:1px solid #cbd5e1;padding:6px;background:#e2e8f0;font-size:9px;">[${cat.nameFa}]<br>${attr.labelFa}</th>`;
      });
    });

    // Server columns in print
    if (serverFields.includeServers) {
      if (serverFields.serverCount) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#e0e7ff;font-size:9px;">تعداد سرور</th>';
      if (serverFields.hostnames) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#e0e7ff;font-size:9px;">اسامی سرورها</th>';
      if (serverFields.ipAddresses) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#e0e7ff;font-size:9px;">آدرس‌های IP</th>';
      if (serverFields.hardwareSpecs) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#e0e7ff;font-size:9px;">مجموع منابع سخت‌افزار</th>';
      if (serverFields.operatingSystems) theadHtml += '<th style="border:1px solid #cbd5e1;padding:6px;background:#e0e7ff;font-size:9px;">سیستم‌عامل</th>';
    }

    theadHtml += '</tr></thead>';

    // Rows
    let tbodyHtml = '<tbody>';
    filteredSoftware.forEach(app => {
      tbodyHtml += '<tr>';
      if (generalFields.code) tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;font-family:monospace;font-weight:bold;">${app.code}</td>`;
      if (generalFields.nameFa) tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;font-weight:bold;">${app.nameFa}</td>`;
      if (generalFields.version) tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;font-family:monospace;">v${app.version}</td>`;
      if (generalFields.status) tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;">${app.status}</td>`;
      if (generalFields.criticality) tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;">${app.criticality === 'TIER_1_CRITICAL' ? 'حیاتی ۱' : 'مهم ۲'}</td>`;
      if (generalFields.ownerDepartment) tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;">${app.ownerDepartment}</td>`;
      if (generalFields.deployEnvironment) tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;">${app.deployEnvironment}</td>`;

      activeSelectedCategories.forEach(cat => {
        const catRecords = app.categoryValues?.[cat.id] || [];
        const activeCatAttrs = cat.attributes.filter(a => selectedAttributes[cat.id]?.[a.id]);
        activeCatAttrs.forEach(attr => {
          const rec = catRecords.find(r => r.attributeId === attr.id);
          const valStr = rec && rec.values && rec.values.length > 0 ? rec.values.join('، ') : '-';
          tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;font-size:9px;">${valStr}</td>`;
        });
      });

      if (serverFields.includeServers) {
        const srvs = app.servers || [];
        if (serverFields.serverCount) tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;font-weight:bold;text-align:center;">${srvs.length}</td>`;
        if (serverFields.hostnames) tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;font-family:monospace;font-size:9px;">${srvs.map(s => s.hostname).join('<br>') || '-'}</td>`;
        if (serverFields.ipAddresses) tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;font-family:monospace;font-size:9px;">${srvs.map(s => s.ipInternal).join('<br>') || '-'}</td>`;
        if (serverFields.hardwareSpecs) {
          const totalVcpu = srvs.reduce((acc, s) => acc + (s.vcpu || 0), 0);
          const totalRam = srvs.reduce((acc, s) => acc + (s.ramGb || 0), 0);
          tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;font-size:9px;">${srvs.length > 0 ? `${totalVcpu} Core / ${totalRam} GB` : '-'}</td>`;
        }
        if (serverFields.operatingSystems) tbodyHtml += `<td style="border:1px solid #e2e8f0;padding:5px;font-size:9px;">${srvs.map(s => s.operatingSystem).join('<br>') || '-'}</td>`;
      }

      tbodyHtml += '</tr>';
    });
    tbodyHtml += '</tbody>';

    return `
      <table style="width:100%; border-collapse:collapse; font-size:10px;">
        ${theadHtml}
        ${tbodyHtml}
      </table>
    `;
  };

  // Direct 1-Click Print Handler
  const handleDirectPrint = () => {
    const printDoc: PrintDocumentOptions = {
      title: 'گزارش تحلیلی و ممیزی جامع شناسنامه و زیرساخت نرم‌افزارهای سازمان',
      subtitle: `شامل ${filteredSoftware.length} سامانه نرم‌افزاری | فیلتر اهمیت: ${filterCriticality} | فیلتر وضعیت: ${filterStatus}`,
      reportDateShamsi: getCurrentShamsiDate(),
      department: 'معاونت فناوری اطلاعات و دولت هوشمند',
      contentHtml: generatePrintHtml(),
    };
    printHtmlContent(printDoc);
    setDirectPrintFeedback('دستور چاپ به چاپگر ارسال گردید.');
    setTimeout(() => setDirectPrintFeedback(null), 3000);
  };

  // KPI Calculations
  const totalCount = softwareList.length;
  const tier1Count = softwareList.filter(s => s.criticality === 'TIER_1_CRITICAL').length;
  const activeCount = softwareList.filter(s => s.status === 'ACTIVE').length;
  const totalServersCount = softwareList.reduce((acc, s) => acc + (s.servers?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>گزارش جامع، چندطبقه‌ای و زیرساخت سرورهای سازمان (Dynamic Matrix & Export)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            امکان انتخاب همزمان چند طبقه، خصوصیات هر طبقه و مشخصات داینامیک سرورها جهت تولید گزارش، چاپ رسمی و خروجی اکسل
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {directPrintFeedback && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
              {directPrintFeedback}
            </span>
          )}

          <button
            type="button"
            onClick={handleDirectPrint}
            title="ارسال مستقیم سند به پرینتر بدون واسطه"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>ارسال مستقیم به چاپگر (Print)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>پیش‌نمایش سند چاپی</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>خروجی اکسل جامع (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">مجموع نرم‌افزارها</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalCount}</div>
          <span className="text-[10px] text-emerald-600 font-bold">۱۰۰٪ پوشش شناسنامه</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">حیاتی درجه ۱ (Tier-1)</span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{tier1Count}</div>
          <span className="text-[10px] text-slate-400">تحت پایش مرکز افتا</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">فعال در مدار عملیات</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{activeCount}</div>
          <span className="text-[10px] text-slate-400">{Math.round((activeCount / (totalCount || 1)) * 100)}% ضریب بهره‌برداری</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">کل سرورهای استقرار</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalServersCount}</div>
          <span className="text-[10px] text-slate-400">ماشین‌های فیزیکی و ابری</span>
        </div>
      </div>

      {/* Report Configuration Panel: Multi-Category, Attribute & Server Picker */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>تنظیم ستون‌های گزارش: انتخاب طبقات، خصوصیات داینامیک و زیرساخت سرورها</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              طبقات مورد نظر را تیک بزنید و خصوصیات دلخواه هر طبقه و سرورها را به خروجی جدول و اکسل اضافه نمایید.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
            >
              انتخاب همه موارد
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-xs text-rose-500 hover:underline font-bold cursor-pointer"
            >
              لغو انتخاب همه
            </button>
          </div>
        </div>

        {/* General Fields Checkboxes */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            ستون‌های مشخصات عمومی سامانه:
          </span>
          <div className="flex flex-wrap gap-2.5 text-xs">
            {[
              { key: 'code', label: 'کد ردیابی' },
              { key: 'nameFa', label: 'نام فارسی سامانه' },
              { key: 'version', label: 'نسخه فعلی' },
              { key: 'status', label: 'وضعیت عملیاتی' },
              { key: 'criticality', label: 'سطح اهمیت (Tier)' },
              { key: 'ownerDepartment', label: 'معاونت متولی' },
              { key: 'technicalLead', label: 'سرپرست فنی' },
              { key: 'vendorName', label: 'پیمانکار / توسعه' },
              { key: 'deployEnvironment', label: 'بستر استقرار' },
            ].map(col => (
              <label
                key={col.key}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition select-none ${
                  generalFields[col.key as keyof typeof generalFields]
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={generalFields[col.key as keyof typeof generalFields]}
                  onChange={e => setGeneralFields({ ...generalFields, [col.key]: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dynamic Categories & Attributes Multi-Selection Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            طبقات داینامیک شناسنامه و خصوصیات چند مقداری (Category Matrix):
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allowedCategories.map(cat => {
              const isCatSelected = Boolean(selectedCategories[cat.id]);
              const catAttrs = cat.attributes;
              const isExpanded = Boolean(expandedCats[cat.id]);

              return (
                <div 
                  key={cat.id}
                  className={`rounded-xl border transition overflow-hidden ${
                    isCatSelected
                      ? 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850'
                  }`}
                >
                  {/* Category Header */}
                  <div className="p-3 flex items-center justify-between gap-2 bg-white/70 dark:bg-slate-900/70 border-b border-slate-100 dark:border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isCatSelected}
                        onChange={() => handleToggleCategory(cat.id)}
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {cat.nameFa}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {cat.code} | {catAttrs.length} خصوصیت
                        </div>
                      </div>
                    </label>

                    {isCatSelected && (
                      <button
                        type="button"
                        onClick={() => setExpandedCats(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Attributes Checkboxes List if expanded */}
                  {isCatSelected && isExpanded && (
                    <div className="p-3 space-y-2 bg-white/40 dark:bg-slate-900/40">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-bold text-slate-500">خصوصیات این طبقه:</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              const updated: { [k: string]: boolean } = {};
                              catAttrs.forEach(a => { updated[a.id] = true; });
                              setSelectedAttributes(prev => ({ ...prev, [cat.id]: updated }));
                            }}
                            className="text-indigo-600 hover:underline font-bold"
                          >
                            همه
                          </button>
                          <span>|</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated: { [k: string]: boolean } = {};
                              catAttrs.forEach(a => { updated[a.id] = false; });
                              setSelectedAttributes(prev => ({ ...prev, [cat.id]: updated }));
                            }}
                            className="text-rose-500 hover:underline font-bold"
                          >
                            هیچ‌کدام
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {catAttrs.map(attr => {
                          const isAttrSelected = Boolean(selectedAttributes[cat.id]?.[attr.id]);
                          return (
                            <label
                              key={attr.id}
                              className={`flex items-start gap-1.5 p-1.5 rounded-lg text-[11px] cursor-pointer transition select-none ${
                                isAttrSelected 
                                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold' 
                                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isAttrSelected}
                                onChange={() => handleToggleAttribute(cat.id, attr.id)}
                                className="rounded text-indigo-600 focus:ring-0 mt-0.5"
                              />
                              <span className="leading-tight">{attr.labelFa}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Server & Infrastructure Topology Section in Report Builder (Requirement 4) */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={serverFields.includeServers}
                onChange={e => setServerFields(prev => ({ ...prev, includeServers: e.target.checked }))}
                className="rounded text-purple-600 focus:ring-0"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>ستون‌های زیرساخت سرورها، شبکه و ماشین‌های استقرار ({serverAttributes.length} خصوصیت داینامیک)</span>
              </span>
            </label>

            {serverFields.includeServers && (
              <button
                type="button"
                onClick={() => setExpandedServerSection(!expandedServerSection)}
                className="text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{expandedServerSection ? 'بستن گزینه‌ها' : 'مشاهده و انتخاب ستون‌های سرور'}</span>
                {expandedServerSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {serverFields.includeServers && expandedServerSection && (
            <div className="p-3.5 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 block">
                مشخصات اصلی سرورها جهت نمایش در جدول و فایل اکسل:
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { key: 'serverCount', label: 'تعداد کل سرورها' },
                  { key: 'hostnames', label: 'نام‌های میزبان (Hostnames)' },
                  { key: 'serverRoles', label: 'نقش‌های سرور (Web, DB, Cache, ...)' },
                  { key: 'ipAddresses', label: 'آدرس‌های IP (داخلی و VIP)' },
                  { key: 'hardwareSpecs', label: 'مجموع منابع (vCPU و RAM)' },
                  { key: 'operatingSystems', label: 'سیستم‌عامل و پلتفرم' },
                  { key: 'datacenterZones', label: 'زون‌های امنیتی و دیتاسنتر' },
                  { key: 'serverStatus', label: 'وضعیت آنلاین سرورها' },
                ].map(col => (
                  <label
                    key={col.key}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition select-none ${
                      serverFields[col.key as keyof typeof serverFields]
                        ? 'bg-purple-100 dark:bg-purple-900/60 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(serverFields[col.key as keyof typeof serverFields])}
                      onChange={e => setServerFields(prev => ({ ...prev, [col.key]: e.target.checked }))}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>

              {/* Dynamic Server Custom Attributes */}
              <div className="pt-2 border-t border-purple-100 dark:border-purple-900/40">
                <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 block mb-1.5">
                  خصوصیات داینامیک اختصاصی سرورها (Custom Dynamic Attributes):
                </span>
                <div className="flex flex-wrap gap-2">
                  {serverAttributes.map(attr => {
                    const isSelected = Boolean(selectedServerAttrs[attr.id]);
                    return (
                      <label
                        key={attr.id}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer transition select-none ${
                          isSelected
                            ? 'bg-purple-100 dark:bg-purple-950/70 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => setSelectedServerAttrs(prev => ({ ...prev, [attr.id]: e.target.checked }))}
                          className="rounded text-purple-600 focus:ring-0"
                        />
                        <span>{attr.labelFa}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Live Data Table with Search and Filtering */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Filters Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="جستجو در نتایج..."
                className="w-full pr-9 pl-3 py-1.5 text-xs border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-semibold hidden sm:inline">فیلتر اهمیت:</span>
              <select
                value={filterCriticality}
                onChange={e => setFilterCriticality(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="ALL">همه سطوح</option>
                <option value="TIER_1_CRITICAL">حیاتی ۱ (Tier-1)</option>
                <option value="TIER_2_IMPORTANT">مهم ۲ (Tier-2)</option>
                <option value="TIER_3_NORMAL">عادی ۳ (Tier-3)</option>
              </select>

              <span className="text-slate-500 font-semibold hidden sm:inline">وضعیت:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="ACTIVE">فعال در مدار</option>
                <option value="DEVELOPMENT">در حال توسعه</option>
                <option value="MAINTENANCE">پشتیبانی</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
            نمایش {filteredSoftware.length} از {softwareList.length} نرم‌افزار
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 sticky top-0 z-10 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                {generalFields.code && <th className="py-3 px-3">کد</th>}
                {generalFields.nameFa && <th className="py-3 px-4">نام سامانه</th>}
                {generalFields.version && <th className="py-3 px-3">نسخه</th>}
                {generalFields.status && <th className="py-3 px-3">وضعیت</th>}
                {generalFields.criticality && <th className="py-3 px-3">اهمیت</th>}
                {generalFields.ownerDepartment && <th className="py-3 px-4">معاونت متولی</th>}
                {generalFields.deployEnvironment && <th className="py-3 px-3">بستر</th>}

                {/* Dynamic Category Columns */}
                {activeSelectedCategories.map(cat => {
                  const activeCatAttrs = cat.attributes.filter(a => selectedAttributes[cat.id]?.[a.id]);
                  return activeCatAttrs.map(attr => (
                    <th key={`${cat.id}-${attr.id}`} className="py-3 px-3 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 border-r border-indigo-100 dark:border-indigo-900/40 whitespace-nowrap">
                      <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">[{cat.nameFa}]</span>
                      <span>{attr.labelFa}</span>
                    </th>
                  ));
                })}

                {/* Server Columns */}
                {serverFields.includeServers && (
                  <>
                    {serverFields.serverCount && <th className="py-3 px-3 bg-purple-50/60 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200">تعداد سرور</th>}
                    {serverFields.hostnames && <th className="py-3 px-3 bg-purple-50/60 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200">نام‌های سرور</th>}
                    {serverFields.ipAddresses && <th className="py-3 px-3 bg-purple-50/60 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200">آدرس‌های IP</th>}
                    {serverFields.hardwareSpecs && <th className="py-3 px-3 bg-purple-50/60 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200">مجموع منابع سخت‌افزار</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSoftware.map(app => {
                const srvs = app.servers || [];
                return (
                  <tr key={app.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    {generalFields.code && (
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {app.code}
                      </td>
                    )}
                    {generalFields.nameFa && (
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {app.nameFa}
                      </td>
                    )}
                    {generalFields.version && (
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                        v{app.version}
                      </td>
                    )}
                    {generalFields.status && (
                      <td className="py-3 px-3 font-medium">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {app.status}
                        </span>
                      </td>
                    )}
                    {generalFields.criticality && (
                      <td className="py-3 px-3 font-bold">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                          app.criticality === 'TIER_1_CRITICAL' 
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' 
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          {app.criticality === 'TIER_1_CRITICAL' ? 'Tier-1' : 'Tier-2'}
                        </span>
                      </td>
                    )}
                    {generalFields.ownerDepartment && (
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {app.ownerDepartment}
                      </td>
                    )}
                    {generalFields.deployEnvironment && (
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {app.deployEnvironment}
                      </td>
                    )}

                    {/* Dynamic Category Columns Values */}
                    {activeSelectedCategories.map(cat => {
                      const catRecords = app.categoryValues?.[cat.id] || [];
                      const activeCatAttrs = cat.attributes.filter(a => selectedAttributes[cat.id]?.[a.id]);

                      return activeCatAttrs.map(attr => {
                        const rec = catRecords.find(r => r.attributeId === attr.id);
                        const vals = rec?.values || [];

                        return (
                          <td key={`${cat.id}-${attr.id}`} className="py-3 px-3 border-r border-slate-100 dark:border-slate-800">
                            {vals.length === 0 ? (
                              <span className="text-slate-300 dark:text-slate-600">-</span>
                            ) : attr.isMultiValue ? (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {vals.map((v, vIdx) => (
                                  <span key={vIdx} className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-800 dark:text-slate-200">
                                {vals[0]}
                              </span>
                            )}
                          </td>
                        );
                      });
                    })}

                    {/* Server Columns Values */}
                    {serverFields.includeServers && (
                      <>
                        {serverFields.serverCount && (
                          <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400 text-center">
                            {srvs.length} سرور
                          </td>
                        )}
                        {serverFields.hostnames && (
                          <td className="py-3 px-3 font-mono text-[11px]">
                            {srvs.length === 0 ? '-' : (
                              <div className="space-y-0.5">
                                {srvs.map((s, idx) => (
                                  <div key={idx} className="truncate max-w-[150px]">{s.hostname}</div>
                                ))}
                              </div>
                            )}
                          </td>
                        )}
                        {serverFields.ipAddresses && (
                          <td className="py-3 px-3 font-mono text-[11px]">
                            {srvs.length === 0 ? '-' : (
                              <div className="space-y-0.5">
                                {srvs.map((s, idx) => (
                                  <div key={idx}>{s.ipInternal}</div>
                                ))}
                              </div>
                            )}
                          </td>
                        )}
                        {serverFields.hardwareSpecs && (
                          <td className="py-3 px-3 text-[11px]">
                            {srvs.length === 0 ? '-' : (
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {srvs.reduce((acc, s) => acc + (s.vcpu || 0), 0)} Core / {srvs.reduce((acc, s) => acc + (s.ramGb || 0), 0)} GB
                              </span>
                            )}
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}

              {filteredSoftware.length === 0 && (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    هیچ داده‌ای منطبق بر فیلترهای گزارش یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Preview Modal */}
      {isPrintModalOpen && (
        <PrintPreviewModal
          isOpen={isPrintModalOpen}
          options={{
            title: 'گزارش تحلیلی و ممیزی جامع شناسنامه و زیرساخت نرم‌افزارهای سازمان',
            subtitle: `شامل ${filteredSoftware.length} سامانه نرم‌افزاری | فیلتر اهمیت: ${filterCriticality} | فیلتر وضعیت: ${filterStatus}`,
            reportDateShamsi: getCurrentShamsiDate(),
            department: 'معاونت فناوری اطلاعات و دولت هوشمند',
            contentHtml: generatePrintHtml(),
          }}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
