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
    path.resolve(__dirname, '../../../../dist/apps/api/src/modules/quotations/assets/Images', fileName),
    path.join(process.cwd(), 'apps/api/src/modules/quotations/assets/Images', fileName),
    path.join(process.cwd(), 'dist/apps/api/src/modules/quotations/assets/Images', fileName),
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
    path.resolve(__dirname, '../../../../dist/apps/api/src/modules/quotations/assets/Fonts', fileName),
    path.join(process.cwd(), 'apps/api/src/modules/quotations/assets/Fonts', fileName),
    path.join(process.cwd(), 'dist/apps/api/src/modules/quotations/assets/Fonts', fileName),
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
        font-family: 'Gilroy';
        src: ${gilroyBold};
        font-weight: 900;
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

function formatPrice(amount: number | string): string {
  if (typeof amount === 'string') return amount;
  const num = Number(amount);
  if (isNaN(num)) return String(amount);
  if (num === 0) return '0';
  const hasDecimals = num % 1 !== 0;
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  });
}

export function generateQuotationHtmlV3(data: IQuotationPdfData): string {
  const { franchise, customer, quotation, items, scopeOfWork, termsConditions, subsidy, bankDetails } = data;

  const bankName = bankDetails?.bankName || 'HDFC Bank';
  const accountHolderName = bankDetails?.accountHolderName || franchise.name || 'SunSelect Solar Private Limited';
  const accountNumber = bankDetails?.accountNumber || '0876543210123';
  const ifscCode = bankDetails?.ifscCode || 'HDFC0001234';
  const branchName = bankDetails?.branchName || franchise.city || 'Navi Mumbai';

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

  // Build 2-column Proposal Pricing Breakdown matching Sunselect Theme & Exact Flow
  // Build 2-column Proposal Pricing Breakdown matching Sunselect Theme & Exact Flow
  const packageItems = items.filter(i => !i.isExtra);
  const extraItems = items.filter(i => i.isExtra);

  // 1. Extra charge value from quotation.extra
  const rawExtraValue = quotation.extra && !isNaN(Number(quotation.extra.value))
    ? Number(quotation.extra.value)
    : 0;

  // 2. Determine Gross Package Price:
  // Prefer quotation.subtotal or (quotation.grandTotal - rawExtraValue) over raw component item totals
  let grossPackagePrice = 0;
  if (Number(quotation.subtotal) > 0) {
    if (rawExtraValue > 0 && Math.abs(Number(quotation.subtotal) - (Number(quotation.grandTotal) || 0)) <= 10 && Number(quotation.subtotal) > rawExtraValue) {
      grossPackagePrice = Number(quotation.subtotal) - rawExtraValue;
    } else {
      grossPackagePrice = Number(quotation.subtotal);
    }
  } else if (Number(quotation.grandTotal) > 0) {
    grossPackagePrice = Math.max(0, Number(quotation.grandTotal) - rawExtraValue);
  } else if (packageItems.length > 0) {
    grossPackagePrice = packageItems.reduce((sum, i) => sum + i.lineTotal, 0);
  }

  // 3. Determine if GST is applied on package:
  const isPackageGstApplied = Boolean(
    (quotation.packageGst !== null && quotation.packageGst !== undefined && Number(quotation.packageGst) > 0) ||
    (quotation.gstAmount !== null && quotation.gstAmount !== undefined && Number(quotation.gstAmount) > 0)
  );

  const packageGstPct = isPackageGstApplied
    ? Number(quotation.packageGst ?? (quotation.gstAmount && grossPackagePrice > 0 ? Math.round((Number(quotation.gstAmount) / grossPackagePrice) * 100) : 18))
    : 0;

  let displayedPackageAmount: number;
  let packageGstAmount: number;

  if (isPackageGstApplied && packageGstPct > 0) {
    // Deduct GST from package and show base price
    displayedPackageAmount = Math.round(grossPackagePrice / (1 + (packageGstPct / 100)));
    packageGstAmount = grossPackagePrice - displayedPackageAmount;
  } else {
    // If GST is not applied, do not deduct anything
    displayedPackageAmount = grossPackagePrice;
    packageGstAmount = 0;
  }

  const systemTitle = quotation.packageName
    ? quotation.packageName
    : (quotation.systemSize ? `${quotation.systemSize} kW Rooftop ON-Grid Solar Power Plant System` : `Rooftop ON-Grid Solar Power Plant System`);

  interface IPricingRow {
    description: string;
    subDescription?: string | undefined;
    amount: string;
    isCustomText?: boolean | undefined;
    isBold?: boolean | undefined;
    isHighlight?: boolean | undefined;
    isNegative?: boolean | undefined;
    isBoldText?: boolean | undefined;
  }

  const pricingRows: IPricingRow[] = [];

  // 1. Package Row
  pricingRows.push({
    description: systemTitle,
    subDescription: quotation.packageDescription || undefined,
    amount: formatPrice(displayedPackageAmount)
  });

  // Track extra amounts and extra GST
  let totalExtraAmount = 0;
  let totalExtraGst = 0;
  const extraTitlesAdded = new Set<string>();
  let hasNetMeteringItem = false;

  // 2. Extra items from quotation items array (if any)
  extraItems.forEach(item => {
    extraTitlesAdded.add(item.productName.trim().toLowerCase());
    if (/net[\s-]?meter/i.test(item.productName) || /net[\s-]?meter/i.test(item.description || '')) {
      hasNetMeteringItem = true;
    }
    const itemGstPct = Number(item.gstPercentage ?? (isPackageGstApplied ? packageGstPct : 0));
    let itemBaseAmount: number;
    let itemGst: number;
    if (itemGstPct > 0) {
      itemBaseAmount = Math.round(item.lineTotal / (1 + (itemGstPct / 100)));
      itemGst = item.lineTotal - itemBaseAmount;
    } else {
      itemBaseAmount = item.lineTotal;
      itemGst = 0;
    }
    totalExtraAmount += itemBaseAmount;
    totalExtraGst += itemGst;

    pricingRows.push({
      description: item.productName,
      subDescription: item.description || undefined,
      amount: itemBaseAmount > 0 ? formatPrice(itemBaseAmount) : '0'
    });
  });

  // Extra charge from quotation.extra if present and not already added from extraItems
  if (quotation.extra && quotation.extra.value !== undefined && quotation.extra.value !== null && quotation.extra.value !== "") {
    const extraVal = Number(quotation.extra.value);
    const normalizedTitle = (quotation.extra.title || '').trim().toLowerCase();
    const alreadyAdded = Boolean(normalizedTitle && extraTitlesAdded.has(normalizedTitle));

    if (/net[\s-]?meter/i.test(quotation.extra.title || '') || /net[\s-]?meter/i.test(quotation.extra.description || '')) {
      hasNetMeteringItem = true;
    }

    if (!alreadyAdded && !isNaN(extraVal) && extraVal > 0) {
      const isExtraGstApplied = Boolean(quotation.extra.isGstApplied);
      const extraGstPct = Number(quotation.extra.gstPercentage ?? (isPackageGstApplied ? packageGstPct : 18));

      let displayedExtraAmount: number;
      let extraGstAmount: number;

      if (isExtraGstApplied && extraGstPct > 0) {
        displayedExtraAmount = Math.round(extraVal / (1 + (extraGstPct / 100)));
        extraGstAmount = extraVal - displayedExtraAmount;
      } else {
        displayedExtraAmount = extraVal;
        extraGstAmount = 0;
      }

      totalExtraAmount += displayedExtraAmount;
      totalExtraGst += extraGstAmount;

      const title = quotation.extra.title || 'Extra Charges';

      pricingRows.push({
        description: title,
        subDescription: quotation.extra.description || undefined,
        amount: formatPrice(displayedExtraAmount)
      });
    }
  }

  // 3. Net-Metering Cost (Rendered as As Actual To Be Paid By The Customer)
  if (!hasNetMeteringItem) {
    pricingRows.push({
      description: 'Net-Metering Cost',
      amount: 'As Actual To Be Paid By The Customer',
      isCustomText: true,
      isBoldText: true
    });
  }

  // 4. GST: Deducted from package and extra, shown here if GST is applied
  const totalGstAmount = packageGstAmount + totalExtraGst;
  if (totalGstAmount > 0) {
    pricingRows.push({
      description: 'GST',
      amount: formatPrice(totalGstAmount)
    });
  }

  // Special Discount if any
  if (quotation.discount && quotation.discount > 0) {
    pricingRows.push({
      description: 'Special Discount',
      amount: `- ${formatPrice(quotation.discount)}`,
      isNegative: true
    });
  }

  // 5. Grand Total Cost Of The Project
  const grandTotalAmount = displayedPackageAmount + totalExtraAmount + totalGstAmount - (quotation.discount || 0);
  pricingRows.push({
    description: 'Grand Total Cost Of The Project',
    amount: formatPrice(grandTotalAmount),
    isBold: true
  });

  // 6. Subsidy: only subsidy name
  let subsidyAmount = 0;
  if (subsidy && subsidy.showSubsidy && subsidy.subsidyData && subsidy.subsidyData.length > 0) {
    subsidy.subsidyData.forEach(sub => {
      subsidyAmount += sub.amount;
      pricingRows.push({
        description: sub.name || 'Subsidy',
        amount: sub.amount > 0 ? `- ${formatPrice(sub.amount)}` : '0',
        isNegative: sub.amount > 0
      });
    });
  } else {
    pricingRows.push({
      description: 'Subsidy',
      amount: '0'
    });
  }

  // 7. Final Effective Cost to Customer After Subsidy
  const finalCost = Math.max(0, grandTotalAmount - subsidyAmount);
  pricingRows.push({
    description: 'Final Effective Cost to Customer After Subsidy',
    amount: formatPrice(finalCost),
    isHighlight: true
  });

  const pricingRowsHtml = pricingRows.map(row => {
    let rowClass = 'pricing-row';
    if (row.isBold) rowClass += ' grand-total-row';
    if (row.isHighlight) rowClass += ' highlight-row';
    if (row.isBoldText) rowClass += ' bold-text-row';

    let amountClass = 'col-amount';
    if (row.isCustomText) amountClass += ' amount-text';
    if (row.isNegative) amountClass += ' amount-negative';

    return `
      <tr class="${rowClass}">
        <td class="col-desc">
          <div class="item-name">${row.description}</div>
          ${row.subDescription ? `<div class="item-subdesc">${row.subDescription}</div>` : ''}
        </td>
        <td class="${amountClass}">${row.amount}</td>
      </tr>
    `;
  }).join('');

  // Build Bill of Materials (BOM) for Page 4 — structured dynamically by product category
  type BomLayoutType = 'panel' | 'inverter' | 'cables' | 'structure' | 'accessories' | 'other';

  function getProductLayoutType(item: (typeof items)[0]): BomLayoutType {
    const cat = (item.categoryName || '').toLowerCase().trim();
    if (cat.includes('panel') || cat.includes('module')) return 'panel';
    if (cat.includes('inverter')) return 'inverter';
    if (cat.includes('cable') || cat.includes('wire')) return 'cables';
    if (cat.includes('structure') || cat.includes('mounting')) return 'structure';
    if (cat.includes('accessor') || cat.includes('electrical')) return 'accessories';

    // Fallback if categoryName is missing: infer from productName
    const name = item.productName.toLowerCase();
    if (name.includes('panel') || name.includes('module') || name.includes('solar plate')) return 'panel';
    if (name.includes('inverter')) return 'inverter';
    if (name.includes('cable') || name.includes('wire')) return 'cables';
    if (name.includes('structure') || name.includes('mounting') || name.includes('hdgi') || name.includes('rail')) return 'structure';
    if (name.includes('acdb') || name.includes('dcdb') || name.includes('earthing') || name.includes('arrestor') || name.includes('mcb')) return 'accessories';

    return 'other';
  }

  // Group items by layout category and preserve actual category labels
  const bomGroups = {
    panel: [] as typeof items,
    inverter: [] as typeof items,
    cables: [] as typeof items,
    structure: [] as typeof items,
    accessories: [] as typeof items,
    other: new Map<string, typeof items>()
  };

  items.forEach(item => {
    const layoutType = getProductLayoutType(item);
    if (layoutType === 'other') {
      const catLabel = item.categoryName || 'Other Equipment';
      if (!bomGroups.other.has(catLabel)) {
        bomGroups.other.set(catLabel, []);
      }
      bomGroups.other.get(catLabel)!.push(item);
    } else {
      bomGroups[layoutType].push(item);
    }
  });

  // Helper: extract watt peak from product specs or name
  function extractWattPeak(item: (typeof items)[0]): string {
    if (item.capacity) {
      return `${item.capacity} ${item.capacityUnit || 'Wp'}`;
    }
    const m = item.productName.match(/(\d+)\s*[wW][pP]?\b/);
    return m ? `${m[1]} Wp` : '';
  }

  // Helper: extract kW size from product specs or name
  function extractKwSize(item: (typeof items)[0]): string {
    if (item.capacity) {
      return `${item.capacity} ${item.capacityUnit || 'kW'}`;
    }
    const m = item.productName.match(/(\d+\.?\d*)\s*[kK][wW]/);
    return m ? `${m[1]} kW` : '';
  }

  // Helper: classify cable type label
  function getCableTypeLabel(name: string): string {
    const n = name.toLowerCase();
    if (/earthing/i.test(n)) return 'Earthing Cable:';
    if (/\bla\b/i.test(n)) return 'LA Cable:';
    if (/\bdc\b|d\.?c/i.test(n)) return 'DC Cable:';
    return 'AC Cable:';
  }

  // ── Panel Section HTML ──
  let bomPanelHtml = '';
  if (bomGroups.panel.length > 0) {
    const panelCards = bomGroups.panel.map(p => {
      const wattPeak = extractWattPeak(p);
      const catLabel = p.categoryName || 'Panel';
      const panelIconHtml = p.categoryImage
        ? `<img src="${p.categoryImage}" alt="${catLabel}" class="bom-category-img" />`
        : `<svg viewBox="0 0 32 32" width="32" height="32" fill="none">
              <rect x="2" y="2" width="13" height="13" rx="1.5" fill="#1E88E5"/>
              <rect x="17" y="2" width="13" height="13" rx="1.5" fill="#1E88E5"/>
              <rect x="2" y="17" width="13" height="13" rx="1.5" fill="#1E88E5"/>
              <rect x="17" y="17" width="13" height="13" rx="1.5" fill="#1E88E5"/>
            </svg>`;
      return `
      <div class="bom-card">
        <div class="bom-card-inner">
          <div class="bom-card-icon">
            ${panelIconHtml}
          </div>
          <div class="bom-card-content">
            <div class="bom-panel-row">
              <div class="bom-field">
                <div class="bom-field-label">Watt Peak:</div>
                <div class="bom-field-val">${wattPeak || '-'}</div>
              </div>
              <div class="bom-field">
                <div class="bom-field-label">Panel Qty:</div>
                <div class="bom-field-val">${p.quantity} ${p.unitName || 'Nos'}</div>
              </div>
              <div class="bom-field" style="flex:1.4;">
                <div class="bom-field-label">Panel Type:</div>
                <div class="bom-field-val">${p.productName}</div>
              </div>
              <div class="bom-field">
                <div class="bom-field-label">Panel Make:</div>
                <div class="bom-field-val">${p.brandName || '-'}</div>
              </div>
              <div class="bom-field">
                <div class="bom-field-label">Panel Warranty:</div>
                <div class="bom-field-val-sm">${p.warranty || '12 Year'}</div>
                <div class="bom-field-label" style="margin-top:2px;">Performance Warranty:</div>
                <div class="bom-field-val-sm">25 Year</div>
              </div>
              <div class="bom-brand-logo">
                <span class="bom-brand-name-blue">${p.brandName || ''}</span>
                <span class="bom-brand-sub">Solar</span>
              </div>
            </div>
          </div>
        </div>
        <span class="bom-card-tag">${catLabel}</span>
      </div>
      `;
    }).join('');
    bomPanelHtml = panelCards;
  }

  // ── Inverter Section HTML ──
  let bomInverterHtml = '';
  if (bomGroups.inverter.length > 0) {
    const inverterCards = bomGroups.inverter.map(inv => {
      const kwSize = extractKwSize(inv);
      const catLabel = inv.categoryName || 'Inverter';
      const inverterIconHtml = inv.categoryImage
        ? `<img src="${inv.categoryImage}" alt="${catLabel}" class="bom-category-img" />`
        : `<svg viewBox="0 0 32 32" width="32" height="32" fill="none">
              <rect x="3" y="3" width="26" height="26" rx="4" fill="#1e293b"/>
              <rect x="6" y="6" width="20" height="9" rx="2" fill="#0284c7"/>
              <circle cx="8" cy="22" r="2" fill="#ef4444"/>
              <circle cx="14" cy="22" r="2" fill="#eab308"/>
              <circle cx="20" cy="22" r="2" fill="#22c55e"/>
              <circle cx="26" cy="22" r="2" fill="#3b82f6"/>
            </svg>`;
      return `
      <div class="bom-card">
        <div class="bom-card-inner">
          <div class="bom-card-icon">
            ${inverterIconHtml}
          </div>
          <div class="bom-card-content">
            <div class="bom-inverter-top">
              <div class="bom-field">
                <div class="bom-field-label">Inverter Size:</div>
                <div class="bom-field-val">${kwSize || '-'}</div>
              </div>
              <div class="bom-field">
                <div class="bom-field-label">Inverter Qty:</div>
                <div class="bom-field-val">${inv.quantity} ${inv.unitName || 'Nos'}</div>
              </div>
              <div class="bom-field" style="flex:1.2;">
                <div class="bom-field-label">Inverter Make:</div>
                <div class="bom-field-val">${inv.brandName || '-'}</div>
              </div>
              <div class="bom-field">
                <div class="bom-field-label">Inverter Warranty:</div>
                <div class="bom-field-val">${inv.warranty || '7 Year'}</div>
              </div>
              <div class="bom-brand-logo">
                <span class="bom-brand-name-red">${inv.brandName || ''}</span>
              </div>
            </div>
            <div class="bom-alt-box">
              <div class="bom-alt-title">ALTERNATIVE PRODUCTS</div>
              <div class="bom-alt-sub">May be supplied if the primary product is unavailable, with equivalent specification.</div>
              <div class="bom-alt-items">${inv.description || `${inv.productName} - Equivalent`}</div>
            </div>
          </div>
        </div>
        <span class="bom-card-tag">${catLabel}</span>
      </div>
      `;
    }).join('');
    bomInverterHtml = inverterCards;
  }

  // ── Cables Section HTML — grid cards ──
  let bomCablesHtml = '';
  if (bomGroups.cables.length > 0) {
    const allCards = bomGroups.cables;
    const firstRowCards = allCards.slice(0, 4);
    const restCards = allCards.slice(4);

    const firstRowHtml = firstRowCards.map(c => `
      <div class="bom-cable-col">
        <div class="bom-cable-type">${getCableTypeLabel(c.productName)}</div>
        <div class="bom-cable-make">${c.brandName || '-'}</div>
        <div class="bom-cable-qty">Qty: ${c.quantity} ${c.unitName || 'Meter'}</div>
        <div class="bom-cable-spec">${c.description || c.productName}</div>
        ${c.brandName ? `<div class="bom-cable-brand-badge">${c.brandName.toUpperCase()}</div>` : ''}
      </div>
    `).join('');

    const restRowHtml = restCards.length > 0 ? restCards.map(c => `
      <div class="bom-cable-col">
        <div class="bom-cable-type">${getCableTypeLabel(c.productName)}</div>
        <div class="bom-cable-make">${c.brandName || '-'}</div>
        <div class="bom-cable-qty">Qty: ${c.quantity} ${c.unitName || 'Meter'}</div>
        <div class="bom-cable-spec">${c.description || c.productName}</div>
        ${c.brandName ? `<div class="bom-cable-brand-badge">${c.brandName.toUpperCase()}</div>` : ''}
      </div>
    `).join('') : '';

    const cablesCatLabel = bomGroups.cables[0]?.categoryName || 'Cables & Wires';
    const cablesCatImg = bomGroups.cables.find(c => c.categoryImage)?.categoryImage || null;
    const cablesIconHtml = cablesCatImg
      ? `<img src="${cablesCatImg}" alt="${cablesCatLabel}" class="bom-category-img" />`
      : `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="#E65100" stroke-width="3" stroke-linecap="round">
              <path d="M4 14 Q 10 8, 16 14 T 28 14"/>
              <path d="M4 20 Q 10 14, 16 20 T 28 20" stroke="#FB8C00" stroke-width="2"/>
            </svg>`;
    bomCablesHtml = `
      <div class="bom-card">
        <div class="bom-card-inner">
          <div class="bom-card-icon">
            ${cablesIconHtml}
          </div>
          <div class="bom-card-content">
            <div class="bom-cable-grid-4">${firstRowHtml}</div>
            ${restRowHtml ? `<div class="bom-cable-grid-2">${restRowHtml}</div>` : ''}
          </div>
        </div>
        <span class="bom-card-tag">${cablesCatLabel}</span>
      </div>
    `;
  } else {
    // Standard system cables fallback
    bomCablesHtml = `
      <div class="bom-card">
        <div class="bom-card-inner">
          <div class="bom-card-icon">
            <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="#E65100" stroke-width="3" stroke-linecap="round">
              <path d="M4 14 Q 10 8, 16 14 T 28 14"/>
              <path d="M4 20 Q 10 14, 16 20 T 28 20" stroke="#FB8C00" stroke-width="2"/>
            </svg>
          </div>
          <div class="bom-card-content">
            <div class="bom-cable-grid-4">
              <div class="bom-cable-col">
                <div class="bom-cable-type">AC Cable:</div>
                <div class="bom-cable-make">Polycab / KEI</div>
                <div class="bom-cable-qty">Qty: 25 Meter</div>
                <div class="bom-cable-spec">A.C 4.0 SQMM 4 CORE COPPER</div>
                <div class="bom-cable-brand-badge">POLYCAB</div>
              </div>
              <div class="bom-cable-col">
                <div class="bom-cable-type">DC Cable:</div>
                <div class="bom-cable-make">Waaree / Polycab</div>
                <div class="bom-cable-qty">Qty: 20 Meter</div>
                <div class="bom-cable-spec">D.C CABLE RED 4.0 SQMM (UV)</div>
                <div class="bom-cable-brand-badge">WAAREE</div>
              </div>
              <div class="bom-cable-col">
                <div class="bom-cable-type">DC Cable:</div>
                <div class="bom-cable-make">Waaree / Polycab</div>
                <div class="bom-cable-qty">Qty: 20 Meter</div>
                <div class="bom-cable-spec">D.C CABLE BLACK 4.0 SQMM (UV)</div>
                <div class="bom-cable-brand-badge">WAAREE</div>
              </div>
              <div class="bom-cable-col">
                <div class="bom-cable-type">Earthing Cable:</div>
                <div class="bom-cable-make">Earthcab / Polycab</div>
                <div class="bom-cable-qty">Qty: 50 Meter</div>
                <div class="bom-cable-spec">COPPER EARTHING 16 SQMM GREEN</div>
              </div>
            </div>
            <div class="bom-cable-grid-2">
              <div class="bom-cable-col">
                <div class="bom-cable-type">LA Cable:</div>
                <div class="bom-cable-make">Earthcab / Polycab</div>
                <div class="bom-cable-qty">Qty: 25 Meter</div>
                <div class="bom-cable-spec">LIGHTNING ARRESTER COPPER 25 SQMM</div>
              </div>
              <div class="bom-cable-col">
                <div class="bom-cable-type">Communication Cable:</div>
                <div class="bom-cable-make">D-Link / Polycab</div>
                <div class="bom-cable-qty">Qty: 10 Meter</div>
                <div class="bom-cable-spec">RS485 / CAT6 SHIELDED CABLE</div>
              </div>
            </div>
          </div>
        </div>
        <span class="bom-card-tag">Cables & Wires</span>
      </div>
    `;
  }

  // ── Structure Section HTML ──
  let bomStructureHtml = '';
  if (bomGroups.structure.length > 0) {
    const rowsHtml = bomGroups.structure.map(item => `
      <div class="bom-struct-grid-row">
        <div>
          <div class="bom-struct-lbl">Product:</div>
          <div class="bom-struct-v">${item.productName}</div>
        </div>
        <div>
          <div class="bom-struct-lbl">Qty:</div>
          <div class="bom-struct-v">${item.quantity} ${item.unitName || 'NOS'}</div>
        </div>
        <div>
          <div class="bom-struct-lbl">Make:</div>
          <div class="bom-struct-v">${item.brandName || 'As per Industry Standard'}</div>
        </div>
      </div>
    `).join('');

    const structureCatLabel = bomGroups.structure[0]?.categoryName || 'Mounting Structures';
    const structureCatImg = bomGroups.structure.find(s => s.categoryImage)?.categoryImage || null;
    const structureIconHtml = structureCatImg
      ? `<img src="${structureCatImg}" alt="${structureCatLabel}" class="bom-category-img" />`
      : `<svg viewBox="0 0 32 32" width="32" height="32" fill="#475569">
              <rect x="4" y="12" width="24" height="8" rx="1.5"/>
              <rect x="4" y="7" width="6" height="18" rx="1.5"/>
              <rect x="22" y="7" width="6" height="18" rx="1.5"/>
            </svg>`;
    bomStructureHtml = `
      <div class="bom-card">
        <div class="bom-card-inner">
          <div class="bom-card-icon">
            ${structureIconHtml}
          </div>
          <div class="bom-card-content">
            <div class="bom-struct-list">${rowsHtml}</div>
          </div>
        </div>
        <span class="bom-card-tag">${structureCatLabel}</span>
      </div>
    `;
  } else {
    // Standard structure fallback matching system panels
    const totalPanels = bomGroups.panel.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0) || Math.round(Number(quotation.systemSize) * 2) || 9;
    bomStructureHtml = `
      <div class="bom-card">
        <div class="bom-card-inner">
          <div class="bom-card-icon">
            <svg viewBox="0 0 32 32" width="32" height="32" fill="#475569">
              <rect x="4" y="12" width="24" height="8" rx="1.5"/>
              <rect x="4" y="7" width="6" height="18" rx="1.5"/>
              <rect x="22" y="7" width="6" height="18" rx="1.5"/>
            </svg>
          </div>
          <div class="bom-card-content">
            <div class="bom-struct-list">
              <div class="bom-struct-grid-row">
                <div>
                  <div class="bom-struct-lbl">Product:</div>
                  <div class="bom-struct-v">Galvanized Iron Structure 80 Micron (HDGI) - ${totalPanels} Modules</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Qty:</div>
                  <div class="bom-struct-v">1 Set</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Make:</div>
                  <div class="bom-struct-v">SunSelect Standard Heavy Duty Galvanized</div>
                </div>
              </div>
              <div class="bom-struct-grid-row">
                <div>
                  <div class="bom-struct-lbl">Product:</div>
                  <div class="bom-struct-v">Aluminium Mid Clamps & End Clamps with SS304 Hardware</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Qty:</div>
                  <div class="bom-struct-v">${totalPanels * 4} Nos</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Make:</div>
                  <div class="bom-struct-v">Anodized High Grade Aluminium AL6005-T5</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <span class="bom-card-tag">Mounting Structures</span>
      </div>
    `;
  }

  // ── Accessories Section HTML (Components & Distribution Boxes) ──
  let bomAccessoriesHtml = '';
  if (bomGroups.accessories.length > 0) {
    const isDbItem = (item: (typeof items)[0]) => /acdb|dcdb|earthing|arrestor|arrester|lightning|lightening/i.test(item.productName);
    const dbItems = bomGroups.accessories.filter(isDbItem);
    const nonDbItems = bomGroups.accessories.filter(i => !isDbItem(i));

    let nonDbCardHtml = '';
    if (nonDbItems.length > 0) {
      const rowsHtml = nonDbItems.map(item => `
        <div class="bom-struct-grid-row">
          <div>
            <div class="bom-struct-lbl">Product:</div>
            <div class="bom-struct-v">${item.productName}</div>
          </div>
          <div>
            <div class="bom-struct-lbl">Qty:</div>
            <div class="bom-struct-v">${item.quantity} ${item.unitName || 'NOS'}</div>
          </div>
          <div>
            <div class="bom-struct-lbl">Make:</div>
            <div class="bom-struct-v">${item.brandName || 'As per Industry Standard'}</div>
          </div>
        </div>
      `).join('');

      const accessoriesCatLabel = bomGroups.accessories[0]?.categoryName || 'Accessories';
      const accessoriesCatImg = bomGroups.accessories.find(a => a.categoryImage)?.categoryImage || null;
      const accessoriesIconHtml = accessoriesCatImg
        ? `<img src="${accessoriesCatImg}" alt="${accessoriesCatLabel}" class="bom-category-img" />`
        : `<svg viewBox="0 0 32 32" width="32" height="32" fill="none">
              <rect x="3" y="3" width="12" height="12" rx="2" fill="#1e293b"/>
              <rect x="17" y="3" width="12" height="12" rx="2" fill="#ea580c"/>
              <rect x="3" y="17" width="12" height="12" rx="2" fill="#ea580c"/>
              <rect x="17" y="17" width="12" height="12" rx="2" fill="#1e293b"/>
            </svg>`;
      nonDbCardHtml = `
      <div class="bom-card">
        <div class="bom-card-inner">
          <div class="bom-card-icon">
            ${accessoriesIconHtml}
          </div>
          <div class="bom-card-content">
            <div class="bom-struct-list">${rowsHtml}</div>
          </div>
        </div>
        <span class="bom-card-tag">${accessoriesCatLabel}</span>
      </div>
      `;
    }

    let dbCardHtml = '';
    const findVal = (regex: RegExp) => {
      const found = dbItems.find(i => regex.test(i.productName));
      return found ? found.productName : null;
    };

    const acdbVal = findVal(/acdb/i) || '3-Phase ACDB with MCB & Type II SPD';
    const dcdbVal = findVal(/dcdb/i) || '1000V DCDB with 15A Fuse & SPD';
    const earthingVal = findVal(/earthing/i) || 'Dual Earth Pit with Chemical Compound';
    const laVal = findVal(/arrestor|arrester|lightning|lightening/i) || 'Class B+C Surge Protection Device';

    dbCardHtml = `
    <div class="bom-card">
      <div class="bom-card-inner">
        <div class="bom-card-icon">
          <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="4" fill="#0f172a"/>
            <rect x="5" y="5" width="10" height="10" rx="1.5" fill="#38bdf8"/>
            <rect x="17" y="5" width="10" height="10" rx="1.5" fill="#f97316"/>
            <rect x="5" y="17" width="10" height="10" rx="1.5" fill="#22c55e"/>
            <rect x="17" y="17" width="10" height="10" rx="1.5" fill="#eab308"/>
          </svg>
        </div>
        <div class="bom-card-content">
          <div class="bom-db-row">
            <div class="bom-db-col">
              <div class="bom-db-lbl">ACDB:</div>
              <div class="bom-db-v">${acdbVal}</div>
            </div>
            <div class="bom-db-col">
              <div class="bom-db-lbl">DCDB:</div>
              <div class="bom-db-v">${dcdbVal}</div>
            </div>
            <div class="bom-db-col">
              <div class="bom-db-lbl">Earthing:</div>
              <div class="bom-db-v">${earthingVal}</div>
            </div>
            <div class="bom-db-col">
              <div class="bom-db-lbl">Lightening Arrestor:</div>
              <div class="bom-db-v">${laVal}</div>
            </div>
            <div class="bom-db-col">
              <div class="bom-db-lbl">Miscellaneous:</div>
              <div class="bom-db-v">Cable Ties, Danger Board, Warning Stickers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;

    bomAccessoriesHtml = nonDbCardHtml + dbCardHtml;
  } else {
    // Standard accessories and distribution boxes fallback
    bomAccessoriesHtml = `
      <div class="bom-card">
        <div class="bom-card-inner">
          <div class="bom-card-icon">
            <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
              <rect x="3" y="3" width="12" height="12" rx="2" fill="#1e293b"/>
              <rect x="17" y="3" width="12" height="12" rx="2" fill="#ea580c"/>
              <rect x="3" y="17" width="12" height="12" rx="2" fill="#ea580c"/>
              <rect x="17" y="17" width="12" height="12" rx="2" fill="#1e293b"/>
            </svg>
          </div>
          <div class="bom-card-content">
            <div class="bom-struct-list">
              <div class="bom-struct-grid-row">
                <div>
                  <div class="bom-struct-lbl">Product:</div>
                  <div class="bom-struct-v">MC4 Connectors (1000V DC / 1500V DC IP68 Rated)</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Qty:</div>
                  <div class="bom-struct-v">4 Pairs</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Make:</div>
                  <div class="bom-struct-v">Waaree / Staubli Multi-Contact</div>
                </div>
              </div>
              <div class="bom-struct-grid-row">
                <div>
                  <div class="bom-struct-lbl">Product:</div>
                  <div class="bom-struct-v">Copper Bonded Chemical Earthing Rods (17.2mm Dia x 3m Length)</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Qty:</div>
                  <div class="bom-struct-v">2 Sets</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Make:</div>
                  <div class="bom-struct-v">Earthcab / SunSelect Certified (250 Micron)</div>
                </div>
              </div>
              <div class="bom-struct-grid-row">
                <div>
                  <div class="bom-struct-lbl">Product:</div>
                  <div class="bom-struct-v">Conventional Lightning Arrester 1-Meter Pure Copper Spike</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Qty:</div>
                  <div class="bom-struct-v">1 Nos</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Make:</div>
                  <div class="bom-struct-v">SunSelect Standard Copper Spike with Base</div>
                </div>
              </div>
              <div class="bom-struct-grid-row">
                <div>
                  <div class="bom-struct-lbl">Product:</div>
                  <div class="bom-struct-v">PVC UV-Resistant Conduits, Cable Trays & SS304 Fasteners</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Qty:</div>
                  <div class="bom-struct-v">1 Lot</div>
                </div>
                <div>
                  <div class="bom-struct-lbl">Make:</div>
                  <div class="bom-struct-v">Precision / Astral / Standard Industry Grade</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <span class="bom-card-tag">Accessories</span>
      </div>

      <div class="bom-card">
        <div class="bom-card-inner">
          <div class="bom-card-icon">
            <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
              <rect x="2" y="2" width="28" height="28" rx="4" fill="#0f172a"/>
              <rect x="5" y="5" width="10" height="10" rx="1.5" fill="#38bdf8"/>
              <rect x="17" y="5" width="10" height="10" rx="1.5" fill="#f97316"/>
              <rect x="5" y="17" width="10" height="10" rx="1.5" fill="#22c55e"/>
              <rect x="17" y="17" width="10" height="10" rx="1.5" fill="#eab308"/>
            </svg>
          </div>
          <div class="bom-card-content">
            <div class="bom-db-row">
              <div class="bom-db-col">
                <div class="bom-db-lbl">ACDB:</div>
                <div class="bom-db-v">3-Phase ACDB with MCB & Type II SPD</div>
              </div>
              <div class="bom-db-col">
                <div class="bom-db-lbl">DCDB:</div>
                <div class="bom-db-v">1000V DCDB with 15A Fuse & SPD</div>
              </div>
              <div class="bom-db-col">
                <div class="bom-db-lbl">Earthing:</div>
                <div class="bom-db-v">Dual Earth Pit with Chemical Compound</div>
              </div>
              <div class="bom-db-col">
                <div class="bom-db-lbl">Lightening Arrestor:</div>
                <div class="bom-db-v">Class B+C Surge Protection Device</div>
              </div>
              <div class="bom-db-col">
                <div class="bom-db-lbl">Miscellaneous:</div>
                <div class="bom-db-v">Cable Ties, Danger Board, Warning Stickers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Other Categories (Batteries, Custom Equipment) ──
  let bomOtherHtml = '';
  for (const [catName, catItems] of bomGroups.other.entries()) {
    const rowsHtml = catItems.map(item => `
      <div class="bom-struct-grid-row">
        <div>
          <div class="bom-struct-lbl">Product:</div>
          <div class="bom-struct-v">${item.productName}</div>
        </div>
        <div>
          <div class="bom-struct-lbl">Qty:</div>
          <div class="bom-struct-v">${item.quantity} ${item.unitName || 'NOS'}</div>
        </div>
        <div>
          <div class="bom-struct-lbl">Make:</div>
          <div class="bom-struct-v">${item.brandName || 'As per Industry Standard'}</div>
        </div>
      </div>
    `).join('');

    const otherCatImg = catItems.find(i => i.categoryImage)?.categoryImage || null;
    const otherIconHtml = otherCatImg
      ? `<img src="${otherCatImg}" alt="${catName}" class="bom-category-img" />`
      : `<svg viewBox="0 0 32 32" width="32" height="32" fill="none">
              <rect x="4" y="4" width="24" height="24" rx="3" fill="#0f172a"/>
              <circle cx="16" cy="16" r="6" stroke="#38bdf8" stroke-width="2"/>
            </svg>`;

    bomOtherHtml += `
      <div class="bom-card">
        <div class="bom-card-inner">
          <div class="bom-card-icon">
            ${otherIconHtml}
          </div>
          <div class="bom-card-content">
            <div class="bom-struct-list">${rowsHtml}</div>
          </div>
        </div>
        <span class="bom-card-tag">${catName}</span>
      </div>
    `;
  }

  // Combine all BOM sections
  const bomSectionsHtml = bomPanelHtml + bomInverterHtml + bomCablesHtml + bomStructureHtml + bomAccessoriesHtml + bomOtherHtml;

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
  
  const totalCost = grandTotalAmount || Number(quotation.grandTotal) || Number(quotation.subtotal) || (systemSizeNum * 50000);
  const effectiveCost = (subsidy && subsidy.showSubsidy && finalCost > 0)
    ? finalCost
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
     PAGE 3: PROPOSAL TABLE (IMAGE 2 MINIMALIST DESIGN)
     ======================================================== */
  table.proposal-table{
    width:100%;
    border-collapse:collapse;
    margin-top:10px;
    margin-bottom:6px;
    background:#ffffff;
  }

  table.proposal-table thead th{
    font-family:var(--font-heading);
    background-color:#F8FAFC;
    color:#0F172A;
    font-weight:700;
    font-size:13px;
    padding:12px 18px;
    border-top:1px solid #E2E8F0;
    border-bottom:2px solid #E2E8F0;
    letter-spacing:0.2px;
  }

  table.proposal-table thead th.col-desc{
    text-align:left;
    width:68%;
  }

  table.proposal-table thead th.col-amount{
    text-align:right;
    width:32%;
  }

  table.proposal-table tbody td{
    padding:11px 18px;
    border-bottom:1px solid #E2E8F0;
    vertical-align:middle;
    font-size:12.5px;
    line-height:1.45;
  }

  table.proposal-table tbody td.col-desc{
    text-align:left;
    color:#1E293B;
  }

  table.proposal-table tbody td.col-desc .item-name{
    font-family:var(--font-heading);
    font-weight:600;
    color:#1E293B;
    font-size:12.5px;
  }

  table.proposal-table tbody td.col-desc .item-subdesc{
    font-size:11px;
    color:#64748B;
    margin-top:2px;
    font-weight:400;
  }

  table.proposal-table tbody td.col-amount{
    text-align:right;
    font-family:var(--font-heading);
    font-weight:600;
    color:#1E293B;
    font-size:13px;
    white-space:nowrap;
  }

  table.proposal-table tbody tr.bold-text-row td.col-desc .item-name{
    font-weight:700;
    color:#0F172A;
  }

  table.proposal-table tbody td.amount-text{
    font-family:var(--font-heading);
    font-size:12px;
    font-weight:700;
    color:#0F172A;
    font-style:normal;
    white-space:normal;
  }

  table.proposal-table tbody td.amount-negative{
    color:var(--red);
    font-weight:700;
  }

  /* Grand Total Cost Of The Project Row - Balanced Bold */
  table.proposal-table tbody tr.grand-total-row td{
    border-top:1.5px solid #CBD5E1;
    border-bottom:1.5px solid #CBD5E1;
    padding-top:12px;
    padding-bottom:12px;
  }

  table.proposal-table tbody tr.grand-total-row td.col-desc .item-name{
    font-family:var(--font-heading);
    font-weight:800;
    color:#0F172A;
    font-size:13px;
    letter-spacing:0.1px;
    -webkit-text-stroke:0.18px currentColor;
  }

  table.proposal-table tbody tr.grand-total-row td.col-amount{
    font-family:var(--font-heading);
    font-weight:800;
    color:#0F172A;
    font-size:14px;
    letter-spacing:0.15px;
    -webkit-text-stroke:0.18px currentColor;
  }

  /* Final Effective Cost to Customer After Subsidy - Balanced Bold Highlighted Row */
  table.proposal-table tbody tr.highlight-row td{
    background-color:#F1F5F9;
    border-top:1.5px solid #CBD5E1;
    border-bottom:1.5px solid #CBD5E1;
    padding:13px 18px;
  }

  table.proposal-table tbody tr.highlight-row td.col-desc .item-name{
    font-family:var(--font-heading);
    font-weight:800;
    color:#0B132B;
    font-size:13.5px;
    letter-spacing:0.1px;
    -webkit-text-stroke:0.2px currentColor;
  }

  table.proposal-table tbody tr.highlight-row td.col-amount{
    font-family:var(--font-heading);
    font-weight:800;
    color:#0B132B;
    font-size:15px;
    letter-spacing:0.15px;
    -webkit-text-stroke:0.2px currentColor;
  }

  .pricing-footnote{
    font-size:11px;
    color:#64748B;
    margin-top:8px;
    margin-bottom:20px;
    padding-left:2px;
  }

  /* ========================================================
     PAGE 4: BILL OF MATERIAL — SOLAR EARTH EXACT DESIGN
     ======================================================== */

  .bom-card{
    border:1px solid #d4d4d8;
    border-radius:8px;
    position:relative;
    margin-bottom:12px;
    background:transparent;
    padding:8px 14px 10px 14px;
  }
  .bom-card-tag{
    position:absolute;
    bottom:-7px;
    left:22px;
    background:#ffffff;
    padding:0 8px;
    font-weight:700;
    font-size:10px;
    color:#1e293b;
    line-height:1;
    letter-spacing:0.2px;
  }

  .bom-card-inner{
    display:flex;
    align-items:flex-start;
    gap:14px;
  }
  .bom-card-icon{
    width:32px;
    height:32px;
    flex-shrink:0;
    margin-top:2px;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .bom-category-img{
    width:32px;
    height:32px;
    object-fit:contain;
    display:block;
  }
  .bom-card-content{
    flex:1;
    min-width:0;
  }

  /* Field Styles */
  .bom-field{ min-width:0; }
  .bom-field-label{
    font-size:7.5px;
    font-weight:700;
    color:#3f3f46;
    margin-bottom:1.5px;
    white-space:nowrap;
  }
  .bom-field-val{
    font-size:10px;
    font-weight:700;
    color:#09090b;
    line-height:1.25;
  }
  .bom-field-val-sm{
    font-size:8.5px;
    font-weight:700;
    color:#09090b;
    line-height:1.2;
  }

  /* Panel Card */
  .bom-panel-row{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:10px;
  }
  .bom-brand-logo{
    display:flex;
    flex-direction:column;
    align-items:flex-end;
    justify-content:center;
    flex-shrink:0;
  }
  .bom-brand-name-blue{
    font-size:14px;
    font-weight:800;
    color:#0284c7;
    letter-spacing:0.5px;
    line-height:1;
  }
  .bom-brand-sub{
    font-size:7px;
    font-weight:600;
    color:#64748b;
    letter-spacing:0.5px;
  }

  /* Inverter Card */
  .bom-inverter-top{
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:10px;
    margin-bottom:6px;
  }
  .bom-brand-name-red{
    font-size:14px;
    font-weight:900;
    color:#dc2626;
    letter-spacing:0.5px;
    text-transform:uppercase;
  }
  .bom-alt-box{
    background:#FFFDF5;
    border-left:3px solid #d97706;
    padding:4px 8px;
    border-radius:0 3px 3px 0;
  }
  .bom-alt-title{
    font-size:7.5px;
    font-weight:800;
    color:#1e3a8a;
    letter-spacing:0.3px;
    margin-bottom:1px;
  }
  .bom-alt-sub{
    font-size:6.5px;
    font-style:italic;
    color:#71717a;
    margin-bottom:1px;
  }
  .bom-alt-items{
    font-size:7px;
    font-weight:600;
    color:#27272a;
    line-height:1.3;
  }

  /* Cables Grid */
  .bom-cable-grid-4{
    display:grid;
    grid-template-columns:repeat(4, 1fr);
    gap:6px 10px;
    margin-bottom:6px;
  }
  .bom-cable-grid-2{
    display:grid;
    grid-template-columns:repeat(4, 1fr);
    gap:6px 10px;
  }
  .bom-cable-col{ min-width:0; }
  .bom-cable-type{
    font-size:7.5px;
    font-weight:700;
    color:#3f3f46;
    margin-bottom:1px;
  }
  .bom-cable-make{
    font-size:9px;
    font-weight:700;
    color:#09090b;
    margin-bottom:1px;
  }
  .bom-cable-qty{
    font-size:7px;
    color:#52525b;
    margin-bottom:1px;
  }
  .bom-cable-spec{
    font-size:6.5px;
    color:#71717a;
    line-height:1.2;
    margin-bottom:2px;
  }
  .bom-cable-brand-badge{
    font-size:7.5px;
    font-weight:800;
    color:#dc2626;
    text-transform:uppercase;
  }

  /* Structure & Electrical Rows */
  .bom-struct-list{
    display:flex;
    flex-direction:column;
    gap:5px;
  }
  .bom-struct-grid-row{
    display:grid;
    grid-template-columns:2.2fr 0.9fr 1.6fr;
    align-items:baseline;
    gap:10px;
  }
  .bom-struct-lbl{
    font-size:7px;
    font-weight:700;
    color:#3f3f46;
    margin-bottom:1px;
  }
  .bom-struct-v{
    font-size:9px;
    font-weight:700;
    color:#09090b;
    line-height:1.25;
  }

  /* Distribution Boxes Row */
  .bom-db-row{
    display:grid;
    grid-template-columns:repeat(5, 1fr);
    gap:8px;
  }
  .bom-db-col{ min-width:0; }
  .bom-db-lbl{
    font-size:7.5px;
    font-weight:700;
    color:#3f3f46;
    margin-bottom:1.5px;
  }
  .bom-db-v{
    font-size:9px;
    font-weight:700;
    color:#09090b;
    line-height:1.25;
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

    <div class="content">
      <div class="header">
        <h1 class="proposal-title">PROPOSAL</h1>
      </div>

      <p class="intro">Price Quote &amp; Payment schedule for ${quotation.systemSize} KW System to ${customer.firstName} ${customer.lastName || ''}:</p>

      <table class="proposal-table">
        <thead>
          <tr>
            <th class="col-desc">Description</th>
            <th class="col-amount">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${pricingRowsHtml}
        </tbody>
      </table>

      <div class="cols" style="align-items: flex-start; margin-top: 20px;">
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
                     <tr><td style="padding: 2px 0; width: 85px; border: none; vertical-align: top;">Bank Name:</td><td style="padding: 2px 0; border: none; font-weight: 500;">${bankName}</td></tr>
                     <tr><td style="padding: 2px 0; border: none; vertical-align: top;">Name:</td><td style="padding: 2px 0; border: none; font-weight: 500;">${accountHolderName}</td></tr>
                     <tr><td style="padding: 2px 0; border: none; vertical-align: top;">Account No:</td><td style="padding: 2px 0; border: none; font-weight: 500;">${accountNumber}</td></tr>
                     <tr><td style="padding: 2px 0; border: none; vertical-align: top;">IFSC Code:</td><td style="padding: 2px 0; border: none; font-weight: 500;">${ifscCode}</td></tr>
                     <tr><td style="padding: 2px 0; border: none; vertical-align: top;">Branch:</td><td style="padding: 2px 0; border: none; font-weight: 500;">${branchName}</td></tr>
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
        <h1 class="proposal-title">BILL OF <span style="font-family:var(--font-heading);font-weight:400;font-style:italic;color:#555;">MATERIAL</span></h1>
      </div>

      ${bomSectionsHtml}
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
