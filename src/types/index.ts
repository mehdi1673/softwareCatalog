export type AttributeDataType = 
  | 'text' 
  | 'number' 
  | 'solar_date' 
  | 'select' 
  | 'multiselect' 
  | 'boolean' 
  | 'url' 
  | 'textarea';

export interface AttributeDefinition {
  id: string;
  categoryId: string;
  code: string;
  labelFa: string;
  dataType: AttributeDataType;
  isMultiValue: boolean;
  isRequired: boolean;
  options?: string[]; // for select and multiselect
  placeholder?: string;
  description?: string;
  defaultValue?: string | string[];
}

export interface Category {
  id: string;
  code: string;
  nameFa: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  attributes: AttributeDefinition[];
}

export interface AttributeValueRecord {
  attributeId: string;
  attributeCode: string;
  values: string[]; // multi-values stored as array of strings
}

export interface SoftwareDependencyRelation {
  targetSoftwareId: string;
  targetSoftwareName: string;
  relationType: 'CONSUMES_API' | 'SHARES_DB' | 'SSO_INTEGRATION' | 'DATA_FEED';
  description: string;
}

export type ServerRole = 
  | 'WEB_SERVER' 
  | 'APP_SERVER' 
  | 'DB_PRIMARY' 
  | 'DB_REPLICA' 
  | 'CACHE_SERVER' 
  | 'API_GATEWAY' 
  | 'LOAD_BALANCER' 
  | 'MESSAGE_BROKER' 
  | 'LOG_SIEM' 
  | 'BACKUP_NODE' 
  | 'OTHER';

export type ServerEnvironment = 
  | 'PRODUCTION' 
  | 'STAGING' 
  | 'DEVELOPMENT' 
  | 'DISASTER_RECOVERY';

export type ServerStatus = 
  | 'ONLINE' 
  | 'MAINTENANCE' 
  | 'OFFLINE' 
  | 'STANDBY';

export interface DynamicServerAttribute {
  id: string;
  code: string;
  labelFa: string;
  dataType: AttributeDataType;
  isMultiValue: boolean;
  isRequired: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
}

export interface SoftwareServer {
  id: string;
  softwareId: string;
  hostname: string; // e.g. srv-auto-web01.enterprise.gov.ir
  serverRole: ServerRole;
  environment: ServerEnvironment;
  ipInternal: string; // e.g. 172.16.20.10
  ipExternal?: string; // e.g. 10.50.4.100 or VIP
  operatingSystem: string; // e.g. Windows Server 2022 Datacenter / RHEL 9
  virtualization: string; // e.g. VMware vSphere / OpenShift / Bare-Metal
  vcpu: number; // e.g. 16
  ramGb: number; // e.g. 64
  storageDisk: string; // e.g. 500GB NVMe SSD RAID10
  datacenterLocation: string; // e.g. دیتاسنتر اصلی - سالن سرور ۱ - رک R08
  securityZone: string; // e.g. DMZ / Trust / Restricted DB Zone
  openPorts: string[]; // e.g. ['443', '80', '8443']
  status: ServerStatus;
  backupPolicy: string; // e.g. Veeam Backup روزانه ساعت ۰۱:۰۰
  monitoringAgent: string; // e.g. Zabbix Agent v6.4 / Prometheus Node Exporter
  antivirusEDR: string; // e.g. فعال - Kaspersky Endpoint Security / Trend Micro
  sslCertExpiryShamsi?: string; // e.g. ۱۴۰۴/۱۲/۲۹
  notes?: string;
  customAttributeValues: {
    [attributeId: string]: string[];
  };
}

export interface SoftwareApplication {
  id: string;
  code: string; // e.g., APP-101
  nameFa: string;
  nameEn: string;
  description: string;
  version: string;
  status: 'ACTIVE' | 'DEVELOPMENT' | 'MAINTENANCE' | 'DEPRECATED' | 'RETIRED';
  criticality: 'TIER_1_CRITICAL' | 'TIER_2_IMPORTANT' | 'TIER_3_NORMAL' | 'TIER_4_LOW';
  ownerDepartment: string;
  technicalLead: string;
  vendorName: string;
  deployEnvironment: 'ON_PREMISE' | 'PRIVATE_CLOUD' | 'HYBRID' | 'CONTAINERIZED';
  createdDateShamsi: string;
  updatedDateShamsi: string;
  createdBy: string;
  categoryValues: {
    [categoryId: string]: AttributeValueRecord[];
  };
  dependencies: SoftwareDependencyRelation[];
  servers: SoftwareServer[]; // Multiple servers per application with rich attributes
  currentVersionNumber: number;
}

export interface SoftwareVersionSnapshot {
  versionId: string;
  softwareId: string;
  versionNumber: number;
  versionTag: string;
  changeType: 'INITIAL_REGISTRATION' | 'ATTRIBUTE_UPDATE' | 'MAJOR_UPGRADE' | 'SECURITY_PATCH' | 'CONFIG_CHANGE';
  changedBy: string;
  changedDateShamsi: string;
  changeDescription: string;
  snapshotData: Partial<SoftwareApplication>;
}

export interface CategoryPermission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface Role {
  id: string;
  code: string;
  nameFa: string;
  description: string;
  isSystemRole: boolean;
  // Permissions mapped by category ID + system modules
  categoryPermissions: {
    [categoryId: string]: CategoryPermission;
  };
  // Permissions for Server Topology & Infrastructure
  serverPermissions: CategoryPermission;
  systemPermissions: {
    manageCategories: boolean;
    manageRoles: boolean;
    manageUsers: boolean;
    viewAuditLogs: boolean;
    exportReports: boolean;
    viewArchitectureDocs: boolean;
    viewSqlServerScript: boolean;
    viewPythonBackend: boolean;
    manageServerAttributes: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  department: string;
  isActive: boolean;
  isLocked: boolean;
  lastLoginShamsi?: string;
  createdDateShamsi: string;
}

export type AuditAction = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'CREATE_SOFTWARE'
  | 'UPDATE_SOFTWARE'
  | 'DELETE_SOFTWARE'
  | 'BLOCKED_DELETE_SOFTWARE'
  | 'CREATE_CATEGORY'
  | 'UPDATE_CATEGORY'
  | 'DELETE_CATEGORY'
  | 'BLOCKED_DELETE_CATEGORY'
  | 'CREATE_ROLE'
  | 'UPDATE_ROLE'
  | 'DELETE_ROLE'
  | 'BLOCKED_DELETE_ROLE'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGE'
  | 'EXPORT_REPORT';

export interface AuditLog {
  id: string;
  timestampShamsi: string;
  userId: string;
  username: string;
  action: AuditAction;
  module: string;
  targetId: string;
  targetName: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  isSecurityAlert: boolean;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface DependencyCheckResult {
  canDelete: boolean;
  blockedReasons: string[];
  references: {
    type: string;
    count: number;
    details: string[];
  }[];
}
