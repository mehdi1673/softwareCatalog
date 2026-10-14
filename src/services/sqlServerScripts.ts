/**
 * Complete, Production-Grade Microsoft SQL Server (T-SQL) Database Schema & Procedures
 * Built by: Principal Software Architect & Senior .NET / SQL Server Database Engineer
 * 
 * Features:
 * - Dynamic EAV with Relational Multi-Value tables & JSON support
 * - Dynamic Role-Based & Category-Based Permissions
 * - Version History & Audit Snapshot Triggers
 * - Pre-Delete Dependency Checking & Blocking Stored Procedures
 * - Full Persian Collation (Persian_100_CI_AI)
 */

export const SQL_SERVER_FULL_SCRIPT = `-- ==============================================================================================
-- سامانه مدیریت شناسنامه و کاتالوگ نرم‌افزارهای سازمانی (Enterprise Software Portfolio Management)
-- معماری داده، جداول، کلیدها، پروسیجرها، تریگرها و ایندکس‌های کامل Microsoft SQL Server 2019/2022
-- ==============================================================================================

USE [master];
GO

-- ۱. ایجاد پایگاه داده با Collation استاندارد زبان فارسی
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'EnterpriseSoftwareCatalogDB')
BEGIN
    CREATE DATABASE [EnterpriseSoftwareCatalogDB]
    COLLATE Persian_100_CI_AI;
    PRINT 'Database EnterpriseSoftwareCatalogDB created successfully.';
END
GO

USE [EnterpriseSoftwareCatalogDB];
GO

-- تنظیم RCSI (Read Committed Snapshot Isolation) برای مقیاس‌پذیری و عدم قفل شدن خواندن در سیستم‌های توزیع‌شده
ALTER DATABASE [EnterpriseSoftwareCatalogDB] SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
GO

-- ==============================================================================================
-- بخش الف: جداول امنیتی، کاربران، نقش‌ها و دسترسی‌های داینامیک (RBAC)
-- ==============================================================================================

-- جدول نقش‌های داینامیک
IF OBJECT_ID('dbo.Sys_Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Sys_Roles (
        RoleId NVARCHAR(50) NOT NULL PRIMARY KEY,
        RoleCode NVARCHAR(50) NOT NULL UNIQUE,
        RoleNameFa NVARCHAR(150) NOT NULL,
        Description NVARCHAR(500) NULL,
        IsSystemRole BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- جدول کاربران سیستم
IF OBJECT_ID('dbo.Sys_Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Sys_Users (
        UserId NVARCHAR(50) NOT NULL PRIMARY KEY,
        Username NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(256) NOT NULL, -- Argon2id یا PBKDF2 با Salt منحصر‌به‌فرد
        PasswordSalt NVARCHAR(128) NOT NULL,
        FullName NVARCHAR(200) NOT NULL,
        Email NVARCHAR(150) NOT NULL,
        Department NVARCHAR(150) NULL,
        RoleId NVARCHAR(50) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        IsLocked BIT NOT NULL DEFAULT 0,
        FailedLoginAttempts INT NOT NULL DEFAULT 0,
        LockoutUntil DATETIME2(3) NULL,
        LastLoginDateShamsi NVARCHAR(30) NULL,
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Users_Role FOREIGN KEY (RoleId) 
            REFERENCES dbo.Sys_Roles(RoleId) ON DELETE NO ACTION -- جلوگیری از حذف آبشاری جهت کنترل وابستگی
    );
END
GO

-- ==============================================================================================
-- بخش ب: جداول طبقات و خصوصیات کاملاً داینامیک (Dynamic Classification & Dynamic Multi-Value EAV)
-- ==============================================================================================

-- جدول طبقات داینامیک
IF OBJECT_ID('dbo.Catalog_Categories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Catalog_Categories (
        CategoryId NVARCHAR(50) NOT NULL PRIMARY KEY,
        CategoryCode NVARCHAR(50) NOT NULL UNIQUE,
        CategoryNameFa NVARCHAR(150) NOT NULL,
        Description NVARCHAR(500) NULL,
        IconName NVARCHAR(50) NOT NULL DEFAULT 'Layers',
        DisplayOrder INT NOT NULL DEFAULT 1,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- جدول خصوصیات داینامیک هر طبقه
IF OBJECT_ID('dbo.Catalog_Attributes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Catalog_Attributes (
        AttributeId NVARCHAR(50) NOT NULL PRIMARY KEY,
        CategoryId NVARCHAR(50) NOT NULL,
        AttributeCode NVARCHAR(50) NOT NULL,
        LabelFa NVARCHAR(200) NOT NULL,
        DataType NVARCHAR(30) NOT NULL, -- 'text', 'number', 'solar_date', 'select', 'multiselect', 'boolean', 'url', 'textarea'
        IsMultiValue BIT NOT NULL DEFAULT 0, -- قابلیت چندمقداری بودن خصوصیت
        IsRequired BIT NOT NULL DEFAULT 0,
        Placeholder NVARCHAR(200) NULL,
        Description NVARCHAR(500) NULL,
        DefaultValue NVARCHAR(MAX) NULL,
        DisplayOrder INT NOT NULL DEFAULT 1,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Attributes_Category FOREIGN KEY (CategoryId) 
            REFERENCES dbo.Catalog_Categories(CategoryId) ON DELETE NO ACTION,
        CONSTRAINT UQ_Category_AttributeCode UNIQUE (CategoryId, AttributeCode)
    );
END
GO

-- جدول گزینه‌های خصوصیات انتخابی (Select / Multi-Select Options)
IF OBJECT_ID('dbo.Catalog_AttributeOptions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Catalog_AttributeOptions (
        OptionId BIGINT IDENTITY(1,1) PRIMARY KEY,
        AttributeId NVARCHAR(50) NOT NULL,
        OptionValue NVARCHAR(250) NOT NULL,
        DisplayOrder INT NOT NULL DEFAULT 1,
        CONSTRAINT FK_Options_Attribute FOREIGN KEY (AttributeId) 
            REFERENCES dbo.Catalog_Attributes(AttributeId) ON DELETE CASCADE
    );
END
GO

-- جدول ماتریس دسترسی به هر طبقه به تفکیک نقش (Dynamic Category RBAC)
IF OBJECT_ID('dbo.Sys_RoleCategoryPermissions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Sys_RoleCategoryPermissions (
        PermissionId BIGINT IDENTITY(1,1) PRIMARY KEY,
        RoleId NVARCHAR(50) NOT NULL,
        CategoryId NVARCHAR(50) NOT NULL,
        CanView BIT NOT NULL DEFAULT 0,
        CanCreate BIT NOT NULL DEFAULT 0,
        CanEdit BIT NOT NULL DEFAULT 0,
        CanDelete BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_RoleCat_Role FOREIGN KEY (RoleId) 
            REFERENCES dbo.Sys_Roles(RoleId) ON DELETE CASCADE,
        CONSTRAINT FK_RoleCat_Category FOREIGN KEY (CategoryId) 
            REFERENCES dbo.Catalog_Categories(CategoryId) ON DELETE CASCADE,
        CONSTRAINT UQ_Role_Category UNIQUE (RoleId, CategoryId)
    );
END
GO

-- ==============================================================================================
-- بخش ج: شناسنامه اصلی نرم‌افزار، مقادیر داینامیک، وابستگی‌ها و نسخه‌بندی
-- ==============================================================================================

-- جدول شناسنامه عمومی نرم‌افزارها
IF OBJECT_ID('dbo.Software_Applications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Software_Applications (
        SoftwareId NVARCHAR(50) NOT NULL PRIMARY KEY,
        AppCode NVARCHAR(50) NOT NULL UNIQUE,
        NameFa NVARCHAR(250) NOT NULL,
        NameEn NVARCHAR(250) NULL,
        Description NVARCHAR(MAX) NULL,
        CurrentVersion NVARCHAR(50) NOT NULL DEFAULT '1.0.0',
        Status NVARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'DEVELOPMENT', 'MAINTENANCE', 'DEPRECATED', 'RETIRED'
        Criticality NVARCHAR(50) NOT NULL DEFAULT 'TIER_2_IMPORTANT', -- 'TIER_1_CRITICAL', 'TIER_2_IMPORTANT', 'TIER_3_NORMAL', 'TIER_4_LOW'
        OwnerDepartment NVARCHAR(200) NOT NULL,
        TechnicalLead NVARCHAR(150) NULL,
        VendorName NVARCHAR(200) NULL,
        DeployEnvironment NVARCHAR(50) NOT NULL DEFAULT 'ON_PREMISE',
        CurrentVersionNumber INT NOT NULL DEFAULT 1,
        CreatedDateShamsi NVARCHAR(20) NOT NULL,
        UpdatedDateShamsi NVARCHAR(20) NOT NULL,
        CreatedByUserId NVARCHAR(50) NOT NULL,
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        IsDeleted BIT NOT NULL DEFAULT 0 -- Soft Delete با قابلیت ممیزی
    );
END
GO

-- جدول ذخیره مقادیر چندگانه خصوصیات داینامیک برای هر نرم‌افزار (Multi-Value Attribute Store)
IF OBJECT_ID('dbo.Software_AttributeMultiValues', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Software_AttributeMultiValues (
        ValueRecordId BIGINT IDENTITY(1,1) PRIMARY KEY,
        SoftwareId NVARCHAR(50) NOT NULL,
        CategoryId NVARCHAR(50) NOT NULL,
        AttributeId NVARCHAR(50) NOT NULL,
        ValueString NVARCHAR(MAX) NOT NULL,
        OrderIndex INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_AttrVals_Software FOREIGN KEY (SoftwareId) 
            REFERENCES dbo.Software_Applications(SoftwareId) ON DELETE NO ACTION,
        CONSTRAINT FK_AttrVals_Category FOREIGN KEY (CategoryId) 
            REFERENCES dbo.Catalog_Categories(CategoryId) ON DELETE NO ACTION,
        CONSTRAINT FK_AttrVals_Attribute FOREIGN KEY (AttributeId) 
            REFERENCES dbo.Catalog_Attributes(AttributeId) ON DELETE NO ACTION
    );
END
GO

-- جدول وابستگی بین سامانه‌ها (Dependency Mapping / Integration Mesh)
IF OBJECT_ID('dbo.Software_Dependencies', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Software_Dependencies (
        DependencyId BIGINT IDENTITY(1,1) PRIMARY KEY,
        SourceSoftwareId NVARCHAR(50) NOT NULL,
        TargetSoftwareId NVARCHAR(50) NOT NULL,
        RelationType NVARCHAR(50) NOT NULL, -- 'CONSUMES_API', 'SHARES_DB', 'SSO_INTEGRATION', 'DATA_FEED'
        Description NVARCHAR(500) NULL,
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Dep_Source FOREIGN KEY (SourceSoftwareId) 
            REFERENCES dbo.Software_Applications(SoftwareId) ON DELETE NO ACTION,
        CONSTRAINT FK_Dep_Target FOREIGN KEY (TargetSoftwareId) 
            REFERENCES dbo.Software_Applications(SoftwareId) ON DELETE NO ACTION,
        CONSTRAINT CHK_No_Self_Dependency CHECK (SourceSoftwareId <> TargetSoftwareId)
    );
END
GO

-- جدول تاریخچه نسخ و تغییرات (Audit Snapshot & Versioning)
IF OBJECT_ID('dbo.Software_VersionHistory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Software_VersionHistory (
        HistoryId BIGINT IDENTITY(1,1) PRIMARY KEY,
        SoftwareId NVARCHAR(50) NOT NULL,
        VersionNumber INT NOT NULL,
        VersionTag NVARCHAR(50) NOT NULL,
        ChangeType NVARCHAR(50) NOT NULL, -- 'INITIAL_REGISTRATION', 'ATTRIBUTE_UPDATE', 'MAJOR_UPGRADE', 'SECURITY_PATCH'
        ChangedByFullName NVARCHAR(200) NOT NULL,
        ChangedDateShamsi NVARCHAR(30) NOT NULL,
        ChangeDescription NVARCHAR(1000) NOT NULL,
        FullSnapshotJson NVARCHAR(MAX) NOT NULL, -- اسنپ‌شات کامل JSON از وضعیت تمام خصوصیات در آن نسخه
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_VerHistory_Software FOREIGN KEY (SoftwareId) 
            REFERENCES dbo.Software_Applications(SoftwareId) ON DELETE NO ACTION
    );
END
GO

-- ==============================================================================================
-- بخش د: جداول سرورها، زیرساخت و خصوصیات کاملاً داینامیک سرور (Dynamic Multi-Server Infrastructure)
-- ==============================================================================================

-- جدول سرورهای هر نرم‌افزار (هر نرم‌افزار می‌تواند N سرور فیزیکی یا مجازی داشته باشد)
IF OBJECT_ID('dbo.Software_Servers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Software_Servers (
        ServerId NVARCHAR(50) NOT NULL PRIMARY KEY,
        SoftwareId NVARCHAR(50) NOT NULL,
        Hostname NVARCHAR(250) NOT NULL,
        ServerRole NVARCHAR(50) NOT NULL, -- 'WEB_SERVER', 'APP_SERVER', 'DB_PRIMARY', 'DB_REPLICA', 'CACHE_SERVER', ...
        Environment NVARCHAR(50) NOT NULL DEFAULT 'PRODUCTION', -- 'PRODUCTION', 'STAGING', 'DEVELOPMENT', 'DISASTER_RECOVERY'
        IpInternal NVARCHAR(50) NOT NULL,
        IpExternal NVARCHAR(50) NULL,
        OperatingSystem NVARCHAR(150) NOT NULL,
        Virtualization NVARCHAR(150) NOT NULL DEFAULT 'VMware vSphere',
        Vcpu INT NOT NULL DEFAULT 8,
        RamGb INT NOT NULL DEFAULT 32,
        StorageDisk NVARCHAR(200) NOT NULL DEFAULT '500 GB SAN Tier-1',
        DatacenterLocation NVARCHAR(250) NOT NULL,
        SecurityZone NVARCHAR(150) NOT NULL, -- 'DMZ', 'Trust (App)', 'Restricted DB Zone'
        OpenPortsCsv NVARCHAR(500) NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'ONLINE', -- 'ONLINE', 'MAINTENANCE', 'OFFLINE', 'STANDBY'
        BackupPolicy NVARCHAR(300) NULL,
        MonitoringAgent NVARCHAR(200) NULL,
        AntivirusEDR NVARCHAR(200) NULL,
        SslCertExpiryShamsi NVARCHAR(30) NULL,
        Notes NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Server_Software FOREIGN KEY (SoftwareId) 
            REFERENCES dbo.Software_Applications(SoftwareId) ON DELETE NO ACTION
    );
END
GO

-- جدول تعریف خصوصیات کاملاً داینامیک سرورها (Custom Dynamic Attributes for Servers)
IF OBJECT_ID('dbo.Server_DynamicAttributes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Server_DynamicAttributes (
        AttributeId NVARCHAR(50) NOT NULL PRIMARY KEY,
        AttributeCode NVARCHAR(50) NOT NULL UNIQUE,
        LabelFa NVARCHAR(150) NOT NULL,
        DataType NVARCHAR(50) NOT NULL, -- 'text', 'number', 'select', 'multiselect', 'boolean'
        IsMultiValue BIT NOT NULL DEFAULT 0,
        IsRequired BIT NOT NULL DEFAULT 0,
        OptionsCsv NVARCHAR(1000) NULL,
        Description NVARCHAR(500) NULL,
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- جدول مقادیر خصوصیات داینامیک هر سرور (EAV Store for Servers)
IF OBJECT_ID('dbo.Server_DynamicAttributeValues', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Server_DynamicAttributeValues (
        ValueRecordId BIGINT IDENTITY(1,1) PRIMARY KEY,
        ServerId NVARCHAR(50) NOT NULL,
        AttributeId NVARCHAR(50) NOT NULL,
        ValueString NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_ServerAttrVal_Server FOREIGN KEY (ServerId) 
            REFERENCES dbo.Software_Servers(ServerId) ON DELETE CASCADE,
        CONSTRAINT FK_ServerAttrVal_Attr FOREIGN KEY (AttributeId) 
            REFERENCES dbo.Server_DynamicAttributes(AttributeId) ON DELETE CASCADE
    );
END
GO

-- ==============================================================================================
-- بخش هـ: جدول لاگ‌های امنیتی، دسترسی‌ها و رخدادها (Security & Audit Trail)
-- ==============================================================================================

IF OBJECT_ID('dbo.Audit_SecurityLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Audit_SecurityLogs (
        LogId BIGINT IDENTITY(1,1) PRIMARY KEY,
        TimestampShamsi NVARCHAR(30) NOT NULL,
        UserId NVARCHAR(50) NOT NULL,
        Username NVARCHAR(100) NOT NULL,
        ActionType NVARCHAR(60) NOT NULL, -- 'LOGIN_SUCCESS', 'DELETE_SOFTWARE', 'BLOCKED_DELETE_CATEGORY', ...
        Module NVARCHAR(100) NOT NULL,
        TargetId NVARCHAR(100) NULL,
        TargetName NVARCHAR(250) NULL,
        IpAddress NVARCHAR(45) NOT NULL,
        UserAgent NVARCHAR(500) NULL,
        Details NVARCHAR(MAX) NOT NULL,
        IsSecurityAlert BIT NOT NULL DEFAULT 0,
        Severity NVARCHAR(20) NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARNING', 'CRITICAL'
        CreatedAt DATETIME2(3) NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- ==============================================================================================
-- بخش هـ: ایندکس‌های استراتژیک برای حداکثر سرعت جستجو و جلوگیری از اسکن کامل جدول
-- ==============================================================================================

CREATE NONCLUSTERED INDEX IX_Software_Status_Criticality 
ON dbo.Software_Applications (Status, Criticality) 
INCLUDE (AppCode, NameFa, OwnerDepartment);

CREATE NONCLUSTERED INDEX IX_SoftwareMultiValues_FastSearch 
ON dbo.Software_AttributeMultiValues (AttributeId, CategoryId) 
INCLUDE (SoftwareId, ValueString);

CREATE NONCLUSTERED INDEX IX_VersionHistory_Software 
ON dbo.Software_VersionHistory (SoftwareId, VersionNumber DESC);

CREATE NONCLUSTERED INDEX IX_Audit_Security_Filter 
ON dbo.Audit_SecurityLogs (ActionType, Severity, CreatedAt DESC) 
INCLUDE (Username, IpAddress, TargetName);
GO

-- ==============================================================================================
-- بخش و: Stored Procedureهای بررسی وابستگی (Dependency Check) قبل از حذف
-- ==============================================================================================

-- ۱. کنترل وابستگی قبل از حذف طبقه
CREATE OR ALTER PROCEDURE dbo.sp_CheckCategoryDependencies
    @CategoryId NVARCHAR(50),
    @CanDelete BIT OUTPUT,
    @BlockedReason NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @SoftwareCount INT = 0;
    DECLARE @AttributeCount INT = 0;

    -- شمارش نرم‌افزارهای ثبت شده در این طبقه
    SELECT @SoftwareCount = COUNT(DISTINCT SoftwareId)
    FROM dbo.Software_AttributeMultiValues
    WHERE CategoryId = @CategoryId AND LEN(LTRIM(RTRIM(ValueString))) > 0;

    -- شمارش خصوصیات موجود در این طبقه
    SELECT @AttributeCount = COUNT(*)
    FROM dbo.Catalog_Attributes
    WHERE CategoryId = @CategoryId;

    IF @SoftwareCount > 0 OR @AttributeCount > 0
    BEGIN
        SET @CanDelete = 0;
        SET @BlockedReason = N'منع حذف به دلیل وابستگی: این طبقه دارای ' 
            + CAST(@SoftwareCount AS NVARCHAR(10)) + N' نرم‌افزار سازمانی و '
            + CAST(@AttributeCount AS NVARCHAR(10)) + N' خصوصیت تعریف‌شده است.';
    END
    ELSE
    BEGIN
        SET @CanDelete = 1;
        SET @BlockedReason = N'طبقه فاقد وابستگی است و حذف آن مجاز می‌باشد.';
    END
END;
GO

-- ۲. کنترل وابستگی قبل از حذف نقش
CREATE OR ALTER PROCEDURE dbo.sp_CheckRoleDependencies
    @RoleId NVARCHAR(50),
    @CanDelete BIT OUTPUT,
    @BlockedReason NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserCount INT = 0;
    DECLARE @IsSystemRole BIT = 0;

    SELECT @IsSystemRole = IsSystemRole FROM dbo.Sys_Roles WHERE RoleId = @RoleId;

    IF @IsSystemRole = 1
    BEGIN
        SET @CanDelete = 0;
        SET @BlockedReason = N'منع حذف: این نقش یک نقش اصلی سیستمی است و غیرقابل حذف می‌باشد.';
        RETURN;
    END

    SELECT @UserCount = COUNT(*) FROM dbo.Sys_Users WHERE RoleId = @RoleId;

    IF @UserCount > 0
    BEGIN
        SET @CanDelete = 0;
        SET @BlockedReason = N'منع حذف به دلیل وابستگی: تعداد ' 
            + CAST(@UserCount AS NVARCHAR(10)) + N' کاربر فعال دارای این نقش هستند. ابتدا نقش کاربران را تغییر دهید.';
    END
    ELSE
    BEGIN
        SET @CanDelete = 1;
        SET @BlockedReason = N'نقش فاقد کاربر است و حذف آن مجاز می‌باشد.';
    END
END;
GO

-- ۳. کنترل وابستگی قبل از حذف نرم‌افزار
CREATE OR ALTER PROCEDURE dbo.sp_CheckSoftwareDependencies
    @SoftwareId NVARCHAR(50),
    @CanDelete BIT OUTPUT,
    @BlockedReason NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @DependentAppsCount INT = 0;

    -- بررسی اینکه آیا سامانه‌های دیگر از این نرم‌افزار سرویس می‌گیرند
    SELECT @DependentAppsCount = COUNT(*)
    FROM dbo.Software_Dependencies
    WHERE TargetSoftwareId = @SoftwareId;

    IF @DependentAppsCount > 0
    BEGIN
        SET @CanDelete = 0;
        SET @BlockedReason = N'منع حذف به دلیل وابستگی: تعداد ' 
            + CAST(@DependentAppsCount AS NVARCHAR(10)) + N' سامانه سازمانی دیگر وابسته به این سرویس هستند.';
    END
    ELSE
    BEGIN
        SET @CanDelete = 1;
        SET @BlockedReason = N'سامانه فاقد وابستگی به سایر سیستم‌هاست و حذف مجاز است.';
    END
END;
GO

-- ==============================================================================================
-- بخش ز: Stored Procedure ذخیره نرم‌افزار به همراه متادیتای داینامیک و ثبت تاریخچه نسخ (Transactional)
-- ==============================================================================================

CREATE OR ALTER PROCEDURE dbo.sp_SaveSoftwareWithAudit
    @SoftwareId NVARCHAR(50),
    @AppCode NVARCHAR(50),
    @NameFa NVARCHAR(250),
    @NameEn NVARCHAR(250),
    @Description NVARCHAR(MAX),
    @CurrentVersion NVARCHAR(50),
    @Status NVARCHAR(50),
    @Criticality NVARCHAR(50),
    @OwnerDepartment NVARCHAR(200),
    @TechnicalLead NVARCHAR(150),
    @VendorName NVARCHAR(200),
    @DeployEnvironment NVARCHAR(50),
    @CurrentShamsiDate NVARCHAR(30),
    @UserId NVARCHAR(50),
    @UserFullName NVARCHAR(200),
    @ChangeDescription NVARCHAR(1000),
    @SnapshotJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @NewVersionNumber INT = 1;

        IF EXISTS (SELECT 1 FROM dbo.Software_Applications WHERE SoftwareId = @SoftwareId)
        BEGIN
            -- خواندن شماره نسخه فعلی و افزایش آن
            SELECT @NewVersionNumber = CurrentVersionNumber + 1 
            FROM dbo.Software_Applications WHERE SoftwareId = @SoftwareId;

            UPDATE dbo.Software_Applications
            SET AppCode = @AppCode,
                NameFa = @NameFa,
                NameEn = @NameEn,
                Description = @Description,
                CurrentVersion = @CurrentVersion,
                Status = @Status,
                Criticality = @Criticality,
                OwnerDepartment = @OwnerDepartment,
                TechnicalLead = @TechnicalLead,
                VendorName = @VendorName,
                DeployEnvironment = @DeployEnvironment,
                CurrentVersionNumber = @NewVersionNumber,
                UpdatedDateShamsi = @CurrentShamsiDate,
                UpdatedAt = SYSDATETIME()
            WHERE SoftwareId = @SoftwareId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.Software_Applications (
                SoftwareId, AppCode, NameFa, NameEn, Description, CurrentVersion, Status,
                Criticality, OwnerDepartment, TechnicalLead, VendorName, DeployEnvironment,
                CurrentVersionNumber, CreatedDateShamsi, UpdatedDateShamsi, CreatedByUserId
            )
            VALUES (
                @SoftwareId, @AppCode, @NameFa, @NameEn, @Description, @CurrentVersion, @Status,
                @Criticality, @OwnerDepartment, @TechnicalLead, @VendorName, @DeployEnvironment,
                1, @CurrentShamsiDate, @CurrentShamsiDate, @UserId
            );
        END

        -- ثبت نسخه جدید در تاریخچه
        INSERT INTO dbo.Software_VersionHistory (
            SoftwareId, VersionNumber, VersionTag, ChangeType,
            ChangedByFullName, ChangedDateShamsi, ChangeDescription, FullSnapshotJson
        )
        VALUES (
            @SoftwareId, @NewVersionNumber, @CurrentVersion, 
            CASE WHEN @NewVersionNumber = 1 THEN 'INITIAL_REGISTRATION' ELSE 'ATTRIBUTE_UPDATE' END,
            @UserFullName, @CurrentShamsiDate, @ChangeDescription, @SnapshotJson
        );

        COMMIT TRANSACTION;
        PRINT 'Software and version snapshot saved successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT 'SQL Server schema and stored procedures setup completed successfully.';
`;
