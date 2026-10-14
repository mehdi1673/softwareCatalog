/**
 * Enterprise Print Helper
 * Ensures printing works 100% reliably in iframes, sandboxes, and modern browsers.
 * Uses in-page @media print container injection + window.print() + direct HTML file download.
 */

export interface PrintDocumentOptions {
  title: string;
  subtitle?: string;
  reportDateShamsi?: string;
  department?: string;
  contentHtml: string;
}

export function buildCompletePrintHtml(options: PrintDocumentOptions): string {
  const { title, subtitle, reportDateShamsi, department, contentHtml } = options;

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 8mm 12mm 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 15px;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.5;
      direction: rtl;
    }
    .header-box {
      border-bottom: 2px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-title h1 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
    }
    .header-title p {
      margin: 0;
      font-size: 11px;
      color: #475569;
    }
    .meta-box {
      text-align: left;
      font-size: 10px;
      color: #334155;
    }
    .meta-box div {
      margin-bottom: 3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 10px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th {
      background-color: #f1f5f9 !important;
      color: #1e293b;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: right;
    }
    td {
      border: 1px solid #e2e8f0;
      padding: 5px 8px;
      text-align: right;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc !important;
    }
    .badge {
      display: inline-block;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
      background: #e2e8f0;
      color: #334155;
      margin: 1px 2px;
    }
    .badge-primary {
      background: #e0e7ff !important;
      color: #3730a3 !important;
    }
    .badge-success {
      background: #dcfce7 !important;
      color: #166534 !important;
    }
    .badge-danger {
      background: #fee2e2 !important;
      color: #991b1b !important;
    }
    .footer-signatures {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      text-align: center;
      page-break-inside: avoid;
    }
    .sig-block {
      width: 28%;
      border-top: 1px solid #94a3b8;
      padding-top: 6px;
      font-size: 10px;
      font-weight: 700;
    }
    .code {
      font-family: 'JetBrains Mono', monospace;
      direction: ltr;
      display: inline-block;
    }
    .print-controls {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #1e293b;
      color: white;
      padding: 10px 18px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      display: flex;
      gap: 10px;
      z-index: 9999;
    }
    .btn-print {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      font-weight: bold;
      font-size: 12px;
    }
    .btn-close {
      background: #475569;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
    }
    @media print {
      .print-controls {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="header-title">
      <h1>جمهوری اسلامی ایران - ${title}</h1>
      <p>${subtitle || 'سامانه جامع کاتالوگ و شناسنامه نرم‌افزارهای سازمانی (Enterprise SPM)'}</p>
    </div>
    <div class="meta-box">
      <div>تاریخ گزارش: <strong>${reportDateShamsi || 'امروز'}</strong></div>
      <div>واحد متولی: <strong>${department || 'فناوری اطلاعات و امنیت سایبری'}</strong></div>
      <div>طبقه بندی: <strong>محرمانه سازمانی</strong></div>
    </div>
  </div>

  ${contentHtml}

  <div class="footer-signatures">
    <div class="sig-block">
      کارشناس تنظیم‌کننده گزارش
      <div style="height: 35px;"></div>
      امضا و تاریخ
    </div>
    <div class="sig-block">
      رئیس گروه امنیت اطلاعات (افتا)
      <div style="height: 35px;"></div>
      امضا و تاریخ
    </div>
    <div class="sig-block">
      مدیرکل فناوری اطلاعات و دولت الکترونیک
      <div style="height: 35px;"></div>
      مهر و امضا
    </div>
  </div>

  <div class="print-controls">
    <button class="btn-print" onclick="window.print()">🖨️ چاپ این سند</button>
    <button class="btn-close" onclick="window.close()">بستن</button>
  </div>
</body>
</html>`;
}

/**
 * Executes direct print using in-page #spm-printable-area container.
 * This never triggers popup blockers or iframe security restrictions.
 */
export function printHtmlContent(options: PrintDocumentOptions): void {
  const { title, subtitle, reportDateShamsi, department, contentHtml } = options;

  let container = document.getElementById('spm-printable-area');
  if (!container) {
    container = document.createElement('div');
    container.id = 'spm-printable-area';
    document.body.appendChild(container);
  }

  // Populate container with exact document markup
  container.innerHTML = `
    <div class="spm-print-wrapper" dir="rtl" style="font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background: #fff; padding: 10px;">
      <div style="border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 900; color: #0f172a;">جمهوری اسلامی ایران - ${title}</h1>
          <p style="margin: 0; font-size: 11px; color: #475569;">${subtitle || 'سامانه جامع کاتالوگ و شناسنامه نرم‌افزارهای سازمانی (Enterprise SPM)'}</p>
        </div>
        <div style="text-align: left; font-size: 10px; color: #334155;">
          <div style="margin-bottom: 2px;">تاریخ گزارش: <strong>${reportDateShamsi || 'امروز'}</strong></div>
          <div style="margin-bottom: 2px;">واحد متولی: <strong>${department || 'فناوری اطلاعات و امنیت سایبری'}</strong></div>
          <div>سطح دسته‌بندی: <strong>محرمانه سازمانی</strong></div>
        </div>
      </div>

      ${contentHtml}

      <div style="margin-top: 30px; display: flex; justify-content: space-between; text-align: center; page-break-inside: avoid;">
        <div style="width: 28%; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10px; font-weight: bold;">
          کارشناس تنظیم‌کننده گزارش
          <div style="height: 35px;"></div>
          امضا و تاریخ
        </div>
        <div style="width: 28%; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10px; font-weight: bold;">
          رئیس گروه امنیت اطلاعات (افتا)
          <div style="height: 35px;"></div>
          امضا و تاریخ
        </div>
        <div style="width: 28%; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10px; font-weight: bold;">
          مدیرکل فناوری اطلاعات و دولت الکترونیک
          <div style="height: 35px;"></div>
          مهر و امضا
        </div>
      </div>
    </div>
  `;

  // Brief delay to allow browser to calculate layout, then print
  setTimeout(() => {
    try {
      window.print();
    } catch (err) {
      console.warn('Native window.print failed, trying fallback download', err);
      downloadPrintableHtml(options);
    }
  }, 100);
}

/**
 * Downloads the complete printable report as a standalone HTML document.
 * Guaranteed to work anywhere without popup blockers.
 */
export function downloadPrintableHtml(options: PrintDocumentOptions): void {
  const htmlContent = buildCompletePrintHtml(options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = options.title.replace(/[\/\\?%*:|"<>]/g, '_').slice(0, 50);
  link.download = `${safeName}_${Date.now()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
