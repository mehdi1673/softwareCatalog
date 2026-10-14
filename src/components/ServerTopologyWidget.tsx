import React, { useState } from 'react';
import { 
  Server, 
  Plus, 
  Trash2, 
  Edit3, 
  Cpu, 
  HardDrive, 
  Network, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Settings, 
  SlidersHorizontal,
  Copy,
  Check
} from 'lucide-react';
import { 
  SoftwareServer, 
  DynamicServerAttribute, 
  ServerRole, 
  ServerStatus 
} from '../types';
import { ServerModal } from './ServerModal';

interface ServerTopologyWidgetProps {
  servers: SoftwareServer[];
  softwareId: string;
  softwareName: string;
  serverAttributes: DynamicServerAttribute[];
  onAddServer: (newServer: SoftwareServer) => void;
  onUpdateServer: (updatedServer: SoftwareServer) => void;
  onDeleteServer: (serverId: string) => void;
  onAddCustomServerAttribute: (newAttr: DynamicServerAttribute) => void;
  isReadOnly?: boolean;
  canAddServer?: boolean;
  canEditServer?: boolean;
  canDeleteServer?: boolean;
  canManageAttributes?: boolean;
}

export const ServerTopologyWidget: React.FC<ServerTopologyWidgetProps> = ({
  servers,
  softwareId,
  softwareName,
  serverAttributes,
  onAddServer,
  onUpdateServer,
  onDeleteServer,
  onAddCustomServerAttribute,
  isReadOnly = false,
  canAddServer = true,
  canEditServer = true,
  canDeleteServer = true,
  canManageAttributes = true,
}) => {
  const [editingServer, setEditingServer] = useState<SoftwareServer | null>(null);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [showAddCustomAttrModal, setShowAddCustomAttrModal] = useState(false);
  const [deletingServerId, setDeletingServerId] = useState<string | null>(null);

  // New Dynamic Server Attribute Form State
  const [newAttrLabel, setNewAttrLabel] = useState('');
  const [newAttrCode, setNewAttrCode] = useState('');
  const [newAttrType, setNewAttrType] = useState<'text' | 'select' | 'multiselect'>('text');
  const [newAttrOptions, setNewAttrOptions] = useState('');

  // Copy IP feedback state
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleSaveServer = (server: SoftwareServer) => {
    const isNew = !servers.some(s => s.id === server.id);
    if (isNew) {
      onAddServer(server);
    } else {
      onUpdateServer(server);
    }
    setIsServerModalOpen(false);
    setEditingServer(null);
  };

  const handleCreateCustomAttr = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newAttrLabel.trim() || !newAttrCode.trim()) return;

    const newAttr: DynamicServerAttribute = {
      id: `attr-srv-${Date.now()}`,
      code: newAttrCode.trim().toUpperCase(),
      labelFa: newAttrLabel.trim(),
      dataType: newAttrType,
      isMultiValue: newAttrType === 'multiselect',
      isRequired: false,
      options: newAttrOptions ? newAttrOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
    };

    onAddCustomServerAttribute(newAttr);
    setShowAddCustomAttrModal(false);
    setNewAttrLabel('');
    setNewAttrCode('');
    setNewAttrOptions('');
  };

  // Aggregate Compute Stats
  const totalServers = servers.length;
  const totalVcpu = servers.reduce((acc, s) => acc + (s.vcpu || 0), 0);
  const totalRamGb = servers.reduce((acc, s) => acc + (s.ramGb || 0), 0);
  const onlineCount = servers.filter(s => s.status === 'ONLINE').length;

  const roleLabels: { [key in ServerRole]: { label: string; badgeBg: string } } = {
    WEB_SERVER: { label: 'وب (Web Tier)', badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    APP_SERVER: { label: 'برنامه (App Tier)', badgeBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
    DB_PRIMARY: { label: 'دیتابیس اصلی (Primary)', badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    DB_REPLICA: { label: 'دیتابیس ثانویه (Replica)', badgeBg: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
    CACHE_SERVER: { label: 'کش (Redis/Cache)', badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    API_GATEWAY: { label: 'درگاه API (Gateway)', badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
    LOAD_BALANCER: { label: 'توزیع بار (Load Balancer)', badgeBg: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
    MESSAGE_BROKER: { label: 'پیام‌رسان (Broker)', badgeBg: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' },
    LOG_SIEM: { label: 'لاگ و SIEM', badgeBg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    BACKUP_NODE: { label: 'نود پشتیبان (Backup)', badgeBg: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    OTHER: { label: 'سایر', badgeBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800' },
  };

  const statusLabels: { [key in ServerStatus]: { label: string; dotColor: string } } = {
    ONLINE: { label: 'آنلاین', dotColor: 'bg-emerald-500' },
    MAINTENANCE: { label: 'تعمیر و نگهداری', dotColor: 'bg-amber-500' },
    STANDBY: { label: 'آماده‌باش', dotColor: 'bg-blue-500' },
    OFFLINE: { label: 'خاموش', dotColor: 'bg-rose-500' },
  };

  return (
    <div className="space-y-4">
      {/* Top Bar with Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <span className="text-[11px] text-slate-400 block mb-0.5">تعداد کل سرورها / نودها</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>{totalServers} سرور</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">{onlineCount} نود آنلاین و فعال</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <span className="text-[11px] text-slate-400 block mb-0.5">مجموع هسته‌های پردازنده</span>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <Cpu className="w-4 h-4" />
            <span>{totalVcpu} Cores</span>
          </div>
          <span className="text-[10px] text-slate-400">ظرفیت پردازشی کلاستر</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <span className="text-[11px] text-slate-400 block mb-0.5">مجموع حافظه رم کلاستر</span>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span>{totalRamGb} GB</span>
          </div>
          <span className="text-[10px] text-slate-400">حافظه اصلی تخصیص‌یافته</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <span className="text-[11px] text-slate-400 block mb-0.5">خصوصیات داینامیک سرورها</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
            <span>{serverAttributes.length} خصوصیت</span>
          </div>
          <span className="text-[10px] text-slate-400">قابل تعریف نامحدود</span>
        </div>
      </div>

      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>توپولوژی و فهرست تفصیلی سرورهای اختصاص‌یافته به سامانه</span>
          </h4>
          <p className="text-[11px] text-slate-500">
            مشخصات کامل هر سرور شامل سیستم‌عامل، سخت‌افزار، IPها، زون امنیتی، دیتاسنتر و متادیتای اختصاصی
          </p>
        </div>

        {!isReadOnly && (canManageAttributes || canAddServer) && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {canManageAttributes && (
              <button
                type="button"
                onClick={() => setShowAddCustomAttrModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>+ خصوصیت داینامیک سرور</span>
              </button>
            )}

            {canAddServer && (
              <button
                type="button"
                onClick={() => {
                  setEditingServer(null);
                  setIsServerModalOpen(true);
                }}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ افزودن سرور جدید</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Servers Table / Detailed Cards */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">نام هاست‌نیم (FQDN)</th>
                <th className="py-2.5 px-3">نقش کلاستر</th>
                <th className="py-2.5 px-3">آدرس IP</th>
                <th className="py-2.5 px-3">محیط</th>
                <th className="py-2.5 px-3">مشخصات سخت‌افزاری</th>
                <th className="py-2.5 px-3">زون امنیتی و دیتاسنتر</th>
                <th className="py-2.5 px-3">وضعیت</th>
                {!isReadOnly && (canEditServer || canDeleteServer) && <th className="py-2.5 px-3 text-center">عملیات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {servers.map(srv => {
                const roleBadge = roleLabels[srv.serverRole] || { label: srv.serverRole, badgeBg: 'bg-slate-100 text-slate-800' };
                const statBadge = statusLabels[srv.status] || { label: srv.status, dotColor: 'bg-slate-400' };

                return (
                  <tr key={srv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    {/* Hostname & OS */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {srv.hostname}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span>{srv.operatingSystem}</span>
                        <span>•</span>
                        <span className="text-slate-400 font-mono text-[10px]">{srv.virtualization}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${roleBadge.badgeBg}`}>
                        {roleBadge.label}
                      </span>
                    </td>

                    {/* IPs */}
                    <td className="py-3 px-3 font-mono text-xs">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                        <span>{srv.ipInternal}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyIp(srv.ipInternal)}
                          title="کپی آدرس IP داخلی"
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          {copiedIp === srv.ipInternal ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      {srv.ipExternal && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          VIP: {srv.ipExternal}
                        </div>
                      )}
                    </td>

                    {/* Environment */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {srv.environment === 'PRODUCTION' ? 'عملیات (Prod)' :
                         srv.environment === 'DISASTER_RECOVERY' ? 'بحران (DR)' :
                         srv.environment === 'STAGING' ? 'پیش‌تولید (Staging)' : 'توسعه (Dev)'}
                      </span>
                    </td>

                    {/* Hardware specs */}
                    <td className="py-3 px-3 text-[11px] font-mono">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {srv.vcpu} vCPU / {srv.ramGb} GB RAM
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {srv.storageDisk}
                      </div>
                    </td>

                    {/* Security zone & DC */}
                    <td className="py-3 px-3 text-[11px]">
                      <div className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                        {srv.securityZone}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {srv.datacenterLocation}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                        <span className={`w-2 h-2 rounded-full ${statBadge.dotColor}`} />
                        <span>{statBadge.label}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    {!isReadOnly && (canEditServer || canDeleteServer) && (
                      <td className="py-3 px-3 text-center">
                        {deletingServerId === srv.id ? (
                          <div className="flex items-center justify-center gap-1 text-[10px]">
                            <span className="text-rose-600 font-bold">حذف؟</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteServer(srv.id);
                                setDeletingServerId(null);
                              }}
                              className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
                            >
                              بله
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingServerId(null)}
                              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
                            >
                              لغو
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {canEditServer && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingServer(srv);
                                  setIsServerModalOpen(true);
                                }}
                                title="ویرایش مشخصات سرور"
                                className="p-1 text-slate-400 hover:text-amber-600 rounded-lg transition"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteServer && (
                              <button
                                type="button"
                                onClick={() => setDeletingServerId(srv.id)}
                                title="حذف سرور از سامانه"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}

              {servers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    هنوز سروری برای این نرم‌افزار ثبت نشده است. از دکمه «+ افزودن سرور جدید» استفاده کنید.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Server */}
      {isServerModalOpen && (
        <ServerModal
          isOpen={isServerModalOpen}
          server={editingServer}
          softwareId={softwareId}
          softwareName={softwareName}
          serverAttributes={serverAttributes}
          onClose={() => {
            setIsServerModalOpen(false);
            setEditingServer(null);
          }}
          onSave={handleSaveServer}
        />
      )}

      {/* Modal: Add Dynamic Custom Attribute for Servers */}
      {showAddCustomAttrModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-600" />
              <span>تعریف خصوصیت داینامیک جدید برای سرورها</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان فارسی خصوصیت *
                </label>
                <input
                  type="text"
                  required
                  value={newAttrLabel}
                  onChange={e => setNewAttrLabel(e.target.value)}
                  placeholder="مثلاً: وضعیت لایسنس ویندوز"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد یکتای انگلیسی (Attribute Code) *
                </label>
                <input
                  type="text"
                  required
                  value={newAttrCode}
                  onChange={e => setNewAttrCode(e.target.value)}
                  dir="ltr"
                  placeholder="WINDOWS_LICENSE_STATUS"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نوع داده
                </label>
                <select
                  value={newAttrType}
                  onChange={e => setNewAttrType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                >
                  <option value="text">متن ساده (Text)</option>
                  <option value="select">لیست کشویی تک انتخابی (Select)</option>
                  <option value="multiselect">چند انتخابی (Multi-Select Tags)</option>
                </select>
              </div>

              {(newAttrType === 'select' || newAttrType === 'multiselect') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    گزینه‌های قابل انتخاب (با کاما جدا کنید) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAttrOptions}
                    onChange={e => setNewAttrOptions(e.target.value)}
                    placeholder="فعال قانونی، KMS داخلی، منقضی‌شده"
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomAttrModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateCustomAttr()}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm cursor-pointer"
                >
                  ثبت خصوصیت سرور
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
