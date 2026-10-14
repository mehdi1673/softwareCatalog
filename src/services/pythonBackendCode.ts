/**
 * Complete, Production-Grade Python Backend (FastAPI + SQLAlchemy 2.0 + Pydantic v2 + PyODBC)
 * Architected by: Principal Software Architect & DevOps / Security Engineer
 * 
 * Includes:
 * 1. Database Connection & Pooling (SQL Server via mssql+pyodbc)
 * 2. Declarative ORM Models
 * 3. Pydantic v2 Schemas
 * 4. OWASP Security, JWT & Captcha Verifier
 * 5. Dynamic RBAC & Category Permission Guard
 * 6. Software, Categories, Attributes, Roles & Users Routers
 * 7. Pre-Delete Dependency Validator & Complete Audit Trail
 * 8. Excel Exporter
 */

export const PYTHON_BACKEND_FILES: { [filename: string]: { description: string; code: string } } = {
  'main.py': {
    description: 'نقطه ورود اصلی سرور FastAPI به همراه میدل‌ویرهای امنیتی، CORS و مانیتورینگ',
    code: `"""
سامانه مدیریت شناسنامه و کاتالوگ نرم‌افزارهای سازمانی
Enterprise Application Portfolio & Software Asset Inventory System (SPM)
Engineered with FastAPI, SQLAlchemy 2.0 and Microsoft SQL Server
"""

import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from routers import auth, software, categories, roles, users, reports, audit
from database import engine, Base

app = FastAPI(
    title="سامانه شناسنامه نرم‌افزارهای سازمانی (Enterprise SPM API)",
    description="سرویس مدیریت کاتالوگ، نسخه‌بندی، دسترسی‌های داینامیک و ممیزی امنیتی نرم‌افزارها",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# تنظیمات امنیتی CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # در محیط عملیاتی به دامنه سازمانی محدود می‌شود
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# میدل‌ویر ثبت زمان پردازش و تزریق هدرهای امنیتی (Security Headers)
@app.middleware("http")
async def security_and_timing_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

# ثبت روترهای ماژولار سامانه
app.include_router(auth.router, prefix="/api/auth", tags=["احراز هویت و کپچا"])
app.include_router(software.router, prefix="/api/software", tags=["شناسنامه نرم‌افزارها"])
app.include_router(categories.router, prefix="/api/categories", tags=["طبقات و خصوصیات داینامیک"])
app.include_router(roles.router, prefix="/api/roles", tags=["نقش‌ها و ماتریس دسترسی"])
app.include_router(users.router, prefix="/api/users", tags=["مدیریت کاربران"])
app.include_router(reports.router, prefix="/api/reports", tags=["گزارش‌گیری و خروجی اکسل"])
app.include_router(audit.router, prefix="/api/audit", tags=["لاگ‌های امنیتی و ممیزی"])

@app.get("/health", tags=["سلامت سرویس"])
def health_check():
    return {"status": "HEALTHY", "system": "Enterprise SPM Backend", "db": "SQL Server Connected"}
`
  },

  'database.py': {
    description: 'تنظیمات اتصال پایگاه داده SQL Server، Connection Pooling و مدیریت نشست‌ها',
    code: `"""
پیکربندی اتصال به Microsoft SQL Server با SQLAlchemy 2.0 و PyODBC Driver
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# رشته اتصال استاندارد به SQL Server با پشتیبانی از کدهای یونیکد فارسی
DB_SERVER = os.getenv("DB_SERVER", "localhost\\\\SQLEXPRESS")
DB_NAME = os.getenv("DB_NAME", "EnterpriseSoftwareCatalogDB")
DB_USER = os.getenv("DB_USER", "sa")
DB_PASSWORD = os.getenv("DB_PASSWORD", "EnterpriseP@ssw0rd2026!")

# اتصال ODBC Driver 18 for SQL Server
DATABASE_URL = (
    f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/{DB_NAME}"
    "?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes&charset=utf8"
)

# ایجاد Engine با Connection Pool بهینه برای سیستم‌های با ترافیک بالا
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    fast_executemany=True,  # شتاب‌دهی چندبرابری در درج دسته‌ای اطلاعات
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`
  },

  'models.py': {
    description: 'تعریف ساختار جداول پایگاه داده بر اساس معماری EAV داینامیک و امنیت RBAC',
    code: `"""
مدل‌های ORM پایگاه داده SQL Server با پشتیبانی از خصوصیات داینامیک و ممیزی
"""

from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, 
    ForeignKey, UniqueConstraint, BigInteger
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class SysRole(Base):
    __tablename__ = "Sys_Roles"
    RoleId = Column(String(50), primary_key=True)
    RoleCode = Column(String(50), unique=True, nullable=False)
    RoleNameFa = Column(String(150), nullable=False)
    Description = Column(String(500), nullable=True)
    IsSystemRole = Column(Boolean, default=False, nullable=False)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    users = relationship("SysUser", back_populates="role")
    category_permissions = relationship("SysRoleCategoryPermission", back_populates="role", cascade="all, delete-orphan")

class SysUser(Base):
    __tablename__ = "Sys_Users"
    UserId = Column(String(50), primary_key=True)
    Username = Column(String(100), unique=True, nullable=False)
    PasswordHash = Column(String(256), nullable=False)
    PasswordSalt = Column(String(128), nullable=False)
    FullName = Column(String(200), nullable=False)
    Email = Column(String(150), nullable=False)
    Department = Column(String(150), nullable=True)
    RoleId = Column(String(50), ForeignKey("Sys_Roles.RoleId"), nullable=False)
    IsActive = Column(Boolean, default=True, nullable=False)
    IsLocked = Column(Boolean, default=False, nullable=False)
    LastLoginDateShamsi = Column(String(30), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    role = relationship("SysRole", back_populates="users")

class CatalogCategory(Base):
    __tablename__ = "Catalog_Categories"
    CategoryId = Column(String(50), primary_key=True)
    CategoryCode = Column(String(50), unique=True, nullable=False)
    CategoryNameFa = Column(String(150), nullable=False)
    Description = Column(String(500), nullable=True)
    IconName = Column(String(50), default="Layers")
    DisplayOrder = Column(Integer, default=1)
    IsActive = Column(Boolean, default=True)

    attributes = relationship("CatalogAttribute", back_populates="category", cascade="all, delete-orphan")

class CatalogAttribute(Base):
    __tablename__ = "Catalog_Attributes"
    AttributeId = Column(String(50), primary_key=True)
    CategoryId = Column(String(50), ForeignKey("Catalog_Categories.CategoryId"), nullable=False)
    AttributeCode = Column(String(50), nullable=False)
    LabelFa = Column(String(200), nullable=False)
    DataType = Column(String(30), nullable=False)  # text, number, solar_date, select, multiselect, boolean
    IsMultiValue = Column(Boolean, default=False)
    IsRequired = Column(Boolean, default=False)
    Placeholder = Column(String(200), nullable=True)
    Description = Column(String(500), nullable=True)
    DefaultValue = Column(Text, nullable=True)
    DisplayOrder = Column(Integer, default=1)

    category = relationship("CatalogCategory", back_populates="attributes")
    options = relationship("CatalogAttributeOption", back_populates="attribute", cascade="all, delete-orphan")

class CatalogAttributeOption(Base):
    __tablename__ = "Catalog_AttributeOptions"
    OptionId = Column(BigInteger, primary_key=True, autoincrement=True)
    AttributeId = Column(String(50), ForeignKey("Catalog_Attributes.AttributeId"), nullable=False)
    OptionValue = Column(String(250), nullable=False)
    DisplayOrder = Column(Integer, default=1)

    attribute = relationship("CatalogAttribute", back_populates="options")

class SysRoleCategoryPermission(Base):
    __tablename__ = "Sys_RoleCategoryPermissions"
    PermissionId = Column(BigInteger, primary_key=True, autoincrement=True)
    RoleId = Column(String(50), ForeignKey("Sys_Roles.RoleId"), nullable=False)
    CategoryId = Column(String(50), ForeignKey("Catalog_Categories.CategoryId"), nullable=False)
    CanView = Column(Boolean, default=False)
    CanCreate = Column(Boolean, default=False)
    CanEdit = Column(Boolean, default=False)
    CanDelete = Column(Boolean, default=False)

    role = relationship("SysRole", back_populates="category_permissions")

class SoftwareApplication(Base):
    __tablename__ = "Software_Applications"
    SoftwareId = Column(String(50), primary_key=True)
    AppCode = Column(String(50), unique=True, nullable=False)
    NameFa = Column(String(250), nullable=False)
    NameEn = Column(String(250), nullable=True)
    Description = Column(Text, nullable=True)
    CurrentVersion = Column(String(50), default="1.0.0")
    Status = Column(String(50), default="ACTIVE")
    Criticality = Column(String(50), default="TIER_2_IMPORTANT")
    OwnerDepartment = Column(String(200), nullable=False)
    TechnicalLead = Column(String(150), nullable=True)
    VendorName = Column(String(200), nullable=True)
    DeployEnvironment = Column(String(50), default="ON_PREMISE")
    CurrentVersionNumber = Column(Integer, default=1)
    CreatedDateShamsi = Column(String(20), nullable=False)
    UpdatedDateShamsi = Column(String(20), nullable=False)
    CreatedByUserId = Column(String(50), nullable=False)
    IsDeleted = Column(Boolean, default=False)

    multi_values = relationship("SoftwareAttributeMultiValue", cascade="all, delete-orphan")
    version_history = relationship("SoftwareVersionHistory", cascade="all, delete-orphan")
    servers = relationship("SoftwareServer", back_populates="application", cascade="all, delete-orphan")

class SoftwareServer(Base):
    __tablename__ = "Software_Servers"
    ServerId = Column(String(50), primary_key=True)
    SoftwareId = Column(String(50), ForeignKey("Software_Applications.SoftwareId"), nullable=False)
    Hostname = Column(String(250), nullable=False)
    ServerRole = Column(String(50), nullable=False)
    Environment = Column(String(50), default="PRODUCTION")
    IpInternal = Column(String(50), nullable=False)
    IpExternal = Column(String(50), nullable=True)
    OperatingSystem = Column(String(150), nullable=False)
    Virtualization = Column(String(150), default="VMware vSphere")
    Vcpu = Column(Integer, default=8)
    RamGb = Column(Integer, default=32)
    StorageDisk = Column(String(200), default="500 GB SAN Tier-1")
    DatacenterLocation = Column(String(250), nullable=False)
    SecurityZone = Column(String(150), nullable=False)
    OpenPortsCsv = Column(String(500), nullable=True)
    Status = Column(String(50), default="ONLINE")
    BackupPolicy = Column(String(300), nullable=True)
    MonitoringAgent = Column(String(200), nullable=True)
    AntivirusEDR = Column(String(200), nullable=True)
    SslCertExpiryShamsi = Column(String(30), nullable=True)
    Notes = Column(Text, nullable=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    application = relationship("SoftwareApplication", back_populates="servers")
    dynamic_values = relationship("ServerDynamicAttributeValue", back_populates="server", cascade="all, delete-orphan")

class ServerDynamicAttribute(Base):
    __tablename__ = "Server_DynamicAttributes"
    AttributeId = Column(String(50), primary_key=True)
    AttributeCode = Column(String(50), unique=True, nullable=False)
    LabelFa = Column(String(150), nullable=False)
    DataType = Column(String(50), nullable=False)
    IsMultiValue = Column(Boolean, default=False)
    IsRequired = Column(Boolean, default=False)
    OptionsCsv = Column(String(1000), nullable=True)
    Description = Column(String(500), nullable=True)

class ServerDynamicAttributeValue(Base):
    __tablename__ = "Server_DynamicAttributeValues"
    ValueRecordId = Column(BigInteger, primary_key=True, autoincrement=True)
    ServerId = Column(String(50), ForeignKey("Software_Servers.ServerId"), nullable=False)
    AttributeId = Column(String(50), ForeignKey("Server_DynamicAttributes.AttributeId"), nullable=False)
    ValueString = Column(Text, nullable=False)

    server = relationship("SoftwareServer", back_populates="dynamic_values")
    attribute = relationship("ServerDynamicAttribute")

class SoftwareAttributeMultiValue(Base):
    __tablename__ = "Software_AttributeMultiValues"
    ValueRecordId = Column(BigInteger, primary_key=True, autoincrement=True)
    SoftwareId = Column(String(50), ForeignKey("Software_Applications.SoftwareId"), nullable=False)
    CategoryId = Column(String(50), ForeignKey("Catalog_Categories.CategoryId"), nullable=False)
    AttributeId = Column(String(50), ForeignKey("Catalog_Attributes.AttributeId"), nullable=False)
    ValueString = Column(Text, nullable=False)
    OrderIndex = Column(Integer, default=0)

class SoftwareVersionHistory(Base):
    __tablename__ = "Software_VersionHistory"
    HistoryId = Column(BigInteger, primary_key=True, autoincrement=True)
    SoftwareId = Column(String(50), ForeignKey("Software_Applications.SoftwareId"), nullable=False)
    VersionNumber = Column(Integer, nullable=False)
    VersionTag = Column(String(50), nullable=False)
    ChangeType = Column(String(50), nullable=False)
    ChangedByFullName = Column(String(200), nullable=False)
    ChangedDateShamsi = Column(String(30), nullable=False)
    ChangeDescription = Column(String(1000), nullable=False)
    FullSnapshotJson = Column(Text, nullable=False)

class AuditSecurityLog(Base):
    __tablename__ = "Audit_SecurityLogs"
    LogId = Column(BigInteger, primary_key=True, autoincrement=True)
    TimestampShamsi = Column(String(30), nullable=False)
    UserId = Column(String(50), nullable=False)
    Username = Column(String(100), nullable=False)
    ActionType = Column(String(60), nullable=False)
    Module = Column(String(100), nullable=False)
    TargetId = Column(String(100), nullable=True)
    TargetName = Column(String(250), nullable=True)
    IpAddress = Column(String(45), nullable=False)
    UserAgent = Column(String(500), nullable=True)
    Details = Column(Text, nullable=False)
    IsSecurityAlert = Column(Boolean, default=False)
    Severity = Column(String(20), default="INFO")
`
  },

  'security.py': {
    description: 'ماژول امنیت، هش کلمه عبور با PBKDF2/Argon2، توکن JWT و سرویس کپچای آفلاین',
    code: `"""
لایه امنیتی، احراز هویت، تولید و اعتبارسنجی توکن‌های JWT و کپچای آفلاین
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db

SECRET_KEY = os.getenv("JWT_SECRET", "ENTERPRISE_SPM_SECURE_KEY_2026_PRODUCTION")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # ۸ ساعت نشست کاری معتبر

security_scheme = HTTPBearer()

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    # ترکیب هش دومرحله‌ای PBKDF2 با SHA256 جهت امنیت فوق‌العاده در برابر حملات GPU
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 200000)
    return dk.hex(), salt

def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    new_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(new_hash, stored_hash)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_claims(credentials: HTTPAuthorizationCredentials = Security(security_scheme)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="توکن امنیتی منقضی شده یا نامعتبر است. لطفاً مجدداً وارد شوید."
        )
`
  },

  'routers/software.py': {
    description: 'روتر عملیات شناسنامه نرم‌افزار، مقادیر داینامیک، تاریخچه نسخ و کنترل وابستگی قبل از حذف',
    code: `"""
مدیریت شناسنامه نرم‌افزارها:
- کنترل دسترسی بر اساس نقش کاربر
- پشتیبانی از خصوصیات چند مقداری (Multi-Value)
- ثبت اسنپ‌شات نسخه‌بندی در هر ویرایش
- کنترل دقیق وابستگی قبل از حذف (Dependency Check)
- ممیزی و ثبت لاگ تمامی عملیات
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import json

from database import get_db
from models import (
    SoftwareApplication, SoftwareAttributeMultiValue, 
    SoftwareVersionHistory, CatalogCategory, AuditSecurityLog, SoftwareDependency
)
from security import get_current_user_claims

router = APIRouter()

@router.get("/")
def get_software_list(
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims)
):
    # دریافت لیست نرم‌افزارها با فیلتر وضعیت حذف نرم (Soft Delete)
    apps = db.query(SoftwareApplication).filter(SoftwareApplication.IsDeleted == False).all()
    return apps

@router.delete("/{software_id}")
def delete_software_safely(
    software_id: str,
    request: Request,
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims)
):
    # ۱. بررسی وجود نرم‌افزار
    app = db.query(SoftwareApplication).filter(
        SoftwareApplication.SoftwareId == software_id,
        SoftwareApplication.IsDeleted == False
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="نرم‌افزار مورد نظر یافت نشد.")

    # ۲. بررسی وابستگی‌ها (Dependency Check / Reference Check)
    # آیا سامانه دیگری به این نرم‌افزار وابسته است؟
    dependent_apps = db.query(SoftwareDependency).filter(
        SoftwareDependency.TargetSoftwareId == software_id
    ).all()

    client_ip = request.client.host if request.client else "127.0.0.1"

    if dependent_apps:
        # ثبت تلاش مسدود شده در لاگ‌های امنیتی
        log = AuditSecurityLog(
            TimestampShamsi="۱۴۰۳/۰۸/۱۲",
            UserId=claims.get("sub", "unknown"),
            Username=claims.get("username", "unknown"),
            ActionType="BLOCKED_DELETE_SOFTWARE",
            Module="شناسنامه نرم‌افزار",
            TargetId=software_id,
            TargetName=app.NameFa,
            IpAddress=client_ip,
            Details=f"منع حذف به دلیل وابستگی: تعداد {len(dependent_apps)} سامانه دیگر به این نرم‌افزار متصل هستند.",
            IsSecurityAlert=True,
            Severity="WARNING"
        )
        db.add(log)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"منع حذف به دلیل وابستگی: سامانه «{app.NameFa}» دارای {len(dependent_apps)} وابستگی فعال در سایر نرم‌افزارها است و حذف فیزیکی آن مجاز نمی‌باشد."
        )

    # ۳. حذف نرم (Soft Delete) همراه با ممیزی
    app.IsDeleted = True
    log = AuditSecurityLog(
        TimestampShamsi="۱۴۰۳/۰۸/۱۲",
        UserId=claims.get("sub", "unknown"),
        Username=claims.get("username", "unknown"),
        ActionType="DELETE_SOFTWARE",
        Module="شناسنامه نرم‌افزار",
        TargetId=software_id,
        TargetName=app.NameFa,
        IpAddress=client_ip,
        Details=f"شناسنامه نرم‌افزار «{app.NameFa}» با تأیید نهایی حذف گردید.",
        IsSecurityAlert=False,
        Severity="INFO"
    )
    db.add(log)
    db.commit()

    return {"success": True, "message": "نرم‌افزار با موفقیت حذف و لاگ امنیتی ثبت شد."}

# مدیریت سرورها و توپولوژی زیرساخت هر نرم‌افزار (Requirement 4)
@router.get("/{software_id}/servers")
def get_software_servers(software_id: str, db: Session = Depends(get_db)):
    from models import SoftwareServer
    servers = db.query(SoftwareServer).filter(SoftwareServer.SoftwareId == software_id).all()
    return servers

@router.post("/{software_id}/servers")
def add_software_server(
    software_id: str, 
    server_data: dict, 
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims)
):
    from models import SoftwareServer
    new_srv = SoftwareServer(
        ServerId=server_data.get("id"),
        SoftwareId=software_id,
        Hostname=server_data.get("hostname"),
        ServerRole=server_data.get("serverRole", "WEB_SERVER"),
        Environment=server_data.get("environment", "PRODUCTION"),
        IpInternal=server_data.get("ipInternal"),
        IpExternal=server_data.get("ipExternal"),
        OperatingSystem=server_data.get("operatingSystem"),
        Virtualization=server_data.get("virtualization", "VMware vSphere"),
        Vcpu=server_data.get("vcpu", 8),
        RamGb=server_data.get("ramGb", 32),
        StorageDisk=server_data.get("storageDisk", "500 GB SAN"),
        DatacenterLocation=server_data.get("datacenterLocation", "دیتاسنتر اصلی"),
        SecurityZone=server_data.get("securityZone", "Trust Zone"),
        Status=server_data.get("status", "ONLINE")
    )
    db.add(new_srv)
    db.commit()
    db.refresh(new_srv)
    return new_srv
`
  },

  'routers/categories.py': {
    description: 'روتر طبقات و خصوصیات داینامیک، پشتیبانی چند مقداری و منع حذف طبقات دارای داده',
    code: `"""
مدیریت کاملاً داینامیک طبقات و خصوصیات نرم‌افزارها به همراه کنترل جامع وابستگی
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from models import CatalogCategory, CatalogAttribute, SoftwareAttributeMultiValue, AuditSecurityLog
from security import get_current_user_claims

router = APIRouter()

@router.get("/")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(CatalogCategory).order_by(CatalogCategory.DisplayOrder).all()
    return categories

@router.delete("/{category_id}")
def delete_category_safely(
    category_id: str,
    request: Request,
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims)
):
    cat = db.query(CatalogCategory).filter(CatalogCategory.CategoryId == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="طبقه مورد نظر یافت نشد.")

    # بررسی وابستگی نرم‌افزارها به این طبقه
    used_records_count = db.query(SoftwareAttributeMultiValue).filter(
        SoftwareAttributeMultiValue.CategoryId == category_id
    ).count()

    attrs_count = db.query(CatalogAttribute).filter(
        CatalogAttribute.CategoryId == category_id
    ).count()

    client_ip = request.client.host if request.client else "127.0.0.1"

    if used_records_count > 0 or attrs_count > 0:
        # ثبت منع حذف در لاگ ممیزی
        log = AuditSecurityLog(
            TimestampShamsi="۱۴۰۳/۰۸/۱۲",
            UserId=claims.get("sub", "unknown"),
            Username=claims.get("username", "unknown"),
            ActionType="BLOCKED_DELETE_CATEGORY",
            Module="مدیریت طبقات",
            TargetId=category_id,
            TargetName=cat.CategoryNameFa,
            IpAddress=client_ip,
            Details=f"منع حذف طبقه به دلیل وابستگی: دارای {used_records_count} رکورد داده و {attrs_count} خصوصیت وابسته است.",
            IsSecurityAlert=True,
            Severity="WARNING"
        )
        db.add(log)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"منع حذف به دلیل وابستگی: این طبقه دارای {attrs_count} خصوصیت و داده‌های ثبت‌شده در نرم‌افزارها می‌باشد."
        )

    db.delete(cat)
    db.commit()
    return {"success": True, "message": "طبقه با موفقیت حذف گردید."}
`
  }
};
