import { Category, SoftwareApplication, Role, User, DependencyCheckResult } from '../types';

/**
 * Enterprise Reference & Dependency Verification Engine
 * Enforces strict referential integrity before any delete operation can proceed.
 */

export function checkCategoryDependencies(
  categoryId: string,
  categories: Category[],
  softwareList: SoftwareApplication[]
): DependencyCheckResult {
  const category = categories.find(c => c.id === categoryId);
  if (!category) {
    return { canDelete: false, blockedReasons: ['طبقه مورد نظر یافت نشد.'], references: [] };
  }

  const blockedReasons: string[] = [];
  const references: DependencyCheckResult['references'] = [];

  // 1. Check if any software has records under this category
  const softwareUsingCategory = softwareList.filter(s => {
    const catVals = s.categoryValues?.[categoryId];
    return catVals && catVals.some(v => v.values && v.values.length > 0 && v.values.some(val => val.trim() !== ''));
  });

  if (softwareUsingCategory.length > 0) {
    const names = softwareUsingCategory.map(s => `«${s.nameFa} (${s.code})»`).slice(0, 5);
    const count = softwareUsingCategory.length;
    blockedReasons.push(
      `این طبقه دارای ${count} نرم‌افزار وابسته با اطلاعات تکمیل‌شده است و امکان حذف مستقیم آن وجود ندارد.`
    );
    references.push({
      type: 'نرم‌افزارهای وابسته به طبقه',
      count,
      details: count > 5 ? [...names, `و ${count - 5} نرم‌افزار دیگر...`] : names,
    });
  }

  // 2. Check attributes under category
  if (category.attributes && category.attributes.length > 0) {
    blockedReasons.push(
      `این طبقه شامل ${category.attributes.length} خصوصیت تعریف‌شده است. ابتدا باید خصوصیات زیرمجموعه مدیریت شوند.`
    );
    references.push({
      type: 'خصوصیات تعریف‌شده در طبقه',
      count: category.attributes.length,
      details: category.attributes.map(a => `${a.labelFa} [کد: ${a.code}]`),
    });
  }

  return {
    canDelete: blockedReasons.length === 0,
    blockedReasons,
    references,
  };
}

export function checkAttributeDependencies(
  categoryId: string,
  attributeId: string,
  category: Category,
  softwareList: SoftwareApplication[]
): DependencyCheckResult {
  const attr = category.attributes.find(a => a.id === attributeId);
  if (!attr) {
    return { canDelete: false, blockedReasons: ['خصوصیت مورد نظر یافت نشد.'], references: [] };
  }

  const blockedReasons: string[] = [];
  const references: DependencyCheckResult['references'] = [];

  // Check which software has data for this attribute
  const dependentSoftware = softwareList.filter(s => {
    const catVals = s.categoryValues?.[categoryId];
    if (!catVals) return false;
    const rec = catVals.find(v => v.attributeId === attributeId);
    return rec && rec.values && rec.values.length > 0 && rec.values.some(v => v.trim() !== '');
  });

  if (dependentSoftware.length > 0) {
    const names = dependentSoftware.map(s => `«${s.nameFa} (${s.code})»`).slice(0, 5);
    const count = dependentSoftware.length;
    blockedReasons.push(
      `خصوصیت «${attr.labelFa}» در ${count} نرم‌افزار سازمانی دارای مقدار ذخیره‌شده است و حذف آن منجر به از دست رفتن تاریخچه و متادیتای سامانه می‌شود.`
    );
    references.push({
      type: 'نرم‌افزارهای ثبت‌کننده این خصوصیت',
      count,
      details: count > 5 ? [...names, `و ${count - 5} مورد دیگر...`] : names,
    });
  }

  return {
    canDelete: blockedReasons.length === 0,
    blockedReasons,
    references,
  };
}

export function checkRoleDependencies(
  roleId: string,
  roles: Role[],
  users: User[]
): DependencyCheckResult {
  const role = roles.find(r => r.id === roleId);
  if (!role) {
    return { canDelete: false, blockedReasons: ['نقش مورد نظر یافت نشد.'], references: [] };
  }

  const blockedReasons: string[] = [];
  const references: DependencyCheckResult['references'] = [];

  // 1. Is system protected role?
  if (role.isSystemRole) {
    blockedReasons.push(
      `نقش «${role.nameFa}» یک نقش پایه سیستمی (System Built-in Role) است و به دلایل امنیتی حذف آن مجاز نمی‌باشد.`
    );
  }

  // 2. Are users assigned to this role?
  const assignedUsers = users.filter(u => u.roleId === roleId);
  if (assignedUsers.length > 0) {
    const userNames = assignedUsers.map(u => `${u.fullName} (${u.username})`).slice(0, 5);
    const count = assignedUsers.length;
    blockedReasons.push(
      `تعداد ${count} کاربر به این نقش اختصاص داده شده‌اند. برای حذف، ابتدا باید نقش کاربران به نقش دیگری تغییر یابد.`
    );
    references.push({
      type: 'کاربران فعال دارای این نقش',
      count,
      details: count > 5 ? [...userNames, `و ${count - 5} کاربر دیگر...`] : userNames,
    });
  }

  return {
    canDelete: blockedReasons.length === 0,
    blockedReasons,
    references,
  };
}

export function checkSoftwareDependencies(
  softwareId: string,
  softwareList: SoftwareApplication[]
): DependencyCheckResult {
  const software = softwareList.find(s => s.id === softwareId);
  if (!software) {
    return { canDelete: false, blockedReasons: ['نرم‌افزار مورد نظر یافت نشد.'], references: [] };
  }

  const blockedReasons: string[] = [];
  const references: DependencyCheckResult['references'] = [];

  // Check if other software depend on this one
  const dependingSoftware = softwareList.filter(s => 
    s.id !== softwareId && s.dependencies?.some(d => d.targetSoftwareId === softwareId)
  );

  if (dependingSoftware.length > 0) {
    const list = dependingSoftware.map(s => {
      const dep = s.dependencies.find(d => d.targetSoftwareId === softwareId);
      return `سامانه «${s.nameFa}» (نوع وابستگی: ${dep?.relationType || 'نامشخص'})`;
    });
    const count = dependingSoftware.length;
    blockedReasons.push(
      `سامانه «${software.nameFa}» به عنوان سرویس پایه برای ${count} نرم‌افزار سازمانی دیگر شناسایی شده است و حذف آن چرخه سرویس‌دهی را مختل می‌کند.`
    );
    references.push({
      type: 'سامانه‌های یکپارچه وابسته به این نرم‌افزار',
      count,
      details: list,
    });
  }

  return {
    canDelete: blockedReasons.length === 0,
    blockedReasons,
    references,
  };
}
