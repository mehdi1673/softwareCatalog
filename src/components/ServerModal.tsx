import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Save, 
  Cpu, 
  HardDrive, 
  Network, 
  Shield, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Layers,
  Activity
} from 'lucide-react';
import { 
  SoftwareServer, 
  ServerRole, 
  ServerEnvironment, 
  ServerStatus, 
  DynamicServerAttribute 
} from '../types';
import { SolarDatePicker } from './SolarDatePicker';

interface ServerModalProps {
  isOpen: boolean;
  server: SoftwareServer | null;
  softwareId: string;
  softwareName: string;
  serverAttributes: DynamicServerAttribute[];
  onClose: () => void;
  onSave: (savedServer: SoftwareServer) => void;
}

export const ServerModal: React.FC<ServerModalProps> = ({
  isOpen,
  server,
  softwareId,
  softwareName,
  serverAttributes,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(server);

  // Core Identity State
  const [hostname, setHostname] = useState(server?.hostname || '');
  const [serverRole, setServerRole] = useState<ServerRole>(server?.serverRole || 'WEB_SERVER');
  const [environment, setEnvironment] = useState<ServerEnvironment>(server?.environment || 'PRODUCTION');
  const [ipInternal, setIpInternal] = useState(server?.ipInternal || '');
  const [ipExternal, setIpExternal] = useState(server?.ipExternal || '');
  
  // Hardware & OS
  const [operatingSystem, setOperatingSystem] = useState(server?.operatingSystem || 'Red Hat Enterprise Linux 9');
  const [virtualization, setVirtualization] = useState(server?.virtualization || 'VMware vSphere ESXi 8.0');
  const [vcpu, setVcpu] = useState<number>(server?.vcpu || 16);
  const [ramGb, setRamGb] = useState<number>(server?.ramGb || 64);
  const [storageDisk, setStorageDisk] = useState(server?.storageDisk || '500 GB NVMe SAN');

  // Network & Location
  const [datacenterLocation, setDatacenterLocation] = useState(server?.datacenterLocation || 'دیتاسنتر اصلی - سالن ۱ - رک R04');
  const [securityZone, setSecurityZone] = useState(server?.securityZone || 'DMZ (شبکه وب عمومی)');
  const [openPorts, setOpenPorts] = useState<string[]>(server?.openPorts || ['443', '80']);
  const [portInput, setPortInput] = useState('');

  // Operations & Security
  const [status, setStatus] = useState<ServerStatus>(server?.status || 'ONLINE');
  const [backupPolicy, setBackupPolicy] = useState(server?.backupPolicy || 'Veeam Backup روزانه ساعت ۰۱:۰۰ بامداد');
  const [monitoringAgent, setMonitoringAgent] = useState(server?.monitoringAgent || 'فعال - Zabbix Agent v6.4');
  const [antivirusEDR, setAntivirusEDR] = useState(server?.antivirusEDR || 'فعال - Kaspersky Endpoint Security');
  const [sslCertExpiryShamsi, setSslCertExpiryShamsi] = useState(server?.sslCertExpiryShamsi || '');
  const [notes, setNotes] = useState(server?.notes || '');

  // Dynamic Custom Server Attribute Values: { [attrId]: string[] }
  const [customValues, setCustomValues] = useState<{ [attrId: string]: string[] }>(() => {
    const initial: { [attrId: string]: string[] } = {};
    serverAttributes.forEach(attr => {
      initial[attr.id] = server?.customAttributeValues?.[attr.id] || [];
    });
    return initial;
  });

  const handleAddPort = () => {
    const p = portInput.trim();
    if (p && !openPorts.includes(p)) {
      setOpenPorts([...openPorts, p]);
      setPortInput('');
    }
  };

  const handleRemovePort = (portToRemove: string) => {
    setOpenPorts(openPorts.filter(p => p !== portToRemove));
  };

  const handleCustomSingleChange = (attrId: string, val: string) => {
    setCustomValues(prev => ({ ...prev, [attrId]: [val] }));
  };

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    if (!hostname.trim() || !ipInternal.trim()) {
      setFormError('لطفاً نام هاست‌نیم سرور و آدرس IP داخلی را وارد نمایید.');
      return;
    }

    const savedServer: SoftwareServer = {
      id: server?.id || `srv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      softwareId,
      hostname: hostname.trim(),
      serverRole,
      environment,
      ipInternal: ipInternal.trim(),
      ipExternal: ipExternal.trim() || undefined,
      operatingSystem: operatingSystem.trim(),
      virtualization: virtualization.trim(),
      vcpu: Number(vcpu) || 4,
      ramGb: Number(ramGb) || 16,
      storageDisk: storageDisk.trim(),
      datacenterLocation: datacenterLocation.trim(),
      securityZone: securityZone.trim(),
      openPorts,
      status,
      backupPolicy: backupPolicy.trim(),
      monitoringAgent: monitoringAgent.trim(),
      antivirusEDR: antivirusEDR.trim(),
      sslCertExpiryShamsi: sslCertExpiryShamsi || undefined,
      notes: notes.trim() || undefined,
      customAttributeValues: customValues,
    };

    onSave(savedServer);
  };

  const roleLabels: { [key in ServerRole]: string } = {
    WEB_SERVER: 'سرور وب (Web Tier / Reverse Proxy)',
    APP_SERVER: 'سرور برنامه / اپلیکیشن (App Tier)',
    DB_PRIMARY: 'پایگاه داده اصلی (Primary DB / Master)',
    DB_REPLICA: 'پایگاه داده ثانویه (Read Replica / Slave)',
    CACHE_SERVER: 'سرور کش توزیع‌شده (Redis / Memcached)',
    API_GATEWAY: 'درگاه مرکزی API و اینگرس (API Gateway)',
    LOAD_BALANCER: 'توزیع‌کننده بار (HAProxy / F5 / Nginx)',
    MESSAGE_BROKER: 'کارگزار پیام (Kafka / RabbitMQ)',
    LOG_SIEM: 'سرور لاگ و SIEM امنیتی',
    BACKUP_NODE: 'نود پشتیبان‌گیری و آرشیو',
    OTHER: 'سایر نقش‌های زیرساختی',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {isEditing ? `ویرایش مشخصات سرور: ${server?.hostname}` : 'تعریف سرور / نود جدید برای سامانه'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                نرم‌افزار متصل: <strong className="text-slate-700 dark:text-slate-200">{softwareName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body Container (using div to prevent nested form issues) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-400 hover:text-rose-600 font-bold px-1"
              >
                ×
              </button>
            </div>
          )}

          {/* Section 1: Server Identity & Environment */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-r-4 border-indigo-600 pr-2">
              <Network className="w-4 h-4 text-indigo-600" />
              <span>هویت سرور، نقش کلاستر و آدرس‌دهی شبکه</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام هاست‌نیم / FQDN سرور *
                </label>
                <input
                  type="text"
                  required
                  value={hostname}
                  onChange={e => setHostname(e.target.value)}
                  dir="ltr"
                  placeholder="srv-auto-web01.enterprise.gov.ir"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نقش عملکردی در کلاستر *
                </label>
                <select
                  value={serverRole}
                  onChange={e => setServerRole(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-medium"
                >
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  محیط کاری (Environment) *
                </label>
                <select
                  value={environment}
                  onChange={e => setEnvironment(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                >
                  <option value="PRODUCTION">عملیات واقعی (Production)</option>
                  <option value="STAGING">محیط پیش‌تولید / آزمون (Staging / UAT)</option>
                  <option value="DEVELOPMENT">محیط توسعه و تست (Development)</option>
                  <option value="DISASTER_RECOVERY">سایت بحران / پشتیبان (Disaster Recovery - DR)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  آدرس IP داخلی (Internal IP) *
                </label>
                <input
                  type="text"
                  required
                  value={ipInternal}
                  onChange={e => setIpInternal(e.target.value)}
                  dir="ltr"
                  placeholder="172.16.20.10"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  آدرس IP بیرونی / VIP مجازی
                </label>
                <input
                  type="text"
                  value={ipExternal}
                  onChange={e => setIpExternal(e.target.value)}
                  dir="ltr"
                  placeholder="10.50.1.10 (VIP)"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  وضعیت فعلی سرور
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                >
                  <option value="ONLINE">آنلاین و فعال (Online)</option>
                  <option value="MAINTENANCE">در حال تعمیر و نگهداری (Maintenance)</option>
                  <option value="STANDBY">آماده‌باش / کلاستر سرد (Standby)</option>
                  <option value="OFFLINE">خاموش / قطع ارتباط (Offline)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Hardware Specifications & Virtualization */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-r-4 border-indigo-600 pr-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>مشخصات پردازشی، حافظه، ذخیره‌سازی و مجازی‌سازی</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تعداد هسته پردازنده (vCPU) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={256}
                  value={vcpu}
                  onChange={e => setVcpu(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  حافظه رم به گیگابایت (RAM GB) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={2048}
                  value={ramGb}
                  onChange={e => setRamGb(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  حجم و نوع ذخیره‌ساز دیسک (Storage / SAN)
                </label>
                <input
                  type="text"
                  value={storageDisk}
                  onChange={e => setStorageDisk(e.target.value)}
                  placeholder="500 GB NVMe SAN All-Flash RAID10"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  سیستم‌عامل و ویرایش (OS) *
                </label>
                <input
                  type="text"
                  required
                  value={operatingSystem}
                  onChange={e => setOperatingSystem(e.target.value)}
                  placeholder="Windows Server 2022 / RHEL 9.2"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  بستر مجازی‌سازی / میزبان
                </label>
                <input
                  type="text"
                  value={virtualization}
                  onChange={e => setVirtualization(e.target.value)}
                  placeholder="VMware vSphere ESXi 8.0 / OpenShift Pod / فیزیکی"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Data Center, Network Security & Ports */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-r-4 border-indigo-600 pr-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>محل استقرار فیزیکی، زون امنیتی فایروال و پورت‌های باز</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  دیتاسنتر، سالن و رک (Datacenter Location)
                </label>
                <input
                  type="text"
                  value={datacenterLocation}
                  onChange={e => setDatacenterLocation(e.target.value)}
                  placeholder="دیتاسنتر مرکزی - سالن ۱ - رک R04"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  زون امنیتی فایروال / VLAN
                </label>
                <input
                  type="text"
                  value={securityZone}
                  onChange={e => setSecurityZone(e.target.value)}
                  placeholder="DMZ / Trust / Restricted DB Zone"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Open Ports Tags Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                پورت‌های باز فایروال / Listening Ports (چند مقداری)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={portInput}
                  onChange={e => setPortInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPort();
                    }
                  }}
                  placeholder="شماره پورت (مثلاً 443 یا 1433) را بنویسید..."
                  className="flex-1 px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddPort}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs font-bold"
                >
                  + افزودن پورت
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {openPorts.map((port, pIdx) => (
                  <span
                    key={pIdx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  >
                    <span>Port: {port}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePort(port)}
                      className="text-slate-400 hover:text-rose-500 mr-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Dynamic Custom Server Attributes */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-r-4 border-purple-600 pr-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>خصوصیات داینامیک اختصاصی سرورها ({serverAttributes.length} خصوصیت فعال)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serverAttributes.map(attr => {
                const currentVals = customValues[attr.id] || [];

                return (
                  <div key={attr.id} className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      {attr.labelFa}
                    </label>

                    {attr.dataType === 'select' ? (
                      <select
                        value={currentVals[0] || ''}
                        onChange={e => handleCustomSingleChange(attr.id, e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      >
                        <option value="">-- انتخاب کنید --</option>
                        {attr.options?.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : attr.dataType === 'multiselect' ? (
                      <div className="space-y-1 max-h-28 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                        {attr.options?.map((opt, oIdx) => {
                          const isChecked = currentVals.includes(opt);
                          return (
                            <label key={oIdx} className="flex items-center gap-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setCustomValues(prev => ({ ...prev, [attr.id]: currentVals.filter(v => v !== opt) }));
                                  } else {
                                    setCustomValues(prev => ({ ...prev, [attr.id]: [...currentVals, opt] }));
                                  }
                                }}
                                className="rounded text-indigo-600"
                              />
                              <span className="truncate">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={currentVals[0] || ''}
                        onChange={e => handleCustomSingleChange(attr.id, e.target.value)}
                        placeholder={attr.placeholder || ''}
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Backup, Monitoring & Notes */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  پالیسی پشتیبان‌گیری (Backup Policy)
                </label>
                <input
                  type="text"
                  value={backupPolicy}
                  onChange={e => setBackupPolicy(e.target.value)}
                  placeholder="Veeam Backup روزانه ساعت ۰۱:۰۰"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  اتصال به سیستم مانیتورینگ
                </label>
                <input
                  type="text"
                  value={monitoringAgent}
                  onChange={e => setMonitoringAgent(e.target.value)}
                  placeholder="Zabbix Agent v6.4 / Prometheus"
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تاریخ انقضای گواهی SSL (شمسی)
                </label>
                <SolarDatePicker
                  value={sslCertExpiryShamsi}
                  onChange={val => setSslCertExpiryShamsi(val)}
                  placeholder="۱۴۰۴/۱۲/۲۹"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                توضیحات و مستندات فنی نود
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="یادداشت‌های فنی، پیکربندی‌های ویژه و مخاطبان نود را وارد کنید..."
                className="w-full px-3 py-2 border rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Footer Buttons */}
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
              <span>{isEditing ? 'ذخیره تغییرات سرور' : 'افزودن سرور به سامانه'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
