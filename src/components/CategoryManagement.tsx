import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Tag, 
  CheckCircle2, 
  Lock, 
  AlertCircle,
  Hash,
  Type
} from 'lucide-react';
import { Category, AttributeDefinition, AttributeDataType, SoftwareApplication, Role, DependencyCheckResult } from '../types';
import { checkCategoryDependencies, checkAttributeDependencies } from '../utils/dependencyChecker';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface CategoryManagementProps {
  categories: Category[];
  softwareList: SoftwareApplication[];
  currentRole: Role;
  onAddCategory: (newCategory: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddAttribute: (categoryId: string, newAttribute: AttributeDefinition) => void;
  onDeleteAttribute: (categoryId: string, attributeId: string) => void;
  onLogBlockedDelete: (entityName: string, reason: string) => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  softwareList,
  currentRole,
  onAddCategory,
  onDeleteCategory,
  onAddAttribute,
  onDeleteAttribute,
  onLogBlockedDelete,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0] || null);

  // New Category Form Modal
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatNameFa, setNewCatNameFa] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // New Attribute Form Modal
  const [showAddAttrModal, setShowAddAttrModal] = useState(false);
  const [newAttrLabelFa, setNewAttrLabelFa] = useState('');
  const [newAttrCode, setNewAttrCode] = useState('');
  const [newAttrDataType, setNewAttrDataType] = useState<AttributeDataType>('text');
  const [newAttrIsMultiValue, setNewAttrIsMultiValue] = useState(false);
  const [newAttrIsRequired, setNewAttrIsRequired] = useState(false);
  const [newAttrOptions, setNewAttrOptions] = useState('');
  const [newAttrPlaceholder, setNewAttrPlaceholder] = useState('');

  // Delete confirmation & dependency modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    itemType: string;
    checkResult: DependencyCheckResult | null;
    actionType: 'CATEGORY' | 'ATTRIBUTE';
    catId: string;
    attrId?: string;
  }>({
    isOpen: false,
    title: '',
    itemName: '',
    itemType: '',
    checkResult: null,
    actionType: 'CATEGORY',
    catId: '',
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameFa.trim() || !newCatCode.trim()) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      code: newCatCode.trim().toUpperCase(),
      nameFa: newCatNameFa.trim(),
      description: newCatDesc.trim(),
      icon: 'Layers',
      displayOrder: categories.length + 1,
      isActive: true,
      attributes: [],
    };

    onAddCategory(newCat);
    setSelectedCategory(newCat);
    setShowAddCatModal(false);
    setNewCatNameFa('');
    setNewCatCode('');
    setNewCatDesc('');
  };

  const handleCreateAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !newAttrLabelFa.trim() || !newAttrCode.trim()) return;

    const optionsArray = newAttrOptions
      ? newAttrOptions.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const newAttr: AttributeDefinition = {
      id: `attr-${Date.now()}`,
      categoryId: selectedCategory.id,
      code: newAttrCode.trim().toUpperCase(),
      labelFa: newAttrLabelFa.trim(),
      dataType: newAttrDataType,
      isMultiValue: newAttrIsMultiValue,
      isRequired: newAttrIsRequired,
      options: optionsArray,
      placeholder: newAttrPlaceholder.trim() || undefined,
    };

    onAddAttribute(selectedCategory.id, newAttr);
    setShowAddAttrModal(false);
    setNewAttrLabelFa('');
    setNewAttrCode('');
    setNewAttrOptions('');
    setNewAttrPlaceholder('');
    setNewAttrIsMultiValue(false);
    setNewAttrIsRequired(false);
  };

  const handleDeleteCategoryClick = (cat: Category) => {
    const result = checkCategoryDependencies(cat.id, categories, softwareList);
    setDeleteModalState({
      isOpen: true,
      title: `درخواست حذف طبقه «${cat.nameFa}»`,
      itemName: cat.nameFa,
      itemType: 'طبقه نرم‌افزاری',
      checkResult: result,
      actionType: 'CATEGORY',
      catId: cat.id,
    });

    if (!result.canDelete) {
      onLogBlockedDelete(`طبقه ${cat.nameFa}`, result.blockedReasons.join(' | '));
    }
  };

  const handleDeleteAttributeClick = (attr: AttributeDefinition) => {
    if (!selectedCategory) return;
    const result = checkAttributeDependencies(selectedCategory.id, attr.id, selectedCategory, softwareList);
    setDeleteModalState({
      isOpen: true,
      title: `درخواست حذف خصوصیت «${attr.labelFa}»`,
      itemName: attr.labelFa,
      itemType: 'خصوصیت متادیتا',
      checkResult: result,
      actionType: 'ATTRIBUTE',
      catId: selectedCategory.id,
      attrId: attr.id,
    });

    if (!result.canDelete) {
      onLogBlockedDelete(`خصوصیت ${attr.labelFa} در طبقه ${selectedCategory.nameFa}`, result.blockedReasons.join(' | '));
    }
  };

  const handleConfirmDelete = () => {
    if (deleteModalState.actionType === 'CATEGORY') {
      onDeleteCategory(deleteModalState.catId);
      if (selectedCategory?.id === deleteModalState.catId) {
        setSelectedCategory(categories.find(c => c.id !== deleteModalState.catId) || categories[0]);
      }
    } else if (deleteModalState.actionType === 'ATTRIBUTE' && deleteModalState.attrId) {
      onDeleteAttribute(deleteModalState.catId, deleteModalState.attrId);
    }
    setDeleteModalState(prev => ({ ...prev, isOpen: false }));
  };

  const dataTypeLabels: { [key in AttributeDataType]: string } = {
    text: 'متن ساده',
    number: 'عددی',
    solar_date: 'تقویم هجری شمسی',
    select: 'تک انتخابی (Dropdown)',
    multiselect: 'چند انتخابی (Multi-Select)',
    boolean: 'بله / خیر (Boolean)',
    url: 'لینک / وب‌سایت',
    textarea: 'متن چند خطی',
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            <span>مدیریت ساختار طبقات و خصوصیات داینامیک (EAV Catalog Engine)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            امکان تعریف طبقات جدید، افزودن نامحدود خصوصیات با قابلیت چندمقداری بودن و اعمال سیاست منع حذف وابستگی
          </p>
        </div>

        <button
          onClick={() => setShowAddCatModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ تعریف طبقه جدید</span>
        </button>
      </div>

      {/* 2-Column Layout: Left Category Tabs, Right Attributes Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category List Column */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            طبقات تعریف‌شده در سازمان ({categories.length})
          </div>

          <div className="space-y-2">
            {categories.map(cat => {
              const isSelected = selectedCategory?.id === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="space-y-1 truncate pr-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs truncate">{cat.nameFa}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      کد: {cat.code} | {cat.attributes.length} خصوصیت
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteCategoryClick(cat);
                      }}
                      title="حذف طبقه (با کنترل وابستگی)"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attribute Management Column */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          {selectedCategory ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>خصوصیات طبقه: {selectedCategory.nameFa}</span>
                    <span className="text-xs font-mono text-slate-400 font-normal">[{selectedCategory.code}]</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedCategory.description || 'بدون شرح تکمیلی'}
                  </p>
                </div>

                <button
                  onClick={() => setShowAddAttrModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ افزودن خصوصیت به این طبقه</span>
                </button>
              </div>

              {/* Attributes Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">عنوان خصوصیت</th>
                      <th className="py-2.5 px-3">کد شناسه</th>
                      <th className="py-2.5 px-3">نوع داده (Data Type)</th>
                      <th className="py-2.5 px-3">چند مقداری؟</th>
                      <th className="py-2.5 px-3">اجباری؟</th>
                      <th className="py-2.5 px-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedCategory.attributes.map(attr => (
                      <tr key={attr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                          {attr.labelFa}
                        </td>
                        <td className="py-3 px-3 font-mono text-indigo-600 dark:text-indigo-400">
                          {attr.code}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {dataTypeLabels[attr.dataType]}
                        </td>
                        <td className="py-3 px-3">
                          {attr.isMultiValue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              چند مقداری (Multi)
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">تک مقداری</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {attr.isRequired ? (
                            <span className="text-rose-500 font-bold">الزامی *</span>
                          ) : (
                            <span className="text-slate-400">اختیاری</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteAttributeClick(attr)}
                            title="حذف خصوصیت با کنترل وابستگی"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {selectedCategory.attributes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          هنوز هیچ خصوصیتی برای این طبقه تعریف نشده است.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              لطفاً یکی از طبقات را از ستون سمت راست انتخاب نمایید.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Category */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              تعریف طبقه جدید برای نرم‌افزارها
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام فارسی طبقه *
                </label>
                <input
                  type="text"
                  required
                  value={newCatNameFa}
                  onChange={e => setNewCatNameFa(e.target.value)}
                  placeholder="مثلاً: مدیریت مجوزها و لایسنس‌ها"
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد شناسه انگلیسی (Unique Code) *
                </label>
                <input
                  type="text"
                  required
                  value={newCatCode}
                  onChange={e => setNewCatCode(e.target.value)}
                  dir="ltr"
                  placeholder="LICENSES_MANAGEMENT"
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شرح و هدف این طبقه
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="توضیح دهید چه نوع اطلاعاتی در این طبقه ثبت می‌شود..."
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  ثبت طبقه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Attribute */}
      {showAddAttrModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              افزودن خصوصیت به طبقه «{selectedCategory.nameFa}»
            </h3>

            <form onSubmit={handleCreateAttribute} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان خصوصیت *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAttrLabelFa}
                    onChange={e => setNewAttrLabelFa(e.target.value)}
                    placeholder="مثلاً: نوع لایسنس نرم‌افزار"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    کد سیستمی انگلیسی *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAttrCode}
                    onChange={e => setNewAttrCode(e.target.value)}
                    dir="ltr"
                    placeholder="LICENSE_TYPE"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نوع داده (Data Type)
                </label>
                <select
                  value={newAttrDataType}
                  onChange={e => setNewAttrDataType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                >
                  <option value="text">متن ساده (Text)</option>
                  <option value="number">عدد (Number)</option>
                  <option value="solar_date">تاریخ تقویم هجری شمسی (Solar Date)</option>
                  <option value="select">لیست کشویی تک انتخابی (Select)</option>
                  <option value="multiselect">لیست چند انتخابی (Multi-Select)</option>
                  <option value="boolean">بله / خیر (Boolean)</option>
                  <option value="url">لینک وب (URL)</option>
                  <option value="textarea">متن چند خطی (Textarea)</option>
                </select>
              </div>

              {(newAttrDataType === 'select' || newAttrDataType === 'multiselect') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    گزینه‌های قابل انتخاب (با کاما جدا کنید) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAttrOptions}
                    onChange={e => setNewAttrOptions(e.target.value)}
                    placeholder="مثلاً: دائم، سالانه، ابری، رایگان"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              )}

              {/* Requirement 6: Dynamic Multi-Value capability */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                    قابلیت چندمقداری بودن (Multi-Value Attribute)
                  </span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300">
                    کاربر بتواند چندین مقدار مجزا را به عنوان برچسب برای این خصوصیت ثبت کند
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newAttrIsMultiValue}
                  onChange={e => setNewAttrIsMultiValue(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="req_check"
                  checked={newAttrIsRequired}
                  onChange={e => setNewAttrIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="req_check" className="text-xs text-slate-700 dark:text-slate-300">
                  این خصوصیت اجباری است (در فرم شناسنامه باید پر شود)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAttrModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  ثبت خصوصیت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dependency Confirmation Modal */}
      {deleteModalState.isOpen && deleteModalState.checkResult && (
        <ConfirmDeleteModal
          isOpen={deleteModalState.isOpen}
          title={deleteModalState.title}
          itemName={deleteModalState.itemName}
          itemType={deleteModalState.itemType}
          checkResult={deleteModalState.checkResult}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};
