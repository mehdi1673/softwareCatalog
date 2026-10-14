import React, { useState } from 'react';
import { Search, Filter, Layers, Eye, RefreshCw } from 'lucide-react';
import { SoftwareApplication, Category, Role } from '../types';

interface AdvancedSearchProps {
  softwareList: SoftwareApplication[];
  categories: Category[];
  currentRole: Role;
  onViewSoftware: (app: SoftwareApplication) => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  softwareList,
  categories,
  currentRole,
  onViewSoftware,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>('ALL');
  const [selectedAttrId, setSelectedAttrId] = useState<string>('ALL');
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCriticality, setSelectedCriticality] = useState<string>('ALL');

  // Filter categories user has permission to view
  const allowedCategories = categories.filter(c => currentRole.categoryPermissions[c.id]?.canView);

  const currentCategory = allowedCategories.find(c => c.id === selectedCatId);
  const availableAttributes = currentCategory ? currentCategory.attributes : [];

  const handleReset = () => {
    setSelectedCatId('ALL');
    setSelectedAttrId('ALL');
    setSearchValue('');
    setSelectedStatus('ALL');
    setSelectedCriticality('ALL');
  };

  // Perform multi-criteria filter
  const results = softwareList.filter(app => {
    // 1. Status filter
    if (selectedStatus !== 'ALL' && app.status !== selectedStatus) return false;

    // 2. Criticality filter
    if (selectedCriticality !== 'ALL' && app.criticality !== selectedCriticality) return false;

    // 3. Dynamic Category & Attribute query
    if (searchValue.trim() !== '') {
      const term = searchValue.trim().toLowerCase();

      if (selectedCatId === 'ALL') {
        // Search anywhere across allowed categories
        let matched = 
          app.nameFa.toLowerCase().includes(term) ||
          app.code.toLowerCase().includes(term) ||
          app.ownerDepartment.toLowerCase().includes(term);

        if (!matched) {
          // Check in all category values
          for (const cat of allowedCategories) {
            const records = app.categoryValues?.[cat.id] || [];
            for (const r of records) {
              if (r.values.some(v => v.toLowerCase().includes(term))) {
                matched = true;
                break;
              }
            }
            if (matched) break;
          }
        }
        return matched;
      } else {
        // Filter within specific category
        const records = app.categoryValues?.[selectedCatId] || [];

        if (selectedAttrId === 'ALL') {
          // Any attribute in this category
          return records.some(r => r.values.some(v => v.toLowerCase().includes(term)));
        } else {
          // Specific attribute in this category
          const targetRec = records.find(r => r.attributeId === selectedAttrId);
          if (!targetRec) return false;
          return targetRec.values.some(v => v.toLowerCase().includes(term));
        }
      }
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-600" />
          <span>موتور جستجوی پیشرفته بر روی طبقات و خصوصیات داینامیک</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          جستجوی ترکیبی بر روی مقادیر چندگانه (تکنولوژی‌ها، دیتابیس‌ها، پروتکل‌ها، آدرس‌های IP و تاریخ‌های شمسی)
        </p>
      </div>

      {/* Query Builder Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              طبقه نرم‌افزاری
            </label>
            <select
              value={selectedCatId}
              onChange={e => {
                setSelectedCatId(e.target.value);
                setSelectedAttrId('ALL');
              }}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              <option value="ALL">تمام طبقات مجاز</option>
              {allowedCategories.map(c => (
                <option key={c.id} value={c.id}>{c.nameFa}</option>
              ))}
            </select>
          </div>

          {/* Attribute Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              خصوصیت خاص در طبقه
            </label>
            <select
              value={selectedAttrId}
              onChange={e => setSelectedAttrId(e.target.value)}
              disabled={selectedCatId === 'ALL'}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              <option value="ALL">همه خصوصیات این طبقه</option>
              {availableAttributes.map(a => (
                <option key={a.id} value={a.id}>{a.labelFa}</option>
              ))}
            </select>
          </div>

          {/* Search Term */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عبارت جستجو / مقدار خصوصیت
            </label>
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="مثلاً: SQL Server یا Redis یا افتا..."
              className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* Criticality */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              سطح اهمیت
            </label>
            <select
              value={selectedCriticality}
              onChange={e => setSelectedCriticality(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              <option value="ALL">همه سطوح</option>
              <option value="TIER_1_CRITICAL">حیاتی درجه ۱</option>
              <option value="TIER_2_IMPORTANT">مهم سازمانی</option>
              <option value="TIER_3_NORMAL">عادی</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              وضعیت عملیاتی
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              <option value="ALL">همه وضعیت‌ها</option>
              <option value="ACTIVE">فعال در مدار</option>
              <option value="DEVELOPMENT">در حال توسعه</option>
              <option value="MAINTENANCE">پشتیبانی</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-slate-500">
            تعداد نتایج منطبق: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{results.length}</strong> نرم‌افزار
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>پاک‌کردن فیلترها</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">کد</th>
                <th className="py-3 px-4">نام سامانه</th>
                <th className="py-3 px-4">نسخه</th>
                <th className="py-3 px-4">اهمیت</th>
                <th className="py-3 px-4">متولی</th>
                <th className="py-3 px-4">مقادیر خصوصیات منطبق</th>
                <th className="py-3 px-4 text-center">مشاهده شناسنامه</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.map(app => {
                // Collect matched dynamic values
                const matchedTags: string[] = [];
                for (const cat of allowedCategories) {
                  const records = app.categoryValues?.[cat.id] || [];
                  for (const r of records) {
                    if (searchValue.trim() !== '') {
                      const hits = r.values.filter(v => v.toLowerCase().includes(searchValue.trim().toLowerCase()));
                      matchedTags.push(...hits);
                    }
                  }
                }

                return (
                  <tr key={app.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {app.code}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {app.nameFa}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      v{app.version}
                    </td>
                    <td className="py-3 px-4">
                      {app.criticality === 'TIER_1_CRITICAL' ? 'حیاتی ۱' : 'مهم ۲'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {app.ownerDepartment}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {matchedTags.slice(0, 4).map((tag, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 rounded text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {tag}
                          </span>
                        ))}
                        {matchedTags.length === 0 && (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onViewSoftware(app)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>شناسنامه</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {results.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    موردی یافت نشد. معیارهای جستجو را تغییر دهید.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
