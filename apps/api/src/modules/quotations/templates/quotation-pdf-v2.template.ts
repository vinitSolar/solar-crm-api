import type { IQuotationPdfData } from './quotation-pdf.template.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedCoverBgBase64: string | null = null;
let cachedCoverLogoBase64: string | null = null;
let cachedOtherPagesLogoBase64: string | null = null;
let cachedWhiteLogoBase64: string | null = null;
let cachedWelcomeHouseBase64: string | null = null;
let cachedWatermarkLogoBase64: string | null = null;
let cachedPaybackIconBase64: string | null = null;
let cachedAvgYearlyIconBase64: string | null = null;
let cachedAvgAnnualIconBase64: string | null = null;
let cachedProjectCostIconBase64: string | null = null;
let cachedTreeSavedIconBase64: string | null = null;
let cachedCo2IconBase64: string | null = null;
let cachedManImageBase64: string | null = null;

function loadAssetBase64(fileName: string): string {
  const candidates = [
    path.resolve(__dirname, '../assets/Images', fileName),
    path.resolve(__dirname, '../../../../apps/api/src/modules/quotations/assets/Images', fileName),
    path.join(process.cwd(), 'apps/api/src/modules/quotations/assets/Images', fileName),
    path.join(process.cwd(), 'src/modules/quotations/assets/Images', fileName)
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        const buffer = fs.readFileSync(filePath);
        let mime = 'image/png';
        if (buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
          mime = 'image/jpeg';
        } else if (buffer.length > 3 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46) {
          mime = 'image/webp';
        }
        return `data:${mime};base64,${buffer.toString('base64')}`;
      } catch {
        // Ignore and try next
      }
    }
  }
  return '';
}

let cachedFontFacesCss: string | null = null;

function loadFontBase64(fileName: string): string {
  const candidates = [
    path.resolve(__dirname, '../assets/Fonts', fileName),
    path.resolve(__dirname, '../../../../apps/api/src/modules/quotations/assets/Fonts', fileName),
    path.join(process.cwd(), 'apps/api/src/modules/quotations/assets/Fonts', fileName),
    path.join(process.cwd(), 'src/modules/quotations/assets/Fonts', fileName)
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(fileName).toLowerCase();
        const mime = ext === '.otf' ? 'font/otf' : 'font/ttf';
        const format = ext === '.otf' ? 'opentype' : 'truetype';
        return `url('data:${mime};charset=utf-8;base64,${buffer.toString('base64')}') format('${format}')`;
      } catch {
        // Ignore and try next
      }
    }
  }
  return '';
}

function getFontFacesCss(): string {
  if (cachedFontFacesCss !== null) {
    return cachedFontFacesCss;
  }

  const arialExtraBold = loadFontBase64('ARIALMTEXTRABOLD.TTF');
  const arialLight = loadFontBase64('ARIALMTLIGHT.TTF');
  const arialMedium = loadFontBase64('ARIALMTMEDIUM.TTF');
  const gilroyBold = loadFontBase64('Gilroy-Bold.ttf');
  const myriadPro = loadFontBase64('MyriadPro-Regular.otf');
  const quicksandBold = loadFontBase64('Quicksand_Bold.otf');
  const microsoftSansSerif = loadFontBase64('micross.ttf');

  const faces: string[] = [];

  if (gilroyBold) {
    faces.push(`
      @font-face {
        font-family: 'Gilroy';
        src: ${gilroyBold};
        font-weight: 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Gilroy';
        src: ${gilroyBold};
        font-weight: 800;
        font-style: normal;
      }
      @font-face {
        font-family: 'Gilroy-Bold';
        src: ${gilroyBold};
        font-weight: normal;
        font-style: normal;
      }
    `);
  }

  if (quicksandBold) {
    faces.push(`
      @font-face {
        font-family: 'Quicksand';
        src: ${quicksandBold};
        font-weight: 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Quicksand-Bold';
        src: ${quicksandBold};
        font-weight: normal;
        font-style: normal;
      }
    `);
  }

  if (myriadPro) {
    faces.push(`
      @font-face {
        font-family: 'Myriad Pro';
        src: ${myriadPro};
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'MyriadPro';
        src: ${myriadPro};
        font-weight: 400;
        font-style: normal;
      }
    `);
  }

  if (microsoftSansSerif) {
    faces.push(`
      @font-face {
        font-family: 'Microsoft Sans Serif';
        src: ${microsoftSansSerif};
        font-weight: 400;
        font-style: normal;
      }
    `);
  }

  if (arialLight) {
    faces.push(`
      @font-face {
        font-family: 'Arial MT';
        src: ${arialLight};
        font-weight: 300;
        font-style: normal;
      }
      @font-face {
        font-family: 'ArialMT-Light';
        src: ${arialLight};
        font-weight: normal;
        font-style: normal;
      }
    `);
  }

  if (arialMedium) {
    faces.push(`
      @font-face {
        font-family: 'Arial MT';
        src: ${arialMedium};
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'Arial MT';
        src: ${arialMedium};
        font-weight: 500;
        font-style: normal;
      }
      @font-face {
        font-family: 'ArialMT-Medium';
        src: ${arialMedium};
        font-weight: normal;
        font-style: normal;
      }
    `);
  }

  if (arialExtraBold) {
    faces.push(`
      @font-face {
        font-family: 'Arial MT';
        src: ${arialExtraBold};
        font-weight: 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Arial MT';
        src: ${arialExtraBold};
        font-weight: 800;
        font-style: normal;
      }
      @font-face {
        font-family: 'ArialMT-ExtraBold';
        src: ${arialExtraBold};
        font-weight: normal;
        font-style: normal;
      }
    `);
  }

  cachedFontFacesCss = faces.join('\n');
  return cachedFontFacesCss;
}

function getCoverBgBase64(): string {
  if (!cachedCoverBgBase64) {
    cachedCoverBgBase64 = loadAssetBase64('acb1fba6-e84b-48cb-b2e7-467e6197cdaa.png');
  }
  return cachedCoverBgBase64;
}

function getCoverLogoBase64(): string {
  if (!cachedCoverLogoBase64) {
    cachedCoverLogoBase64 = loadAssetBase64('Asset 1@2x-8.png');
  }
  return cachedCoverLogoBase64;
}

function getOtherPagesLogoBase64(): string {
  if (!cachedOtherPagesLogoBase64) {
    cachedOtherPagesLogoBase64 = loadAssetBase64('Asset 1@2x-8.png');
  }
  return cachedOtherPagesLogoBase64;
}

function getWhiteLogoBase64(): string {
  if (!cachedWhiteLogoBase64) {
    cachedWhiteLogoBase64 = loadAssetBase64('Logo---Sunselect---White.png');
  }
  return cachedWhiteLogoBase64;
}

function getWelcomeHouseBase64(): string {
  if (!cachedWelcomeHouseBase64) {
    cachedWelcomeHouseBase64 = loadAssetBase64('ChatGPT Image Sep 2, 2026, 07_59_37 AM.png');
  }
  return cachedWelcomeHouseBase64;
}

function getWatermarkLogoBase64(): string {
  if (!cachedWatermarkLogoBase64) {
    cachedWatermarkLogoBase64 = loadAssetBase64('Asset 11@2x-8.png');
  }
  return cachedWatermarkLogoBase64;
}

function getPaybackIconBase64(): string {
  if (!cachedPaybackIconBase64) {
    cachedPaybackIconBase64 = loadAssetBase64('payback.png');
  }
  return cachedPaybackIconBase64;
}

function getAvgYearlyIconBase64(): string {
  if (!cachedAvgYearlyIconBase64) {
    cachedAvgYearlyIconBase64 = loadAssetBase64('avgyearly.png');
  }
  return cachedAvgYearlyIconBase64;
}

function getAvgAnnualIconBase64(): string {
  if (!cachedAvgAnnualIconBase64) {
    cachedAvgAnnualIconBase64 = loadAssetBase64('avganual.png');
  }
  return cachedAvgAnnualIconBase64;
}

