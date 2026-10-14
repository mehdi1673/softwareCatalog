import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Layers, AlertCircle, Save, Server } from 'lucide-react';
import { 
  SoftwareApplication, 
  Category, 
  Role, 
  SoftwareDependencyRelation,
  AttributeDataType,
  SoftwareServer,
  DynamicServerAttribute
} from '../types';
import { SolarDatePicker } from './SolarDatePicker';
import { ServerTopologyWidget } from './ServerTopologyWidget';
import { getCurrentShamsiDate } from '../utils/shamsi';

interface SoftwareModalProps {
  isOpen: boolean;
  software: SoftwareApplication | null;
  categories: Category[];
  allSoftware: SoftwareApplication[];
  serverAttributes: DynamicServerAttribute[];
  currentRole: Role;
  onClose: () => void;
  onSave: (savedApp: SoftwareApplication, changeDescription: string) => void;
  onAddCustomServerAttribute: (newAttr: DynamicServerAttribute) => void;
}

export const SoftwareModal: React.FC<SoftwareModalProps> = ({
  isOpen,
  software,
  categories,
  allSoftware,
  serverAttributes,
  currentRole,
  onClose,
  onSave,
  onAddCustomServerAttribute,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(software);

  // General fields
  const [code, setCode] = useState(software?.code || `APP-${Math.floor(100 + Math.random() * 900)}`);
  const [nameFa, setNameFa] = useState(software?.nameFa || '');
  const [nameEn, setNameEn] = useState(software?.nameEn || '');
  const [description, setDescription] = useState(software?.description || '');
  const [version, setVersion] = useState(software?.version || '1.0.0');
  const [status, setStatus] = useState<SoftwareApplication['status']>(software?.status || 'ACTIVE');
  const [criticality, setCriticality] = useState<SoftwareApplication['criticality']>(software?.criticality || 'TIER_2_IMPORTANT');
  const [ownerDepartment, setOwnerDepartment] = useState(software?.ownerDepartment || '');
  const [technicalLead, setTechnicalLead] = useState(software?.technicalLead || '');
  const [vendorName, setVendorName] = useState(software?.vendorName || '');
  const [deployEnvironment, setDeployEnvironment] = useState<SoftwareApplication['deployEnvironment']>(software?.deployEnvironment || 'PRIVATE_CLOUD');
  
  // Dynamic category values state: { [categoryId]: { [attrId]: string[] } }
  const [categoryValuesMap, setCategoryValuesMap] = useState<{ [catId: string]: { [attrId: string]: string[] } }>({});

  // Servers & Infrastructure Topology (Requirement 4)
  const [servers, setServers] = useState<SoftwareServer[]>(software?.servers || []);

  // Dependencies
  const [dependencies, setDependencies] = useState<SoftwareDependencyRelation[]>(software?.dependencies || []);

  // Change description for version history
  const [changeDescription, setChangeDescription] = useState('');

  // Active tab in modal
  const [activeTab, setActiveTab] = useState<'general' | 'servers' | 'dependencies' | string>('general');

  // Multi-value tag input temporary state: { [attrId]: string }
  const [tagInputs, setTagInputs] = useState<{ [attrId: string]: string }>({});

  // Initialize dynamic values
  useEffect(() => {
    const initialMap: { [catId: string]: { [attrId: string]: string[] } } = {};
    categories.forEach(cat => {
      initialMap[cat.id] = {};
      const existingCatValues = software?.categoryValues?.[cat.id] || [];
      cat.attributes.forEach(attr => {
        const found = existingCatValues.find(v => v.attributeId === attr.id);
        if (found) {
          initialMap[cat.id][attr.id] = [...found.values];
        } else if (attr.defaultValue) {
          initialMap[cat.id][attr.id] = Array.isArray(attr.defaultValue) ? [...attr.defaultValue] : [attr.defaultValue];
        } else {
          initialMap[cat.id][attr.id] = [];
        }
      });
    });
    setCategoryValuesMap(initialMap);
  }, [software, categories]);

  // Filter categories user is allowed to view (Requirement 21)
  const allowedCategories = categories.filter(cat => {
    const perm = currentRole.categoryPermissions[cat.id];
    return perm ? perm.canView : false;
  });

  // Server Topology & Infrastructure RBAC
  const canViewServers = currentRole.serverPermissions ? currentRole.serverPermissions.canView : true;
  const canCreateServers = currentRole.serverPermissions ? currentRole.serverPermissions.canCreate : true;
  const canEditServers = currentRole.serverPermissions ? currentRole.serverPermissions.canEdit : true;
  const canDeleteServers = currentRole.serverPermissions ? currentRole.serverPermissions.canDelete : true;
  const canManageServerAttributes = currentRole.systemPermissions?.manageServerAttributes ?? true;

  const handleAddTag = (catId: string, attrId: string) => {
    const val = (tagInputs[attrId] || '').trim();
    if (!val) return;
    const current = categoryValuesMap[catId]?.[attrId] || [];
    if (!current.includes(val)) {
      setCategoryValuesMap(prev => ({
        ...prev,
        [catId]: {
          ...prev[catId],
          [attrId]: [...current, val],
        },
      }));
    }
    setTagInputs(prev => ({ ...prev, [attrId]: '' }));
  };

  const handleRemoveTag = (catId: string, attrId: string, valToRemove: string) => {
    const current = categoryValuesMap[catId]?.[attrId] || [];
    setCategoryValuesMap(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [attrId]: current.filter(v => v !== valToRemove),
      },
    }));
  };

  const handleSingleValueChange = (catId: string, attrId: string, val: string) => {
    setCategoryValuesMap(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [attrId]: [val],
      },
    }));
  };

  const handleAddDependency = (targetId: string) => {
    if (!targetId) return;
    const targetApp = allSoftware.find(a => a.id === targetId);
    if (!targetApp) return;
    if (dependencies.some(d => d.targetSoftwareId === targetId)) return;

    setDependencies([
      ...dependencies,
      {
        targetSoftwareId: targetId,
        targetSoftwareName: targetApp.nameFa,
        relationType: 'CONSUMES_API',
        description: 'اتصال وب‌سرویس و تبادل داده',
      },
    ]);
  };

  const handleRemoveDependency = (targetId: string) => {
    setDependencies(dependencies.filter(d => d.targetSoftwareId !== targetId));
  };

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    if (!code.trim() || !nameFa.trim() || !ownerDepartment.trim()) {
      setFormError('لطفاً شناسه سامانه، نام فارسی و معاونت/واحد متولی را تکمیل نمایید.');
      return;
    }

    // Convert map to format expected by SoftwareApplication
    const formattedCategoryValues: SoftwareApplication['categoryValues'] = {};
    categories.forEach(cat => {
      const catMap = categoryValuesMap[cat.id] || {};
      formattedCategoryValues[cat.id] = cat.attributes.map(attr => ({
        attributeId: attr.id,
        attributeCode: attr.code,
        values: catMap[attr.id] || [],
      }));
    });

    const nowShamsi = getCurrentShamsiDate();
    const updatedApp: SoftwareApplication = {
      id: software?.id || `app-${Date.now()}`,
      code,
      nameFa,
      nameEn,
      description,
      version,
      status,
      criticality,
      ownerDepartment,
      technicalLead,
      vendorName,
      deployEnvironment,
      createdDateShamsi: software?.createdDateShamsi || nowShamsi,
      updatedDateShamsi: nowShamsi,
      createdBy: software?.createdBy || currentRole.nameFa,
      currentVersionNumber: (software?.currentVersionNumber || 0) + 1,
      categoryValues: formattedCategoryValues,
      dependencies,
      servers,
    };

    const desc = changeDescription.trim() || (isEditing ? 'به‌روزرسانی متادیتا و خصوصیات نرم‌افزار' : 'ثبت اولیه شناسنامه نرم‌افزار در سامانه');
    onSave(updatedApp, desc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isEditing ? `ویرایش شناسنامه: ${software?.nameFa}` : 'ثبت شناسنامه جدید نرم‌افزار'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing ? `نسخه فعلی: ${software?.version} (افزایش به نسخه ${(software?.currentVersionNumber || 0) + 1})` : 'ثبت اطلاعات عمومی، خصوصیات داینامیک و وابستگی‌ها'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            مشخصات عمومی و سازمانی
          </button>

          {allowedCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-3 py-2.5 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === cat.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>{cat.nameFa}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500">
                {cat.attributes.length}
              </span>
            </button>
          ))}

          {canViewServers && (
            <button
              type="button"
              onClick={() => setActiveTab('servers')}
              className={`px-3 py-2.5 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'servers'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>سرورها و زیرساخت استقرار</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                {servers.length}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('dependencies')}
            className={`px-3 py-2.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'dependencies'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            سامانه‌های مرتبط و وابستگی‌ها ({dependencies.length})
          </button>
        </div>

        {/* Form Body Container (using div to prevent HTML nested form issues) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-400 hover:text-rose-600 font-bold px-1"
              >
                ×
              </button>
            </div>
          )}

          {/* Tab 1: General Info */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شناسه سامانه (کد ردیابی) *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                    placeholder="APP-101"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام فارسی نرم‌افزار *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameFa}
                    onChange={e => setNameFa(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    placeholder="مثلاً: سامانه مکاتبات و اتوماسیون اداری"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام لاتین (English Name)
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={e => setNameEn(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-sans"
                    placeholder="Enterprise Office Automation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نسخه نرم‌افزار (Version) *
                  </label>
                  <input
                    type="text"
                    required
                    value={version}
                    onChange={e => setVersion(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                    placeholder="1.0.0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    وضعیت عملیاتی
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="ACTIVE">فعال در مدار عملیات (Active)</option>
                    <option value="DEVELOPMENT">در حال توسعه (In Development)</option>
                    <option value="MAINTENANCE">پشتیبانی و نگهداری (Maintenance)</option>
                    <option value="DEPRECATED">منسوخ‌شده (Deprecated)</option>
                    <option value="RETIRED">خارج از مدار (Retired)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سطح اهمیت (Criticality Tier)
                  </label>
                  <select
                    value={criticality}
                    onChange={e => setCriticality(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="TIER_1_CRITICAL">حیاتی درجه ۱ (Tier-1 Mission Critical)</option>
                    <option value="TIER_2_IMPORTANT">مهم و کلیدی (Tier-2 Important)</option>
                    <option value="TIER_3_NORMAL">عادی سازمانی (Tier-3 Normal)</option>
                    <option value="TIER_4_LOW">پشتیبان و جانبی (Tier-4 Low)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    بستر استقرار
                  </label>
                  <select
                    value={deployEnvironment}
                    onChange={e => setDeployEnvironment(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  >
                    <option value="PRIVATE_CLOUD">ابر اختصاصی سازمان (Private Cloud)</option>
                    <option value="ON_PREMISE">مرکز داده محلی (On-Premise)</option>
                    <option value="CONTAINERIZED">کانتینری (Kubernetes / Docker)</option>
                    <option value="HYBRID">هیبریدی (ترکیبی)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    معاونت / اداره کل متولی *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerDepartment}
                    onChange={e => setOwnerDepartment(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    placeholder="مثلاً: اداره کل مالی و اداری"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سرپرست فنی / معمار سامانه
                  </label>
                  <input
                    type="text"
                    value={technicalLead}
                    onChange={e => setTechnicalLead(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    placeholder="مثلاً: مهندس رضایی"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    پیمانکار / شرکت توسعه‌دهنده
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={e => setVendorName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    placeholder="مثلاً: همکاران سیستم / تیم بومی"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شرح کارکرد و هدف سامانه
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  placeholder="اهداف اصلی، فرآیندهای تحت پوشش و مخاطبان کلیدی سامانه را شرح دهید..."
                />
              </div>
            </div>
          )}

          {/* Dynamic Category Tabs */}
          {allowedCategories.some(c => c.id === activeTab) && (() => {
            const currentCat = allowedCategories.find(c => c.id === activeTab)!;
            const perm = currentRole.categoryPermissions[currentCat.id];
            const isReadOnly = isEditing ? !perm.canEdit : !perm.canCreate;

            return (
              <div className="space-y-5">
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-xl flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-300">
                  <span>{currentCat.description || `خصوصیات داینامیک طبقه ${currentCat.nameFa}`}</span>
                  {isReadOnly && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      (دسترسی فقط مشاهده برای این طبقه)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {currentCat.attributes.map(attr => {
                    const currentValues = categoryValuesMap[currentCat.id]?.[attr.id] || [];

                    return (
                      <div key={attr.id} className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <span>{attr.labelFa}</span>
                            {attr.isRequired && <span className="text-rose-500">*</span>}
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {attr.code} {attr.isMultiValue && '(چند مقداری)'}
                          </span>
                        </div>

                        {/* Rendering by DataType */}
                        {attr.dataType === 'solar_date' ? (
                          <SolarDatePicker
                            value={currentValues[0] || ''}
                            onChange={val => handleSingleValueChange(currentCat.id, attr.id, val)}
                            disabled={isReadOnly}
                            placeholder="انتخاب تاریخ شمسی"
                          />
                        ) : attr.dataType === 'boolean' ? (
                          <div className="flex items-center gap-3 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="radio"
                                name={`bool_${attr.id}`}
                                disabled={isReadOnly}
                                checked={currentValues[0] === 'true'}
                                onChange={() => handleSingleValueChange(currentCat.id, attr.id, 'true')}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>بله / فعال</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs">
                              <input
                                type="radio"
                                name={`bool_${attr.id}`}
                                disabled={isReadOnly}
                                checked={currentValues[0] === 'false'}
                                onChange={() => handleSingleValueChange(currentCat.id, attr.id, 'false')}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>خیر / غیرفعال</span>
                            </label>
                          </div>
                        ) : attr.dataType === 'select' ? (
                          <select
                            disabled={isReadOnly}
                            value={currentValues[0] || ''}
                            onChange={e => handleSingleValueChange(currentCat.id, attr.id, e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                          >
                            <option value="">-- انتخاب کنید --</option>
                            {attr.options?.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : attr.dataType === 'multiselect' ? (
                          <div className="space-y-2">
                            {/* Multiselect options checkbox list or tags */}
                            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                              {attr.options?.map((opt, optIdx) => {
                                const isChecked = currentValues.includes(opt);
                                return (
                                  <label key={optIdx} className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded">
                                    <input
                                      type="checkbox"
                                      disabled={isReadOnly}
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          handleRemoveTag(currentCat.id, attr.id, opt);
                                        } else {
                                          setCategoryValuesMap(prev => ({
                                            ...prev,
                                            [currentCat.id]: {
                                              ...prev[currentCat.id],
                                              [attr.id]: [...currentValues, opt],
                                            },
                                          }));
                                        }
                                      }}
                                      className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="truncate">{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ) : attr.isMultiValue ? (
                          /* Multi-Value dynamic tag input */
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                disabled={isReadOnly}
                                value={tagInputs[attr.id] || ''}
                                onChange={e => setTagInputs({ ...tagInputs, [attr.id]: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTag(currentCat.id, attr.id);
                                  }
                                }}
                                placeholder={attr.placeholder || 'مقدار جدید را بنویسید و + بزنید...'}
                                className="flex-1 px-3 py-1.5 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                              />
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleAddTag(currentCat.id, attr.id)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                              >
                                + افزودن
                              </button>
                            </div>

                            {/* Tags list */}
                            <div className="flex flex-wrap gap-1.5">
                              {currentValues.map((tagVal, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 shadow-xs"
                                >
                                  <span>{tagVal}</span>
                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTag(currentCat.id, attr.id, tagVal)}
                                      className="text-slate-400 hover:text-rose-500 mr-1"
                                    >
                                      ×
                                    </button>
                                  )}
                                </span>
                              ))}
                              {currentValues.length === 0 && (
                                <span className="text-[11px] text-slate-400 italic">هیچ مقداری درج نشده است.</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Standard single text or number */
                          <input
                            type={attr.dataType === 'number' ? 'number' : 'text'}
                            disabled={isReadOnly}
                            value={currentValues[0] || ''}
                            onChange={e => handleSingleValueChange(currentCat.id, attr.id, e.target.value)}
                            placeholder={attr.placeholder || ''}
                            className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                          />
                        )}

                        {attr.description && (
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {attr.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Tab: Dependencies */}
          {activeTab === 'dependencies' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                تعریف ارتباطات سامانه‌ای و پروتکل‌های وب‌سرویس جهت کنترل وابستگی قبل از حذف در سطح کل سازمان
              </div>

              <div className="flex gap-2">
                <select
                  id="dep-select"
                  className="flex-1 px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  defaultValue=""
                >
                  <option value="" disabled>-- انتخاب سامانه هدف جهت ایجاد وابستگی --</option>
                  {allSoftware
                    .filter(s => s.id !== software?.id)
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.nameFa} ({s.code})</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const sel = document.getElementById('dep-select') as HTMLSelectElement;
                    if (sel && sel.value) {
                      handleAddDependency(sel.value);
                      sel.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  + افزودن وابستگی
                </button>
              </div>

              <div className="space-y-2">
                {dependencies.map((dep, dIdx) => (
                  <div key={dIdx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {dep.targetSoftwareName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        نوع رابطه: {dep.relationType} | شرح: {dep.description}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDependency(dep.targetSoftwareId)}
                      className="text-rose-500 hover:text-rose-700 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {dependencies.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    هیچ وابستگی بین‌سامانه‌ای ثبت نشده است.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Servers & Infrastructure Topology */}
          {activeTab === 'servers' && canViewServers && (
            <div className="space-y-4">
              <ServerTopologyWidget
                servers={servers}
                softwareId={software?.id || code}
                softwareName={nameFa || 'نرم‌افزار در حال ثبت'}
                serverAttributes={serverAttributes}
                onAddServer={newServer => setServers(prev => [...prev, newServer])}
                onUpdateServer={updatedServer => setServers(prev => prev.map(s => s.id === updatedServer.id ? updatedServer : s))}
                onDeleteServer={serverId => setServers(prev => prev.filter(s => s.id !== serverId))}
                onAddCustomServerAttribute={onAddCustomServerAttribute}
                isReadOnly={!canCreateServers && !canEditServers && !canDeleteServers}
                canAddServer={canCreateServers}
                canEditServer={canEditServers}
                canDeleteServer={canDeleteServers}
                canManageAttributes={canManageServerAttributes}
              />
            </div>
          )}

          {/* Change Description for Version History (Audit Requirement 13) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              توضیحات تغییرات برای ثبت در تاریخچه نسخ (Version History Log) *
            </label>
            <input
              type="text"
              value={changeDescription}
              onChange={e => setChangeDescription(e.target.value)}
              placeholder={isEditing ? "علت و شرح تغییرات این نسخه را ذکر کنید (مثلاً ارتقای پایگاه داده به SQL Server 2022)" : "ثبت اولیه شناسنامه نرم‌افزار"}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'ذخیره تغییرات و ایجاد نسخه جدید' : 'ثبت قطعی شناسنامه نرم‌افزار'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
