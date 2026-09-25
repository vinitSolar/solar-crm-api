import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function loadAssetBase64(filename) {
  const assetPath = path.join(__dirname, '../apps/api/src/modules/quotations/assets/Images', filename);
  if (fs.existsSync(assetPath)) {
    const ext = path.extname(filename).toLowerCase().replace('.', '');
    const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    return `data:${mime};base64,${fs.readFileSync(assetPath).toString('base64')}`;
  }
  return '';
}

function loadFontBase64(fileName) {
  const filePath = path.join(__dirname, '../apps/api/src/modules/quotations/assets/Fonts', fileName);
  if (fs.existsSync(filePath)) {
    try {
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(fileName).toLowerCase();
      const mime = ext === '.otf' ? 'font/otf' : 'font/ttf';
      const format = ext === '.otf' ? 'opentype' : 'truetype';
      return `url('data:${mime};charset=utf-8;base64,${buffer.toString('base64')}') format('${format}')`;
    } catch {
      // ignore
    }
  }
  return '';
}

function getFontFacesCss() {
  const arialExtraBold = loadFontBase64('ARIALMTEXTRABOLD.TTF');
  const gilroyBold = loadFontBase64('Gilroy-Bold.ttf');
  const myriadPro = loadFontBase64('MyriadPro-Regular.otf');
  const quicksandBold = loadFontBase64('Quicksand_Bold.otf');

  const faces = [];
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
    `);
  }
  if (myriadPro) {
    faces.push(`
      @font-face {
        font-family: 'Myriad Pro';
        src: ${myriadPro};
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
    `);
  }
  return faces.join('\n');
}

async function main() {
  try {
    const logoBase64 = loadAssetBase64('Asset 1@2x-8.png');
    const whiteLogoBase64 = loadAssetBase64('Logo---Sunselect---White.png');
    const watermarkBase64 = loadAssetBase64('Asset 11@2x-8.png');

    // 1. Fetch quotation from DB
    const qRes = await pool.query(`
      SELECT q.*, 
             l.first_name, l.last_name, l.address, l.city, l.state, l.pin_code,
             l.mobile_number, l.email
      FROM quotations q
      LEFT JOIN leads l ON l.uid::text = q.lead_uid::text
      WHERE q.quotation_number = 'QT-202609100001'
    `);
    const quote = qRes.rows[0];
    console.log('Quotation:', quote.quotation_number, 'System size:', quote.system_size);

    // 2. Fetch categories and category images from product_categories
    const catRes = await pool.query(`
      SELECT uid, name, image FROM product_categories WHERE is_deleted = 0
    `);
    const categoryMap = new Map();
    catRes.rows.forEach(r => {
      categoryMap.set(r.name.toLowerCase().trim(), r.image);
    });

    // 3. Fetch items with product categories, specifications and category image
    const itemsRes = await pool.query(`
      SELECT qi.*, 
             p.capacity, p.capacity_unit, p.warranty, p.model_number,
             c.name as category_name, c.uid as category_uid, c.image as category_image
      FROM quotation_items qi
      LEFT JOIN products p ON p.uid::text = qi.product_uid::text
      LEFT JOIN product_categories c ON c.uid::text = p.category_uid::text
      WHERE qi.quotation_uid = $1
    `, [quote.uid]);
    const items = itemsRes.rows;

    // 4. Fetch catalog for alternative options
    const catalogRes = await pool.query(`
      SELECT p.*, b.name as brand_name, c.name as category_name
      FROM products p
      LEFT JOIN product_categories c ON c.uid::text = p.category_uid::text
      LEFT JOIN product_brands b ON b.uid::text = p.brand_uid::text
      WHERE p.is_deleted = 0
    `);
    const catalog = catalogRes.rows;

    const panelItem = items.find(i => (i.category_name || '').toLowerCase().includes('panel') || i.product_name.toLowerCase().includes('panel'));
    const inverterItem = items.find(i => (i.category_name || '').toLowerCase().includes('inverter') || i.product_name.toLowerCase().includes('inverter'));

    const altInverters = catalog
      .filter(p => (p.category_name || '').toLowerCase().includes('inverter') && p.uid !== inverterItem?.product_uid)
      .map(p => `${p.name} - ${p.brand_name || 'Waaree'} (${p.capacity || ''} ${p.capacity_unit || 'kW'})`)
      .concat(['Solis / Sungrow / Growatt Equivalent'])
      .join('; ');

    const panelName = panelItem ? panelItem.product_name : 'Waaree 440Wp Mono PERC Solar Panel';
    const panelBrand = panelItem?.brand_name || 'Waaree Solar';
    const panelQty = panelItem ? Math.round(Number(panelItem.quantity)) : 9;
    const panelWatt = panelItem?.capacity ? `${panelItem.capacity} ${panelItem.capacity_unit || 'Wp'}` : '440 W';
    const panelCatName = panelItem?.category_name || 'Solar Panels';
    const panelCatImage = panelItem?.category_image || categoryMap.get('solar panels') || null;

    const inverterName = inverterItem ? inverterItem.product_name : 'Waaree 10kW On-Grid Solar Inverter';
    const inverterBrand = inverterItem?.brand_name || 'Waaree Solar';
    const inverterQty = inverterItem ? Math.round(Number(inverterItem.quantity)) : 1;
    const inverterSize = inverterItem?.capacity ? `${inverterItem.capacity} ${inverterItem.capacity_unit || 'kW'}` : '10 kW';
    const inverterWarranty = inverterItem?.warranty || '5 Years Standard Warranty';
    const inverterCatName = inverterItem?.category_name || 'Inverters';
    const inverterCatImage = inverterItem?.category_image || categoryMap.get('inverters') || null;

    const cablesCatImage = items.find(i => (i.category_name || '').toLowerCase().includes('cable'))?.category_image || categoryMap.get('cables & wires') || null;
    const structureCatImage = items.find(i => (i.category_name || '').toLowerCase().includes('structure'))?.category_image || categoryMap.get('mounting structures') || null;
    const accessoriesCatImage = items.find(i => (i.category_name || '').toLowerCase().includes('accessories'))?.category_image || categoryMap.get('accessories') || null;

    const panelIconHtml = panelCatImage
      ? `<img src="${panelCatImage}" alt="${panelCatName}" class="bom-category-img" />`
      : `<svg viewBox="0 0 32 32" width="32" height="32" fill="none">
          <rect x="2" y="2" width="13" height="13" rx="1.5" fill="#1E88E5"/>
          <rect x="17" y="2" width="13" height="13" rx="1.5" fill="#1E88E5"/>
          <rect x="2" y="17" width="13" height="13" rx="1.5" fill="#1E88E5"/>
          <rect x="17" y="17" width="13" height="13" rx="1.5" fill="#1E88E5"/>
        </svg>`;

    const inverterIconHtml = inverterCatImage
      ? `<img src="${inverterCatImage}" alt="${inverterCatName}" class="bom-category-img" />`
      : `<svg viewBox="0 0 32 32" width="32" height="32" fill="none">
          <rect x="3" y="3" width="26" height="26" rx="4" fill="#1e293b"/>
          <rect x="6" y="6" width="20" height="9" rx="2" fill="#0284c7"/>
          <circle cx="8" cy="22" r="2" fill="#ef4444"/>
          <circle cx="14" cy="22" r="2" fill="#eab308"/>
          <circle cx="20" cy="22" r="2" fill="#22c55e"/>
          <circle cx="26" cy="22" r="2" fill="#3b82f6"/>
        </svg>`;

    const cablesIconHtml = cablesCatImage
      ? `<img src="${cablesCatImage}" alt="Cables & Wires" class="bom-category-img" />`
      : `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="#E65100" stroke-width="3" stroke-linecap="round">
          <path d="M4 14 Q 10 8, 16 14 T 28 14"/>
          <path d="M4 20 Q 10 14, 16 20 T 28 20" stroke="#FB8C00" stroke-width="2"/>
        </svg>`;

    const structureIconHtml = structureCatImage
      ? `<img src="${structureCatImage}" alt="Mounting Structures" class="bom-category-img" />`
      : `<svg viewBox="0 0 32 32" width="32" height="32" fill="#475569">
          <rect x="4" y="12" width="24" height="8" rx="1.5"/>
          <rect x="4" y="7" width="6" height="18" rx="1.5"/>
          <rect x="22" y="7" width="6" height="18" rx="1.5"/>
        </svg>`;

    const accessoriesIconHtml = accessoriesCatImage
      ? `<img src="${accessoriesCatImage}" alt="Accessories" class="bom-category-img" />`
      : `<svg viewBox="0 0 32 32" width="32" height="32" fill="none">
          <rect x="3" y="3" width="12" height="12" rx="2" fill="#1e293b"/>
          <rect x="17" y="3" width="12" height="12" rx="2" fill="#ea580c"/>
          <rect x="3" y="17" width="12" height="12" rx="2" fill="#ea580c"/>
          <rect x="17" y="17" width="12" height="12" rx="2" fill="#1e293b"/>
        </svg>`;

    const fontFacesCss = getFontFacesCss();

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SunSelect Proposal — Page 4 (Bill of Material)</title>
<style>
  ${fontFacesCss}

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

  *{ box-sizing:border-box; margin:0; padding:0; }

  body{
    background:#94a3b8;
    font-family:var(--font);
    display:flex;
    justify-content:center;
    padding:40px 20px;
    -webkit-font-smoothing:antialiased;
  }

  /* Standard SunSelect PDF Page Dimensions */
  .page{
    width:210mm;
    height:297mm;
    min-height:297mm;
    max-height:297mm;
    background:#ffffff;
    box-shadow:0 10px 40px rgba(0,0,0,0.2);
    position:relative;
    overflow:hidden;
    display:flex;
    flex-direction:column;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }

  .content-page{
    background-color:#ffffff;
  }

  /* Top Right Logo — Exact Real Quotation Coordinates */
  .cover-logo-wrapper{
    position:absolute;
    top:14mm;
    right:16mm;
    z-index:10;
  }
  .page-top-logo{
    height:56px;
    max-width:240px;
    object-fit:contain;
    display:block;
  }

  /* Watermark icon on bottom-right — EXACT REAL QUOTATION THEME DIMENSIONS */
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

  /* Page Content Container — Exact 34mm top padding to clear logo */
  .content{
    position:relative;
    z-index:1;
    padding:34mm 16mm 16px 16mm;
    flex:1;
    display:flex;
    flex-direction:column;
  }

  /* Page Header — Exact Real Quotation Theme with Red Underline */
  .header{
    display:flex;
    justify-content:flex-start;
    align-items:center;
    margin-bottom:16px;
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

  /* ========================================================
     BOM CARDS DESIGN (Solar Earth Exact Style)
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

  /* Stacked Field */
  .bom-field{
    display:flex;
    flex-direction:column;
  }
  .bom-field-label{
    font-size:7.5px;
    font-weight:700;
    color:#475569;
    margin-bottom:2px;
  }
  .bom-field-val{
    font-size:9.5px;
    font-weight:700;
    color:#0f172a;
    line-height:1.2;
  }
  .bom-field-val-sm{
    font-size:8.5px;
    font-weight:600;
    color:#0f172a;
    line-height:1.2;
  }

  /* Brand Logos */
  .bom-brand-logo{
    display:flex;
    flex-direction:column;
    align-items:flex-end;
    justify-content:center;
    margin-left:auto;
    padding-left:8px;
  }
  .bom-brand-name-blue{
    font-size:13px;
    font-weight:900;
    color:#0284c7;
    letter-spacing:0.2px;
    line-height:1;
  }
  .bom-brand-sub{
    font-size:7px;
    font-weight:700;
    color:#64748b;
    letter-spacing:0.5px;
    text-transform:uppercase;
  }

  /* Panel Row */
  .bom-panel-row{
    display:flex;
    align-items:flex-start;
    gap:14px;
    flex-wrap:nowrap;
  }

  /* Inverter Card */
  .bom-inverter-top{
    display:flex;
    align-items:flex-start;
    gap:16px;
    margin-bottom:6px;
  }
  .bom-alt-box{
    background:#fffbeb;
    border-left:3px solid #d97706;
    padding:4px 8px;
    border-radius:0 4px 4px 0;
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
    gap:8px 12px;
    margin-bottom:6px;
  }
  .bom-cable-grid-2{
    display:grid;
    grid-template-columns:repeat(4, 1fr);
    gap:8px 12px;
  }
  .bom-cable-col{
    min-width:0;
  }
  .bom-cable-type{
    font-size:7.5px;
    font-weight:700;
    color:#475569;
    margin-bottom:1px;
  }
  .bom-cable-make{
    font-size:9px;
    font-weight:700;
    color:#0f172a;
    margin-bottom:1px;
  }
  .bom-cable-qty{
    font-size:7.5px;
    font-weight:600;
    color:#64748b;
    margin-bottom:1px;
  }
  .bom-cable-spec{
    font-size:7px;
    color:#475569;
    line-height:1.2;
    margin-bottom:2px;
  }
  .bom-cable-brand-badge{
    display:inline-block;
    background:#e0f2fe;
    color:#0369a1;
    font-size:6.5px;
    font-weight:800;
    padding:1px 4px;
    border-radius:2px;
    letter-spacing:0.3px;
  }

  /* Structure List */
  .bom-struct-list{
    display:flex;
    flex-direction:column;
    gap:5px;
  }
  .bom-struct-grid-row{
    display:grid;
    grid-template-columns:2.4fr 0.8fr 1.6fr;
    gap:10px;
    align-items:center;
  }
  .bom-struct-lbl{
    font-size:7px;
    font-weight:700;
    color:#64748b;
  }
  .bom-struct-v{
    font-size:8.5px;
    font-weight:700;
    color:#0f172a;
  }

  /* Distribution Boxes (DCDB / ACDB) Row */
  .bom-db-row{
    display:grid;
    grid-template-columns:repeat(5, 1fr);
    gap:6px 10px;
  }
  .bom-db-col{
    min-width:0;
  }
  .bom-db-lbl{
    font-size:7px;
    font-weight:700;
    color:#64748b;
    margin-bottom:1px;
  }
  .bom-db-v{
    font-size:8px;
    font-weight:700;
    color:#0f172a;
    line-height:1.25;
  }

  /* Footer — EXACT REAL QUOTATION THEME */
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
</style>
</head>
<body>

<div class="page content-page">
  <!-- Top Right Logo (Identical to other pages in proposal) -->
  <div class="cover-logo-wrapper">
    ${logoBase64 ? `<img src="${logoBase64}" alt="SunSelect Solar" class="page-top-logo" />` : ''}
  </div>

  <!-- Watermark Graphic (Asset 11) — EXACT REAL QUOTATION THEME (Bottom Right 92mm) -->
  <div class="bg-watermark">
    ${watermarkBase64 ? `<img src="${watermarkBase64}" alt="" class="page-watermark-img" />` : ''}
  </div>

  <!-- Page Content Container -->
  <div class="content">
    <!-- Header with Red Underline -->
    <div class="header">
      <h1 class="proposal-title">BILL OF <span style="font-family:var(--font-heading);font-weight:400;font-style:italic;color:#555;">MATERIAL</span></h1>
    </div>

    <!-- 1. Solar Panels Card -->
    <div class="bom-card">
      <div class="bom-card-inner">
        <div class="bom-card-icon">
          ${panelIconHtml}
        </div>
        <div class="bom-card-content">
          <div class="bom-panel-row">
            <div class="bom-field">
              <div class="bom-field-label">Watt Peak:</div>
              <div class="bom-field-val">${panelWatt}</div>
            </div>
            <div class="bom-field">
              <div class="bom-field-label">Panel Qty:</div>
              <div class="bom-field-val">${panelQty} Nos</div>
            </div>
            <div class="bom-field" style="flex:1.4;">
              <div class="bom-field-label">Panel Type:</div>
              <div class="bom-field-val">${panelName}</div>
            </div>
            <div class="bom-field">
              <div class="bom-field-label">Panel Make:</div>
              <div class="bom-field-val">${panelBrand}</div>
            </div>
            <div class="bom-field">
              <div class="bom-field-label">Panel Warranty:</div>
              <div class="bom-field-val-sm">12 Year Product</div>
              <div class="bom-field-label" style="margin-top:2px;">Performance Warranty:</div>
              <div class="bom-field-val-sm">25 Year</div>
            </div>
            <div class="bom-brand-logo">
              <span class="bom-brand-name-blue">waaree</span>
              <span class="bom-brand-sub">Solar</span>
            </div>
          </div>
        </div>
      </div>
      <span class="bom-card-tag">${panelCatName}</span>
    </div>

    <!-- 2. Solar Inverters Card -->
    <div class="bom-card">
      <div class="bom-card-inner">
        <div class="bom-card-icon">
          ${inverterIconHtml}
        </div>
        <div class="bom-card-content">
          <div class="bom-inverter-top">
            <div class="bom-field">
              <div class="bom-field-label">Inverter Size:</div>
              <div class="bom-field-val">${inverterSize}</div>
            </div>
            <div class="bom-field">
              <div class="bom-field-label">Inverter Qty:</div>
              <div class="bom-field-val">${inverterQty} Nos</div>
            </div>
            <div class="bom-field" style="flex:1.2;">
              <div class="bom-field-label">Inverter Make:</div>
              <div class="bom-field-val">${inverterBrand}</div>
            </div>
            <div class="bom-field">
              <div class="bom-field-label">Inverter Warranty:</div>
              <div class="bom-field-val">${inverterWarranty}</div>
            </div>
            <div class="bom-brand-logo">
              <span class="bom-brand-name-blue">WAAREE</span>
              <span class="bom-brand-sub">Solar</span>
            </div>
          </div>
          <div class="bom-alt-box">
            <div class="bom-alt-title">ALTERNATIVE PRODUCTS</div>
            <div class="bom-alt-sub">May be supplied if the primary product is unavailable, with equivalent specification.</div>
            <div class="bom-alt-items">${altInverters}</div>
          </div>
        </div>
      </div>
      <span class="bom-card-tag">${inverterCatName}</span>
    </div>

    <!-- 3. Cables & Wires Card -->
    <div class="bom-card">
      <div class="bom-card-inner">
        <div class="bom-card-icon">
          ${cablesIconHtml}
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

    <!-- 4. Mounting Structures Card -->
    <div class="bom-card">
      <div class="bom-card-inner">
        <div class="bom-card-icon">
          ${structureIconHtml}
        </div>
        <div class="bom-card-content">
          <div class="bom-struct-list">
            <div class="bom-struct-grid-row">
              <div>
                <div class="bom-struct-lbl">Product:</div>
                <div class="bom-struct-v">Galvanized Iron Structure 80 Micron (HDGI) - ${panelQty} Modules</div>
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
                <div class="bom-struct-v">${panelQty * 4} Nos</div>
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

    <!-- 5. Electrical Accessories Card -->
    <div class="bom-card">
      <div class="bom-card-inner">
        <div class="bom-card-icon">
          ${accessoriesIconHtml}
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

    <!-- 6. Distribution Boxes Card -->
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
  </div>

  <!-- Real Proposal Footer with Page Number 4 -->
  <div class="footer">
    <div class="brand">
      ${whiteLogoBase64 ? `<img src="${whiteLogoBase64}" alt="Sunselect" class="footer-logo" />` : 'Sunselect'}
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
      <span>admin@sunselect.com</span>
    </div>
    <div class="item">
      <svg class="footer-icon" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
      </svg>
      <span>+91 91799 91799</span>
    </div>
    <div class="page-no">4</div>
  </div>
</div>

</body>
</html>`;

    // Write to preview-bom-page4.html
    const targetHtmlPath = path.join(__dirname, 'preview-bom-page4.html');
    fs.writeFileSync(targetHtmlPath, htmlContent, 'utf-8');
    console.log('✅ Updated preview-bom-page4.html with real proposal theme and category image support');

    // Render screenshot with Puppeteer using system Chrome
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const artifactDir = 'C:\\Users\\VinitSolarTeam\\.gemini\\antigravity-ide\\brain\\5557c6da-0433-482d-8104-1eabcd80aaca';
    const screenshotPath = path.join(artifactDir, 'bom_page4_rendered.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await browser.close();
    console.log('✅ Screenshot saved to:', screenshotPath);

  } catch (err) {
    console.error('Error in main:', err);
  } finally {
    await pool.end();
  }
}

main();