function getProjectCostIconBase64(): string {
  if (!cachedProjectCostIconBase64) {
    cachedProjectCostIconBase64 = loadAssetBase64('project cost.png');
  }
  return cachedProjectCostIconBase64;
}

function getTreeSavedIconBase64(): string {
  if (!cachedTreeSavedIconBase64) {
    cachedTreeSavedIconBase64 = loadAssetBase64('tree saved.png');
  }
  return cachedTreeSavedIconBase64;
}

function getCo2IconBase64(): string {
  if (!cachedCo2IconBase64) {
    cachedCo2IconBase64 = loadAssetBase64('co2.png');
  }
  return cachedCo2IconBase64;
}

function getManImageBase64(): string {
  if (!cachedManImageBase64) {
    cachedManImageBase64 = loadAssetBase64('man.png');
  }
  return cachedManImageBase64;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Monthly solar generation yield factors (kWh / kW capacity / month) in India:
const MONTHLY_YIELD_FACTORS = [115.8, 117.8, 153.3, 154.8, 160.3, 117.2, 93.7, 93.7, 112.5, 126.3, 111.0, 103.5];

function calculateMonthlySolarData(systemCapacity: number) {
  const monthlyValues = MONTHLY_YIELD_FACTORS.map(factor => Math.round(systemCapacity * factor));
  const annualGeneration = monthlyValues.reduce((sum, val) => sum + val, 0);

  return {
    months: MONTH_NAMES,
    monthlyValues,
    annualGeneration
  };
}

function generateMonthlyChartSvg(months: string[], monthlyValues: number[]): string {
  const maxVal = Math.max(...monthlyValues, 100);
  const roughStep = maxVal / 4;
  const tickStep = Math.ceil(roughStep / 50) * 50 || 100;
  const yMax = tickStep * 4;
  const yTicks = [0, tickStep, tickStep * 2, tickStep * 3, yMax];

  const svgWidth = 660;
  const svgHeight = 430;
  const padLeft = 46;
  const padRight = 14;
  const padTop = 32;
  const padBottom = 54;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;
  const slotW = plotW / 12;
  const barW = slotW * 0.76;

  const vertGridLinesHtml = monthlyValues.map((_, i) => {
    const x = padLeft + (i + 0.5) * slotW;
    return `<line x1="${x.toFixed(1)}" y1="${padTop}" x2="${x.toFixed(1)}" y2="${padTop + plotH}" stroke="#E5E7EB" stroke-width="1" />`;
  }).join('');

  const gridLinesHtml = yTicks.map(tick => {
    const y = padTop + plotH - (tick / yMax) * plotH;
    return `
      <line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${(padLeft + plotW).toFixed(1)}" y2="${y.toFixed(1)}" stroke="#E5E7EB" stroke-width="1" />
      <text x="${padLeft - 9}" y="${(y + 3.5).toFixed(1)}" fill="#333333" font-size="10.5" font-weight="500" text-anchor="end" font-family="'Arial MT', 'Myriad Pro', sans-serif">${tick}</text>
      <line x1="${padLeft - 4}" y1="${y.toFixed(1)}" x2="${padLeft}" y2="${y.toFixed(1)}" stroke="#333333" stroke-width="1.2" />
    `;
  }).join('');

  const barsHtml = monthlyValues.map((val, i) => {
    const barH = Math.max(4, (val / yMax) * plotH);
    const x = padLeft + i * slotW + (slotW - barW) / 2;
    const y = padTop + plotH - barH;
    const centerX = x + barW / 2;

    return `
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" fill="#000000" rx="1.5" />
      <text x="${centerX.toFixed(1)}" y="${(y - 7).toFixed(1)}" fill="#E31E24" font-size="11.5" font-weight="700" text-anchor="middle" font-family="'Gilroy', 'Arial MT', sans-serif">${val}</text>
      <text x="${centerX.toFixed(1)}" y="${(padTop + plotH + 20).toFixed(1)}" fill="#222222" font-size="11" font-weight="600" text-anchor="middle" font-family="'Arial MT', 'Myriad Pro', sans-serif">${months[i]}</text>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
      ${vertGridLinesHtml}
      ${gridLinesHtml}
      <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${padTop + plotH}" stroke="#333333" stroke-width="1.2" />
      <line x1="${padLeft}" y1="${padTop + plotH}" x2="${padLeft + plotW}" y2="${padTop + plotH}" stroke="#333333" stroke-width="1.2" />
      <line x1="${padLeft + plotW}" y1="${padTop}" x2="${padLeft + plotW}" y2="${padTop + plotH}" stroke="#E5E7EB" stroke-width="1" />
      <line x1="${padLeft}" y1="${padTop}" x2="${padLeft + plotW}" y2="${padTop}" stroke="#E5E7EB" stroke-width="1" />
      <text transform="rotate(-90)" x="${-(padTop + plotH / 2)}" y="12" fill="#111827" font-size="12" font-weight="700" text-anchor="middle" font-family="'Gilroy', 'Arial MT', sans-serif">Generation</text>
      <text x="${padLeft + plotW / 2}" y="${svgHeight - 8}" fill="#111827" font-size="12" font-weight="700" text-anchor="middle" font-family="'Gilroy', 'Arial MT', sans-serif">Months</text>
      ${barsHtml}
    </svg>
  `;
}

function formatINR(amount: number): string {
  return "₹" + Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function generateQuotationHtmlV2(data: IQuotationPdfData): string {
  const { franchise, customer, quotation, items, scopeOfWork, termsConditions, subsidy } = data;

  const coverBgBase64 = getCoverBgBase64();
  const coverLogoBase64 = getCoverLogoBase64();
  const otherPagesLogoBase64 = getOtherPagesLogoBase64();
  const whiteLogoBase64 = getWhiteLogoBase64();
  const welcomeHouseBase64 = getWelcomeHouseBase64();
  const watermarkLogoBase64 = getWatermarkLogoBase64();

  const footerLogoHtml = whiteLogoBase64
    ? `<img src="${whiteLogoBase64}" alt="Sunselect" class="footer-logo" />`
    : (coverLogoBase64 ? `<img src="${coverLogoBase64}" alt="Sunselect" class="footer-logo" />` : 'Sunselect');

  // Logo for page 2+: Always use Asset 1@2x-8.png
  const page2LogoHtml = otherPagesLogoBase64
    ? `<img src="${otherPagesLogoBase64}" alt="Sunselect Solar" class="page-top-logo" />`
    : (franchise.logo ? `<img src="${franchise.logo}" alt="${franchise.name}" class="page-top-logo" />` : `<div class="logo-slot">${franchise.name.substring(0, 2).toUpperCase()}</div>`);

  // Build items rows matching the requested 8-column table structure
  let itemsHtml = "";
  let itemIndex = 1;

  if (quotation.packageName) {
    const packageItems = items.filter(i => !i.isExtra);
    const extraItems = items.filter(i => i.isExtra);
    const packageLineTotal = packageItems.reduce((sum, i) => sum + i.lineTotal, 0);

    itemsHtml += `
            <tr>
                <td class="col-sno">${itemIndex++}</td>
                <td class="col-desc">
                    <div class="item-title">${quotation.packageName}</div>
                    ${quotation.packageDescription ? `<div class="item-subdesc">${quotation.packageDescription}</div>` : ""}
                </td>
                <td class="col-brand">Solar Package</td>
                <td class="col-qty">1</td>
                <td class="col-unit">Set</td>
                <td class="col-rate">${formatINR(packageLineTotal)}</td>
                <td class="col-gst">${quotation.packageGst ? `${quotation.packageGst}%` : "-"}</td>
                <td class="col-total">${formatINR(packageLineTotal)}</td>
            </tr>
        `;

    extraItems.forEach(item => {
      itemsHtml += `
            <tr>
                <td class="col-sno">${itemIndex++}</td>
                <td class="col-desc">
                    <div class="item-title">${item.productName}</div>
                    ${item.description ? `<div class="item-subdesc">${item.description}</div>` : ""}
                </td>
                <td class="col-brand">${item.brandName || "-"}</td>
                <td class="col-qty">${item.quantity}</td>
                <td class="col-unit">${item.unitName || "Nos"}</td>
                <td class="col-rate">${formatINR(item.pricePerUnit)}</td>
                <td class="col-gst">${item.gstPercentage ? `${item.gstPercentage}%` : "-"}</td>
                <td class="col-total">${formatINR(item.lineTotal)}</td>
            </tr>
            `;
    });
  } else {
    itemsHtml = items.map((item) => `
            <tr>
                <td class="col-sno">${itemIndex++}</td>
                <td class="col-desc">
                    <div class="item-title">${item.productName}</div>
                    ${item.description ? `<div class="item-subdesc">${item.description}</div>` : ""}
                </td>
                <td class="col-brand">${item.brandName || "-"}</td>
                <td class="col-qty">${item.quantity}</td>
                <td class="col-unit">${item.unitName || "Nos"}</td>
                <td class="col-rate">${formatINR(item.pricePerUnit)}</td>
                <td class="col-gst">${item.gstPercentage ? `${item.gstPercentage}%` : "-"}</td>
                <td class="col-total">${formatINR(item.lineTotal)}</td>
            </tr>
        `).join("");
  }

  let subsidyRowsHtml = "";
  if (subsidy && subsidy.showSubsidy) {
    subsidyRowsHtml = subsidy.subsidyData.map(sub => `
        <tr class="calc-row subsidy-row">
            <td colspan="4" class="calc-blank"></td>
            <td colspan="3" class="calc-label">Less: ${sub.name}</td>
            <td class="calc-value discount-text">- ${formatINR(sub.amount)}</td>
        </tr>
        `).join("") + `
        <tr class="calc-row net-cost-row">
            <td colspan="4" class="calc-blank"></td>
            <td colspan="3" class="calc-label">Net Customer Cost</td>
            <td class="calc-value">${formatINR(subsidy.netCustomerCost)}</td>
        </tr>
        `;
  }

  // Build Bill of Materials (BOM) rows for Page 4 - lists all package items + extra items
  const bomRowsHtml = items.map((item, idx) => `
    <tr>
      <td class="bom-col-sno">${idx + 1}</td>
      <td class="bom-col-desc">
        <div class="item-title">${item.productName}</div>
      </td>
      <td class="bom-col-make">${item.brandName || "-"}</td>
      <td class="bom-col-specs">${item.description || "-"}</td>
      <td class="bom-col-qty">${item.quantity} ${item.unitName || "Nos"}</td>
    </tr>
  `).join("");

  // Build dynamic Scope of Work from quotation_scope_of_work_items as bullet list
  let sowContentHtml = "";
  if (scopeOfWork && scopeOfWork.length > 0) {
    const sowItemsHtml = scopeOfWork.map((item) => {
      const titleClean = (item.title || "").trim().replace(/:$/, "");
      if (item.value && item.value.trim()) {
        return `
          <li>
            <div class="sow-item-title">${titleClean}</div>
            <div class="sow-item-val">${item.value.trim()}</div>
          </li>
        `;
      }
      return `
        <li>
          <div class="sow-item-title">${titleClean}</div>
        </li>
      `;
    }).join("");

    sowContentHtml = `
      <div class="sow-section">
        <ul class="sow-list">
          ${sowItemsHtml}
        </ul>
      </div>
    `;
  } else {
    sowContentHtml = `<p class="intro" style="color: #64748B; margin-top: 10px;">No specific scope of work items specified.</p>`;
  }

  // Dynamic Solar Savings Calculations for Page 6 (Sum of 12 calculated monthly yields)
  const systemSizeNum = Number(quotation.systemSize) || 5;
  const { months, monthlyValues, annualGeneration } = calculateMonthlySolarData(systemSizeNum);
  const annualSavings = annualGeneration * 8; // Standard average tariff rate: Rs 8 / unit
  const treesSaved = Math.round(systemSizeNum * 50);
  const co2Reduction = Math.max(1, Math.round(systemSizeNum));
  
  const totalCost = Number(quotation.grandTotal) || Number(quotation.subtotal) || (systemSizeNum * 50000);
  const effectiveCost = (subsidy && subsidy.showSubsidy && subsidy.netCustomerCost && Number(subsidy.netCustomerCost) > 0)
    ? Number(subsidy.netCustomerCost)
    : totalCost;
  const paybackYears = (effectiveCost / annualSavings).toFixed(2);

  const customerFullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();

  const franchiseAddressParts = [
    franchise.address,
    franchise.city,
    franchise.state ? `${franchise.state}${franchise.pinCode ? ` - ${franchise.pinCode}` : ''}` : franchise.pinCode
  ].filter(Boolean);
  const franchiseAddressStr = franchiseAddressParts.join(', ') || 'Corporate Office, Navi Mumbai, Maharashtra';

  let packageDisplay = 'Residential';
  if (quotation.packageName) {
    packageDisplay = quotation.packageName
      .replace(new RegExp(`^${quotation.systemSize}\\s*k?w?\\s*`, 'i'), '')
      .replace(/solar\s*package/i, '')
      .trim();
    if (!packageDisplay) {
      packageDisplay = 'Residential';
    }
  }

  let customerAddressHtml = '';
  const addrParts: string[] = [];
  if (customer.address?.trim()) {
    addrParts.push(customer.address.trim().replace(/,*$/, ','));
  }
  const cityState = [customer.city, customer.state].filter(Boolean).join(', ');
  if (cityState) {
    addrParts.push(cityState.replace(/,*$/, ','));
  }
  if (customer.pinCode?.trim()) {
    addrParts.push(customer.pinCode.trim());
  }
  customerAddressHtml = addrParts.join('<br/>');
  if (!customerAddressHtml.trim()) {
    customerAddressHtml = [customer.address, customer.city, customer.state, customer.pinCode].filter(Boolean).join(', ');
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sunselect — Proposal - ${quotation.quotationNumber}</title>
<style>
  ${getFontFacesCss()}

  :root{
    --red:#E31E24;
    --dark:#18181F;
    --text:#3B3F49;
    --muted:#9A9DA6;
    --border:#d6d6da;
    --highlight:#F2F2F2;
    --footer-bg:#0A0A0A;
    --font:'Arial MT', 'Myriad Pro', 'Microsoft Sans Serif', Arial, sans-serif;
    --font-heading:'Gilroy', 'Quicksand', 'Arial MT', Arial, sans-serif;
    --font-letter:'Myriad Pro', 'Arial MT', 'Microsoft Sans Serif', sans-serif;
    --font-accent:'Quicksand', 'Gilroy', 'Arial MT', sans-serif;
  }

  *{
    box-sizing:border-box;
    margin:0;
    padding:0;
  }

  html, body{
    margin:0;
    padding:0;
    background:#ffffff;
    font-family:var(--font);
    color:var(--text);
    -webkit-font-smoothing:antialiased;
  }

  @page{
    size:A4 portrait;
    margin:0;
  }

  .sheet-wrap{
    padding:0;
    margin:0;
  }

  /* Each page fits A4 exactly (210mm x 297mm) */
  .page{
    position:relative;
    width:210mm;
    height:297mm;
    max-height:297mm;
    page-break-after:always;
    page-break-inside:avoid;
    overflow:hidden;
    display:flex;
    flex-direction:column;
    background:#ffffff;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }

  /* Shared Logo Positioning: Same coordinates on all pages */
  .cover-logo-wrapper{
    position:absolute;
    top:14mm;
    right:16mm;
    z-index:10;
  }

  .cover-logo-wrapper img{
    height:56px;
    max-width:240px;
    object-fit:contain;
    display:block;
  }

  .page-top-logo{
    height:56px;
    max-width:240px;
    object-fit:contain;
    display:block;
  }

  /* ========================================================
     PAGE 1: FRONT COVER (Exact Match to Reference Design)
     ======================================================== */
  .cover-page{
    background-color:#ffffff;
    ${coverBgBase64 ? `background-image:url('${coverBgBase64}');` : ''}
    background-size:cover;
    background-position:center center;
    background-repeat:no-repeat;
  }

  /* Top Right Logo */
  .cover-logo{
    position:absolute;
    top:13.5mm;
    right:12.5mm;
    height:14.5mm;
    max-width:74mm;
    object-fit:contain;
    display:block;
    z-index:10;
  }

  /* Left Subtitle Block */
  .cover-subtitle-block{
    position:absolute;
    top:106.5mm;
    left:15.5mm;
    z-index:10;
  }

  .cover-system-size{
    font-family:var(--font-heading);
    font-size:19.5pt;
    font-weight:800;
    color:#101828;
    letter-spacing:-0.2px;
    line-height:1.15;
  }

  .cover-system-desc{
    font-size:14.5pt;
    font-weight:500;
    color:#5C667A;
    margin-top:2px;
    line-height:1.2;
  }

  /* Right Details Container with Curved Red Border */
  .right-details-container{
    position:absolute;
    top:45.8mm;
    left:133.7mm;
    width:67mm;
    border-left:1.5px solid #F07175;
    border-bottom:1.5px solid #F07175;
    border-bottom-left-radius:46px;
    padding-left:8.5mm;
    padding-top:13.5mm;
    padding-bottom:11mm;
    z-index:10;
  }

  .meta-row{
    display:flex;
    align-items:center;
    margin-bottom:6.2mm;
  }

  .circle-icon{
    width:36px;
    height:36px;
    min-width:36px;
    border-radius:50%;
    background:#E31E24;
    display:flex;
    align-items:center;
    justify-content:center;
    margin-right:12px;
  }

  .meta-text{
    display:flex;
    flex-direction:column;
    justify-content:center;
  }

  .meta-label{
    font-family:var(--font-heading);
    font-size:8.5pt;
    font-weight:700;
    color:#E31E24;
    letter-spacing:0.4px;
    text-transform:uppercase;
    line-height:1.1;
    margin-bottom:2px;
  }

  .meta-val{
    font-size:11.5pt;
    font-weight:700;
    color:#101828;
    line-height:1.2;
    letter-spacing:-0.1px;
  }

  .details-divider{
    height:1px;
    background:#E5E7EB;
    margin:1mm 0 5.5mm 0;
    width:95%;
  }

  .section-header{
    display:flex;
    align-items:center;
    margin-bottom:3.5mm;
  }

  .section-title{
    font-family:var(--font-heading);
    font-size:9.5pt;
    font-weight:800;
    color:#E31E24;
    letter-spacing:0.4px;
    text-transform:uppercase;
  }

  .section-body{
    margin-left:48px;
  }

  .field-group{
    margin-bottom:3.5mm;
  }

  .field-group:last-child{
    margin-bottom:0;
  }

  .field-label{
    font-size:8pt;
    font-weight:500;
    color:#64748B;
    line-height:1;
    margin-bottom:2px;
  }

  .field-val{
    font-size:10.5pt;
    font-weight:700;
    color:#101828;
    line-height:1.3;
    white-space:pre-line;
  }

  /* Prepared By Section (outside the curved box) */
  .prepared-by-container{
    position:absolute;
    top:190mm;
    left:133.7mm;
    width:67mm;
    padding-left:8.5mm;
    z-index:10;
  }

  .prepared-company{
    font-family:var(--font-heading);
    font-size:10.5pt;
    font-weight:700;
    color:#101828;
    line-height:1.2;
    margin-bottom:1.5mm;
  }

  .prepared-phone{
    font-size:9.5pt;
    color:#64748B;
  }

  .prepared-phone strong{
    color:#101828;
    font-weight:700;
  }

  /* ========================================================
     PAGE 2: WELCOME LETTER PAGE
     ======================================================== */
  .welcome-page{
    background-color:#ffffff;
    display:flex;
    flex-direction:column;
    justify-content:space-between;
  }

  .welcome-body{
    display:flex;
    flex-direction:row;
    flex:1;
    height:calc(297mm - 46px);
    overflow:hidden;
    position:relative;
  }

  /* Left column: House photo */
  .welcome-left{
    width:32%;
    height:100%;
    flex-shrink:0;
    overflow:hidden;
    position:relative;
  }

  .welcome-house-img{
    width:100%;
    height:100%;
    object-fit:cover;
    object-position:center bottom;
    display:block;
  }

  /* Right column: Welcome letter */
  .welcome-right{
    flex:1;
    height:100%;
    position:relative;
    display:flex;
    flex-direction:column;
    overflow:hidden;
    background:#ffffff;
  }

  /* Watermark icon on bottom-right of welcome page */
  .welcome-watermark{
    position:absolute;
    right:-16mm;
    bottom:-12mm;
    width:120mm;
    height:120mm;
    pointer-events:none;
    z-index:1;
  }

  /* Welcome Content Box */
  .welcome-content{
    position:relative;
    z-index:2;
    padding:34mm 14mm 16mm 14mm;
    display:flex;
    flex-direction:column;
  }

  .welcome-header{
    display:flex;
    flex-direction:column;
    align-items:center;
    margin-bottom:28mm;
  }

  .welcome-title-wrap{
    display:inline-flex;
    flex-direction:column;
    align-items:center;
  }

  .welcome-title{
    font-size:44px;
    font-weight:800;
    color:var(--red);
    letter-spacing:1px;
    line-height:1.05;
    margin:0;
    font-family:var(--font-heading);
    text-align:center;
  }

  .welcome-line-red{
    width:100%;
    height:3.5px;
    background-color:var(--red);
    margin-top:3px;
    border-radius:1px;
  }

  .welcome-line-dark{
    width:215px;
    height:3px;
    background-color:#18181F;
    margin-top:14px;
    border-radius:1px;
  }

  .welcome-text{
    padding:0 2mm;
    font-size:13px;
    line-height:1.62;
    color:#4A5568;
    font-family:var(--font-letter);
  }

  .welcome-salutation{
    font-size:14px;
    font-weight:500;
    color:#1A202C;
    margin-bottom:18px;
  }

  .welcome-paragraph{
    margin-bottom:18px;
    text-align:justify;
    text-justify:inter-word;
  }

  .welcome-closing{
    margin-top:22px;
  }

  .welcome-closing .thank-you{
    font-size:13.5px;
    font-weight:500;
    color:#1A202C;
    margin-bottom:3px;
  }

  .welcome-closing .company-sign{
    font-size:13.5px;
    font-weight:600;
    color:#1A202C;
  }

  /* Watermark icon on bottom-right of welcome page (Asset 11) */
  .welcome-watermark{
    position:absolute;
    right:0;
    bottom:0;
    width:92mm;
    pointer-events:none;
    z-index:1;
    display:block;
  }

  /* Watermark icon on bottom-right of other pages (Asset 11) */
  .bg-watermark{
    position:absolute;
    right:0;
    bottom:46px;
    width:92mm;
    pointer-events:none;
    z-index:0;
    display:block;
  }

  .page-watermark-img{
    width:100%;
    display:block;
  }

  /* ========================================================
     PAGE 3: QUOTATION DETAILS PAGE
     ======================================================== */
  .content-page{
    background-color:#ffffff;
  }

  /* Top padding matches logo height + spacing */
  .content{
    position:relative;
    z-index:1;
    padding:34mm 16mm 16px 16mm;
    flex:1;
  }

  .header{
    display:flex;
    justify-content:flex-start;
    align-items:center;
    margin-bottom:20px;
  }

  .proposal-title{
    font-family:var(--font-heading);
    font-weight:800;
    font-size:38px;
    letter-spacing:0.5px;
    color:var(--dark);
    display:inline-block;
    padding-bottom:6px;
    border-bottom:5px solid var(--red);
    margin:0;
  }

  .logo-slot{
    width:190px;
    height:56px;
    flex-shrink:0;
    border:2px dashed #c7c7cc;
    border-radius:6px;
    display:flex;
    align-items:center;
    justify-content:center;
    text-align:center;
    color:#a6a6ac;
    font-size:20px;
    font-weight:bold;
    line-height:1.4;
    padding:4px;
  }

  .intro{
    font-weight:700;
    font-size:15px;
    color:var(--dark);
    line-height:1.5;
    margin:4px 0 18px;
    max-width:580px;
  }

  /* ========================================================
     ITEM DETAILS & SUMMARY TABLE (Reference Match)
     ======================================================== */
  table.quote{
    width:100%;
    border-collapse:collapse;
    margin-bottom:16px;
    font-size:11px;
    background:#ffffff;
  }

  table.quote th{
    font-family:var(--font-heading);
    background-color:var(--red);
    color:#ffffff;
    font-weight:700;
    font-size:11px;
    padding:8px 10px;
    border:1px solid var(--red);
    vertical-align:middle;
  }

  table.quote td{
    border:1px solid #e5e7eb;
    padding:8px 10px;
    vertical-align:middle;
    color:var(--dark);
  }

  table.quote tbody tr:nth-child(even){
    background-color:#fafafa;
  }

  /* Specific column alignments & styles */
  .col-sno{
    text-align:center;
    width:5%;
    font-weight:700;
  }
  .col-desc{
    text-align:left;
    width:33%;
  }
  .item-title{
    font-family:var(--font-heading);
    font-weight:700;
    color:var(--dark);
    font-size:11.5px;
  }
  .item-subdesc{
    font-size:10px;
    color:var(--muted);
    margin-top:2px;
  }
  .col-brand{
    text-align:left;
    width:16%;
  }
  .col-qty{
    text-align:center;
    width:6%;
  }
  .col-unit{
    text-align:center;
    width:8%;
  }
  .col-rate{
    text-align:right;
    width:11%;
  }
  .col-gst{
    text-align:center;
    width:7%;
  }
  .col-total{
    text-align:right;
    width:14%;
    font-weight:700;
  }

  /* ========================================================
     PAGE 4: BILL OF MATERIAL TABLE
     ======================================================== */
  table.bom-table{
    width:100%;
    border-collapse:collapse;
    margin-bottom:20px;
    font-size:11px;
    background:#ffffff;
  }

  table.bom-table th{
    font-family:var(--font-heading);
    background-color:var(--red);
    color:#ffffff;
    font-weight:700;
    font-size:11px;
    padding:8px 10px;
    border:1px solid var(--red);
    vertical-align:middle;
  }

  table.bom-table td{
    border:1px solid #e5e7eb;
    padding:8px 10px;
    vertical-align:middle;
    color:var(--dark);
  }

  table.bom-table tbody tr:nth-child(even){
    background-color:#fafafa;
  }

  .bom-col-sno{
    text-align:center;
    width:8%;
    font-weight:700;
  }

  .bom-col-desc{
    text-align:left;
    width:32%;
    font-weight:600;
  }

  .bom-col-make{
    text-align:left;
    width:16%;
    color:var(--dark);
  }

  .bom-col-specs{
    text-align:left;
    width:32%;
    color:#4B5563;
    font-size:10.5px;
    line-height:1.4;
  }

  .bom-col-qty{
    text-align:center;
    width:12%;
    font-weight:700;
  }

  /* ========================================================
     PAGE 5: SCOPE OF WORK
     ======================================================== */
  .sow-section{
    margin-bottom:18px;
  }

  .sow-heading{
    font-family:var(--font-heading);
    color:var(--red);
    font-size:13.5px;
    font-weight:800;
    margin:0 0 8px 0;
    letter-spacing:0.2px;
  }

  .sow-list{
    list-style:none;
    padding:0;
    margin:14px 0 8px 0;
  }

  .sow-list li{
    position:relative;
    padding-left:16px;
    margin-bottom:12px;
  }

  .sow-list li::before{
    content:"•";
    position:absolute;
    left:0;
    top:0;
    color:var(--red);
    font-size:16px;
    line-height:1.2;
    font-weight:bold;
  }

  .sow-item-title{
    font-family:var(--font-heading);
    font-size:12px;
    font-weight:700;
    color:#101828;
    line-height:1.35;
  }

  .sow-item-val{
    font-size:11.5px;
    color:#4B5563;
    line-height:1.45;
    margin-top:2px;
  }

  .sow-highlight-block{
    margin-top:10px;
    padding-left:14px;
  }

  .sow-degradation{
    font-size:11.5px;
    font-weight:700;
    color:#101828;
    margin:0 0 3px 0;
    line-height:1.4;
  }

  .sow-subnote{
    font-size:10.5px;
    color:#4B5563;
    margin:0;
    line-height:1.4;
  }

  .sow-notes{
    font-size:11px;
    line-height:1.55;
    color:var(--dark);
    padding-left:14px;
  }

  .sow-notes p{
    margin:0 0 4px 0;
  }

  /* ========================================================
     PAGE 6: SAVINGS & GENERATION (FULL PAGE DESIGN)
     ======================================================== */
  .savings-metrics-grid{
    display:grid;
    grid-template-columns:repeat(3, 1fr);
    gap:36px 24px;
    margin-top:28px;
    margin-bottom:34px;
  }

  .savings-metric-card{
    display:flex;
    flex-direction:column;
    align-items:center;
    text-align:center;
    padding:4px;
  }

  .savings-metric-icon{
    width:82px;
    height:76px;
    object-fit:contain;
    margin-bottom:12px;
  }

  .savings-metric-title{
    font-size:13.5px;
    font-weight:600;
    color:#374151;
    margin:0 0 6px 0;
    line-height:1.3;
  }

  .savings-metric-value{
    font-family:var(--font-heading);
    font-size:19px;
    font-weight:800;
    color:var(--red);
    margin:0;
    line-height:1.2;
    letter-spacing:0.2px;
  }

  .savings-chart-wrapper{
    margin-top:14px;
    background:#ffffff;
    border-radius:4px;
    padding:0;
  }

  /* ========================================================
     PAGE 7: SIGNATORY & CONTACT US (CLOSING PAGE)
     ======================================================== */
  .closing-page{
    position:relative;
    background-color:#ffffff;
    display:flex;
    flex-direction:column;
    height:297mm;
    overflow:hidden;
  }

  .closing-content{
    position:relative;
    z-index:1;
    padding:62mm 18mm 0 18mm;
    flex:1;
    display:flex;
    flex-direction:column;
  }

  .signatory-group{
    margin-bottom:34mm;
  }

  .signatory-group:last-of-type{
    margin-bottom:28mm;
  }

  .signatory-title{
    font-family:var(--font-heading);
    color:var(--red);
    font-size:16.5px;
    font-weight:700;
    margin:0 0 4px 0;
    letter-spacing:0.2px;
  }

  .signatory-subtitle{
    color:#4B5563;
    font-size:13.5px;
    font-weight:500;
    margin:0;
  }

  .closing-card-wrap{
    position:relative;
    z-index:1;
  }

  .closing-contact-card{
    background-color:var(--red);
    border-radius:14px;
    padding:26px 32px 30px 32px;
    color:#ffffff;
    width:100%;
    box-sizing:border-box;
  }

  .closing-contact-title{
    font-family:var(--font-heading);
    font-size:19px;
    font-weight:700;
    color:#ffffff;
    margin:0 0 16px 0;
    letter-spacing:0.3px;
  }

  .closing-contact-info{
    max-width:54%;
  }

  .closing-contact-info p{
    font-size:13px;
    line-height:1.75;
    color:#ffffff;
    margin:0 0 7px 0;
  }

  .closing-contact-info strong{
    font-weight:700;
    display:inline-block;
    min-width:86px;
  }

  .closing-contact-info span{
    font-weight:400;
  }

  .closing-man-img{
    position:absolute;
    right:-10px;
    bottom:0;
    width:160mm;
    pointer-events:none;
    z-index:2;
    display:block;
  }

  /* Dynamic SOW Table & Badges */
  table.sow-table{
    margin-bottom:10px;
  }

  .sow-col-sno{
    text-align:center;
    width:8%;
    font-weight:700;
  }

  .sow-col-desc{
    text-align:left;
    width:56%;
    font-weight:600;
  }

  .sow-col-resp{
    text-align:left;
    width:36%;
  }

  .sow-badge{
    display:inline-block;
    padding:2px 8px;
    border-radius:4px;
    font-size:10.5px;
    font-weight:700;
    letter-spacing:0.2px;
  }

  .sow-badge-customer{
    background-color:#FEF3C7;
    color:#92400E;
    border:1px solid #FDE68A;
  }

  .sow-badge-included{
    background-color:#DEF7EC;
    color:#03543F;
    border:1px solid #BCF0DA;
  }

  .sow-badge-default{
    background-color:#F3F4F6;
    color:#374151;
    border:1px solid #E5E7EB;
  }

  /* Summary rows in table footer (seamless grid continuation) */
  table.quote tfoot td{
    padding:8px 10px;
    font-size:11px;
    border:1px solid #e5e7eb;
    vertical-align:middle;
  }

  table.quote tfoot td.calc-blank{
    border:none !important;
    border-top:none !important;
    border-bottom:none !important;
    border-left:none !important;
    border-right:none !important;
    background:transparent !important;
    padding:0 !important;
    height:0;
  }

  table.quote tfoot tr:first-child td:not(.calc-blank){
    border-top:1px solid #e5e7eb;
  }

  table.quote tfoot .calc-label{
    font-family:var(--font-heading);
    text-align:left;
    color:var(--dark);
    font-weight:600;
  }

  table.quote tfoot .calc-value{
    text-align:right;
    font-weight:600;
    color:var(--dark);
  }

  table.quote tfoot .grand-total-row td{
    font-family:var(--font-heading);
    font-weight:800;
    font-size:12px;
    color:var(--dark);
    background-color:#ffffff;
  }

  table.quote tfoot .discount-text{
    color:var(--red);
  }

  table.quote tfoot .net-cost-row td{
    font-family:var(--font-heading);
    background-color:#eef8f1;
    font-weight:800;
    font-size:12.5px;
    color:#1b5e20;
    border-top:1.5px solid #c8e6c9;
  }

  table.quote tfoot .net-cost-row td.calc-value{
    font-family:var(--font-heading);
    background-color:#1e5631;
    color:#ffffff;
    font-size:13.5px;
    font-weight:800;
  }

  .cols{
    display:flex;
    gap:36px;
    margin-bottom:16px;
  }

  .cols h3{
    color:var(--red);
    font-size:14px;
    font-weight:700;
    margin:0 0 6px;
  }

  .cols .col{
    flex:1;
  }

  .notice{
    color:var(--red);
    font-weight:700;
    font-size:12px;
    line-height:1.5;
    margin-top:8px;
  }

  .footer{
    position:relative;
    z-index:1;
    background:#070a0f;
    color:#ffffff;
    padding:10px 16mm;
    display:flex;
    align-items:center;
    justify-content:space-between;
    font-size:12px;
    margin-top:auto;
    min-height:46px;
  }

  .footer .brand, .footer .item{
    display:flex;
    align-items:center;
    gap:10px;
    color:#ffffff;
    text-decoration:none;
  }

  .footer-logo{
    height:26px;
    max-width:140px;
    object-fit:contain;
    display:block;
  }

  .footer .item{
    font-size:12px;
    font-weight:500;
    letter-spacing:0.2px;
    color:#f1f5f9;
  }

  .footer-icon{
    width:18px;
    height:18px;
    display:inline-block;
    vertical-align:middle;
    stroke:#94a3b8;
    fill:none;
    flex-shrink:0;
  }

  .page-no{
    font-family:var(--font-heading);
    background:#ffffff;
    color:#070a0f;
    font-weight:800;
    font-size:13px;
    padding:4px 14px;
    border-radius:2px;
    display:flex;
    align-items:center;
    justify-content:center;
    min-width:32px;
  }

  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 80px;
    font-weight: 700;
    color: rgba(226, 232, 240, 0.35);
    pointer-events: none;
    z-index: 0;
    white-space: nowrap;
  }

  @media print{
    body{ background:#fff; }
    .sheet-wrap{ padding:0; margin:0; }
    .page{ box-shadow:none; width:210mm; height:297mm; }
  }
</style>
</head>
<body>
<div class="sheet-wrap">

  <!-- ============================================ -->
  <!-- PAGE 1: FRONT COVER                          -->
  <!-- ============================================ -->
  <div class="page cover-page">
    ${coverLogoBase64 ? `<img src="${coverLogoBase64}" alt="Sunselect" class="cover-logo" />` : ''}

    <!-- Subtitle under pre-printed SOLAR PROPOSAL -->
    <div class="cover-subtitle-block">
      <div class="cover-system-size">${quotation.systemSize}kW</div>
      <div class="cover-system-desc">Solar Power System</div>
    </div>

    <!-- Right Details Container with Curved Red Border -->
    <div class="right-details-container">
      <!-- DATE -->
      <div class="meta-row">
        <div class="circle-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="17" rx="2"></rect>
            <line x1="8" y1="2" x2="8" y2="5"></line>
            <line x1="16" y1="2" x2="16" y2="5"></line>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <circle cx="7.5" cy="13" r="0.9" fill="#ffffff"></circle>
            <circle cx="12" cy="13" r="0.9" fill="#ffffff"></circle>
            <circle cx="16.5" cy="13" r="0.9" fill="#ffffff"></circle>
            <circle cx="7.5" cy="17" r="0.9" fill="#ffffff"></circle>
            <circle cx="12" cy="17" r="0.9" fill="#ffffff"></circle>
            <circle cx="16.5" cy="17" r="0.9" fill="#ffffff"></circle>
          </svg>
        </div>
        <div class="meta-text">
          <span class="meta-label">DATE</span>
          <span class="meta-val">${quotation.createdAt || ''}</span>
        </div>
      </div>

      <!-- PROPOSAL NO -->
      <div class="meta-row">
        <div class="circle-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round" />
            <path d="M14 3v5h5" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round" />
            <text x="11.5" y="17" font-size="9" font-family="'Gilroy', 'Arial MT', sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle">3</text>
          </svg>
        </div>
        <div class="meta-text">
          <span class="meta-label">PROPOSAL NO.</span>
          <span class="meta-val">${quotation.quotationNumber}</span>
        </div>
      </div>

      <!-- VALID TILL -->
      <div class="meta-row">
        <div class="circle-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9.5"></circle>
            <polyline points="12 6.5 12 12 15.5 15"></polyline>
          </svg>
        </div>
        <div class="meta-text">
          <span class="meta-label">VALID TILL</span>
          <span class="meta-val">${quotation.validTill || ''}</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="details-divider"></div>

      <!-- CUSTOMER DETAILS -->
      <div class="customer-section">
        <div class="section-header">
          <div class="circle-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff">
              <circle cx="12" cy="7" r="4.5" />
              <path d="M3 20c0-4 4-6.5 9-6.5s9 2.5 9 6.5v1H3v-1z" />
            </svg>
          </div>
          <div class="section-title">CUSTOMER DETAILS</div>
        </div>
        
        <div class="section-body">
          <div class="field-group">
            <div class="field-label">Name</div>
            <div class="field-val">${customerFullName || ''}</div>
          </div>

          <div class="field-group">
            <div class="field-label">Address</div>
            <div class="field-val">${customerAddressHtml || ''}</div>
          </div>

          <div class="field-group">
            <div class="field-label">Phone</div>
            <div class="field-val">${customer.mobileNumber || ''}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- PREPARED BY -->
    <div class="prepared-by-container">
      <div class="section-header">
        <div class="circle-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff">
            <path d="M12 2H4a1 1 0 0 0-1 1v17h18V7a1 1 0 0 0-1-1h-8V2zm-1 2v3H5V4h6zm8 5v11h-6V8h6v1zm-8-1v2H5V8h6zm0 4v2H5v-2h6zm0 4v2H5v-2h6zm6-4v2h-4v-2h4zm0 4v2h-4v-2h4z" />
            <rect x="2" y="20" width="20" height="2" rx="0.5" />
          </svg>
        </div>
        <div class="section-title">PREPARED BY</div>
      </div>
      <div class="section-body">
        <div class="prepared-company">${franchise.name || ''}</div>
        <div class="prepared-phone">Phone: <strong>${franchise.mobile || ''}</strong></div>
      </div>
    </div>
  </div>

  <!-- ============================================ -->
  <!-- PAGE 2: WELCOME LETTER                       -->
  <!-- ============================================ -->
  <div class="page welcome-page">
    <div class="welcome-body">
      <!-- Left Column: House Photo -->
      <div class="welcome-left">
        ${welcomeHouseBase64 ? `<img src="${welcomeHouseBase64}" alt="Solar House" class="welcome-house-img" />` : ''}
      </div>

      <!-- Right Column: Welcome Letter -->
      <div class="welcome-right">
        <!-- Top Right Logo -->
        <div class="cover-logo-wrapper">
          ${page2LogoHtml}
        </div>

        <!-- Watermark Graphic (Asset 11) -->
        ${watermarkLogoBase64 ? `<img src="${watermarkLogoBase64}" alt="" class="welcome-watermark" />` : ''}

        <!-- Main Letter Content -->
        <div class="welcome-content">
          <div class="welcome-header">
            <div class="welcome-title-wrap">
              <h1 class="welcome-title">WELCOME</h1>
            </div>
            <div class="welcome-line-dark"></div>
          </div>

          <div class="welcome-text">
            <p class="welcome-salutation">Dear Customer,</p>

            <p class="welcome-paragraph">
              It has been a privilege to understand your need and give you the best solution for you. As required, we have committed to the highest level of quality. That's why we select the best components and industry-leading performance models to ensure your system will produce optimally.
            </p>

            <p class="welcome-paragraph">
              Our highly trained installation crews take pride in delivering beautiful well-made solar arrays. From the panels to the bolts on the roof, we'll deliberately consider every piece of your installation so you can rest easy throughout its many years of service. We take great pride in our guarantee of complete customer satisfaction.
            </p>

            <p class="welcome-paragraph">
              We are looking forward to help you and have a long-term relationship with you. Please go through the proposal and give us your feedback.
            </p>

            <div class="welcome-closing">
              <p class="thank-you">Thank You,</p>
              <p class="company-sign">Sunselect Solar</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer for Page 2 -->
    <div class="footer">
      <div class="brand">
        ${footerLogoHtml}
      </div>
      <div class="item">
        <svg class="footer-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>sunselect.in</span>
      </div>
      <div class="item">
        <svg class="footer-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        <span>${franchise.email || 'info@sunselect.in'}</span>
      </div>
      <div class="page-no">2</div>
    </div>
  </div>

  <!-- ============================================ -->
  <!-- PAGE 3: QUOTATION DETAILS                    -->
  <!-- ============================================ -->
  <div class="page content-page">
    <!-- Same logo position as page 1 -->
    <div class="cover-logo-wrapper">
      ${page2LogoHtml}
    </div>

    <div class="bg-watermark">
      ${watermarkLogoBase64 ? `<img src="${watermarkLogoBase64}" alt="" class="page-watermark-img" />` : ''}
    </div>
    ${quotation.statusText === "Draft" ? '<div class="watermark">DRAFT</div>' : ""}

    <div class="content">
      <div class="header">
        <h1 class="proposal-title">PROPOSAL</h1>
      </div>

      <p class="intro">Price Quote &amp; Payment schedule for ${quotation.systemSize} KW System to ${customer.firstName} ${customer.lastName || ''}:</p>

      <table class="quote">
        <thead>
          <tr>
            <th class="col-sno">S.No.</th>
            <th class="col-desc">Item Description</th>
            <th class="col-brand">Brand/Make</th>
            <th class="col-qty">Qty</th>
            <th class="col-unit">Unit</th>
            <th class="col-rate">Rate (INR)</th>
            <th class="col-gst">GST</th>
            <th class="col-total">Total (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr class="calc-row">
            <td colspan="4" class="calc-blank"></td>
            <td colspan="3" class="calc-label">Subtotal</td>
            <td class="calc-value">${formatINR(quotation.subtotal)}</td>
          </tr>
          ${quotation.discount ? `
          <tr class="calc-row">
            <td colspan="4" class="calc-blank"></td>
            <td colspan="3" class="calc-label">Discount</td>
            <td class="calc-value discount-text">- ${formatINR(quotation.discount)}</td>
          </tr>
          ` : ''}
          ${quotation.extra && quotation.extra.value !== undefined && quotation.extra.value !== null && quotation.extra.value !== "" ? `
          <tr class="calc-row">
            <td colspan="4" class="calc-blank"></td>
            <td colspan="3" class="calc-label">${quotation.extra.description ? `Extra (${quotation.extra.description})` : 'Extra Charges'}</td>
            <td class="calc-value">${!isNaN(Number(quotation.extra.value)) ? formatINR(Number(quotation.extra.value)) : quotation.extra.value}</td>
          </tr>
          ` : ''}
          ${quotation.gstAmount && quotation.gstAmount > 0 ? `
          <tr class="calc-row">
            <td colspan="4" class="calc-blank"></td>
            <td colspan="3" class="calc-label">GST ${quotation.packageGst ? `(${quotation.packageGst}%)` : ''}</td>
            <td class="calc-value">${formatINR(quotation.gstAmount)}</td>
          </tr>
          ` : ''}
          <tr class="calc-row grand-total-row">
            <td colspan="4" class="calc-blank"></td>
            <td colspan="3" class="calc-label">Grand Total</td>
            <td class="calc-value">${formatINR(quotation.grandTotal)}</td>
          </tr>
          ${subsidyRowsHtml}
        </tfoot>
      </table>

      <div class="cols" style="align-items: flex-start; margin-top: 32px;">
         <div class="col" style="flex: 1.4; padding-right: 15px;">
             ${termsConditions.length > 0 ? termsConditions.map((tc) => `
                 <h3 style="color: var(--red); margin: 6px 0 4px 0;">${tc.title}</h3>
                 <ul style="margin: 0 0 8px 0; padding-left: 18px; font-size: 12.5px; line-height: 1.45; color: var(--text);">
                     ${Array.isArray(tc.description)
      ? tc.description.map(d => `<li style="margin-bottom: 3px;">${d}</li>`).join('')
      : `<li style="margin-bottom: 3px;">${tc.description}</li>`}
                 </ul>
             `).join("") : '<div style="font-size: 12.5px; color: var(--text);">No specific terms defined.</div>'}
         </div>
         <div class="col" style="flex: 1;">
             <h3 style="color: var(--red); margin: 6px 0 4px 0;">Bank Details</h3>
             <table style="width: 100%; border: none; font-size: 12.5px; line-height: 1.5; color: var(--text); border-collapse: collapse;">
                 <tbody>
                     <tr><td style="padding: 2px 0; width: 85px; border: none; vertical-align: top;">Bank Name:</td><td style="padding: 2px 0; border: none; font-weight: 500;">HDFC Bank</td></tr>
                     <tr><td style="padding: 2px 0; border: none; vertical-align: top;">Name:</td><td style="padding: 2px 0; border: none; font-weight: 500;">SunSelect Solar Private Limited</td></tr>
                     <tr><td style="padding: 2px 0; border: none; vertical-align: top;">Account No:</td><td style="padding: 2px 0; border: none; font-weight: 500;">0876543210123</td></tr>
                     <tr><td style="padding: 2px 0; border: none; vertical-align: top;">IFSC Code:</td><td style="padding: 2px 0; border: none; font-weight: 500;">HDFC0001234</td></tr>
                     <tr><td style="padding: 2px 0; border: none; vertical-align: top;">Branch:</td><td style="padding: 2px 0; border: none; font-weight: 500;">Navi Mumbai</td></tr>
                 </tbody>
             </table>
         </div>
      </div>

      ${quotation.notes ? `<p class="notice">Note: ${quotation.notes}</p>` : ''}
    </div>

    <div class="footer">
      <div class="brand">
        ${footerLogoHtml}
      </div>
      <div class="item">
        <svg class="footer-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>sunselect.in</span>
      </div>
      <div class="item">
        <svg class="footer-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        <span>${franchise.email || 'info@sunselect.in'}</span>
      </div>
      <div class="page-no">3</div>
    </div>
  </div>

  <!-- ============================================ -->
  <!-- PAGE 4: BILL OF MATERIAL                     -->
  <!-- ============================================ -->
  <div class="page content-page">
    <!-- Same logo position as other pages -->
    <div class="cover-logo-wrapper">
      ${page2LogoHtml}
    </div>

    <!-- Watermark Graphic (Asset 11) -->
    <div class="bg-watermark">
      ${watermarkLogoBase64 ? `<img src="${watermarkLogoBase64}" alt="" class="page-watermark-img" />` : ''}
    </div>

    <div class="content">
      <div class="header">
        <h1 class="proposal-title">BILL OF MATERIAL</h1>
      </div>

      <p class="intro">Bill of Materials &amp; Technical Specifications for ${quotation.systemSize} KW System:</p>

      <table class="bom-table">
        <thead>
          <tr>
            <th class="bom-col-sno">Sr. No.</th>
            <th class="bom-col-desc">Description of Goods</th>
            <th class="bom-col-make">Make</th>
            <th class="bom-col-specs">Specifications</th>
            <th class="bom-col-qty">QTY</th>
          </tr>
        </thead>
        <tbody>
          ${bomRowsHtml}
        </tbody>
      </table>
    </div>

    <!-- Footer for Page 4 -->
    <div class="footer">
      <div class="brand">
        ${footerLogoHtml}
      </div>
      <div class="item">
        <svg class="footer-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>sunselect.in</span>
      </div>
      <div class="item">
        <svg class="footer-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        <span>${franchise.email || 'info@sunselect.in'}</span>
      </div>
      <div class="page-no">4</div>
    </div>
  </div>

  <!-- ============================================ -->
  <!-- PAGE 5: SCOPE OF WORK                        -->
  <!-- ============================================ -->
  <div class="page content-page">
    <!-- Same logo position as other pages -->
    <div class="cover-logo-wrapper">
      ${page2LogoHtml}
    </div>

    <!-- Watermark Graphic (Asset 11) -->
    <div class="bg-watermark">
      ${watermarkLogoBase64 ? `<img src="${watermarkLogoBase64}" alt="" class="page-watermark-img" />` : ''}
    </div>

    <div class="content">
      <div class="header">
        <h1 class="proposal-title">SCOPE OF WORK</h1>
      </div>

      ${sowContentHtml}

      ${quotation.notes ? `
        <div class="sow-section" style="margin-top: 20px;">
          <h3 class="sow-heading">Note:</h3>
          <div class="sow-notes">
            <p>${quotation.notes}</p>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Footer for Page 5 -->
    <div class="footer">
      <div class="brand">
        ${footerLogoHtml}
      </div>
      <div class="item">
        <svg class="footer-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>sunselect.in</span>
      </div>
      <div class="item">
        <svg class="footer-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        <span>${franchise.email || 'info@sunselect.in'}</span>
      </div>
      <div class="page-no">5</div>
    </div>
  </div>

  <!-- ============================================ -->
  <!-- PAGE 6: SOLAR SAVINGS & GENERATION           -->
  <!-- ============================================ -->
  <div class="page content-page">
    <!-- Same logo position as other pages -->
    <div class="cover-logo-wrapper">
      ${page2LogoHtml}
    </div>

    <!-- Watermark Graphic (Asset 11) -->
    <div class="bg-watermark">
      ${watermarkLogoBase64 ? `<img src="${watermarkLogoBase64}" alt="" class="page-watermark-img" />` : ''}
    </div>

    <div class="content">
      <div class="header">
        <h1 class="proposal-title">${systemSizeNum}KW SAVINGS</h1>
      </div>

      <!-- 3x2 Metrics Grid -->
      <div class="savings-metrics-grid">
        <!-- Card 1: Payback Period -->
        <div class="savings-metric-card">
          <img src="${getPaybackIconBase64()}" alt="Payback Period" class="savings-metric-icon" />
          <p class="savings-metric-title">Payback Period</p>
          <p class="savings-metric-value">${paybackYears} Years</p>
        </div>

        <!-- Card 2: Average Yearly Generation -->
        <div class="savings-metric-card">
          <img src="${getAvgYearlyIconBase64()}" alt="Average Yearly Generation" class="savings-metric-icon" />
          <p class="savings-metric-title">Average Yearly Generation</p>
          <p class="savings-metric-value">${annualGeneration.toFixed(1)} Units</p>
        </div>

        <!-- Card 3: Average Annual Savings -->
        <div class="savings-metric-card">
          <img src="${getAvgAnnualIconBase64()}" alt="Average Annual Savings" class="savings-metric-icon" />
          <p class="savings-metric-title">Average Annual Savings</p>
          <p class="savings-metric-value">Rs. ${annualSavings.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</p>
        </div>

        <!-- Card 4: Project Cost -->
        <div class="savings-metric-card">
          <img src="${getProjectCostIconBase64()}" alt="Project Cost" class="savings-metric-icon" />
          <p class="savings-metric-title">Project Cost</p>
          <p class="savings-metric-value">Rs. ${Math.round(totalCost).toLocaleString('en-IN')}</p>
        </div>

        <!-- Card 5: Trees Saved -->
        <div class="savings-metric-card">
          <img src="${getTreeSavedIconBase64()}" alt="Trees Saved" class="savings-metric-icon" />
          <p class="savings-metric-title">Trees Saved</p>
          <p class="savings-metric-value">${treesSaved}</p>
        </div>

        <!-- Card 6: CO2 Reduction -->
        <div class="savings-metric-card">
          <img src="${getCo2IconBase64()}" alt="Co2 Reduction" class="savings-metric-icon" />
          <p class="savings-metric-title">Co2 Reduction</p>
          <p class="savings-metric-value">${co2Reduction} Tonnes</p>
        </div>
      </div>

      <!-- Monthly Generation Chart -->
      <div class="savings-chart-wrapper">
        ${generateMonthlyChartSvg(months, monthlyValues)}
      </div>
    </div>

    <!-- Footer for Page 6 -->
    <div class="footer">
      <div class="brand">
        ${footerLogoHtml}
      </div>
      <div class="item">
        <svg class="footer-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>sunselect.in</span>
      </div>
      <div class="item">
        <svg class="footer-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        <span>${franchise.email || 'info@sunselect.in'}</span>
      </div>
      <div class="page-no">6</div>
    </div>
  </div>

  <!-- ============================================ -->
  <!-- PAGE 7: SIGNATORY & CONTACT US (CLOSING)     -->
  <!-- ============================================ -->
  <div class="page closing-page">
    <!-- Same logo position as other pages -->
    <div class="cover-logo-wrapper">
      ${page2LogoHtml}
    </div>

    <div class="closing-content">
      <!-- Authorized Signatory -->
      <div class="signatory-group">
        <h2 class="signatory-title">Authorized Signatory</h2>
        <p class="signatory-subtitle">Sunselect Solar</p>
      </div>

      <!-- Customer Signatory -->
      <div class="signatory-group">
        <h2 class="signatory-title">Customer Signatory</h2>
      </div>

      <!-- Red Contact Us Card -->
      <div class="closing-card-wrap">
        <div class="closing-contact-card">
          <h3 class="closing-contact-title">Contact Us</h3>
          <div class="closing-contact-info">
            <p><strong>Contact No:</strong> <span>${franchise.mobile || '+91 98765 43210'}</span></p>
            <p><strong>E-Mail:</strong> <span>${franchise.email || 'info@sunselect.in'}</span></p>
            <p><strong>Website:</strong> <span>sunselect.in</span></p>
            <p><strong>Address:</strong> <span>${franchiseAddressStr}</span></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Man pointing image in bottom-right corner -->
    ${getManImageBase64() ? `<img src="${getManImageBase64()}" alt="" class="closing-man-img" />` : ''}
  </div>

</div>
</body>
</html>
    `;
}
