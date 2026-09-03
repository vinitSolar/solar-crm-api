import type { IQuotationPdfData } from './quotation-pdf.template.js';

function formatINR(amount: number): string {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export function generateQuotationHtmlV2(data: IQuotationPdfData): string {
    const { franchise, customer, quotation, items, scopeOfWork, termsConditions, subsidy } = data;

    // Build logo section
    const logoHtml = franchise.logo 
        ? `<img src="${franchise.logo}" alt="${franchise.name}" style="max-width:200px;max-height:86px;object-fit:contain;">`
        : `<div class="logo-slot">${franchise.name.substring(0, 2).toUpperCase()}</div>`;

    // Build items rows
    let itemsHtml = "";
    if (quotation.packageName) {
        const packageItems = items.filter(i => !i.isExtra);
        const extraItems = items.filter(i => i.isExtra);
        const packageLineTotal = packageItems.reduce((sum, i) => sum + i.lineTotal, 0);

        itemsHtml += `
            <tr>
                <td>
                    <strong>${quotation.packageName}</strong>
                    ${quotation.packageDescription ? `<br/><small style="color:var(--muted);">${quotation.packageDescription}</small>` : ""}
                </td>
                <td>${formatINR(packageLineTotal)}</td>
            </tr>
        `;

        extraItems.forEach(item => {
            itemsHtml += `
            <tr>
                <td>
                    <strong>${item.productName}</strong> - ${item.quantity} ${item.unitName} @ ${formatINR(item.pricePerUnit)}
                    ${item.description ? `<br/><small style="color:var(--muted);">${item.description}</small>` : ""}
                </td>
                <td>${formatINR(item.lineTotal)}</td>
            </tr>
            `;
        });
    } else {
        itemsHtml = items.map((item) => `
            <tr>
                <td>
                    <strong>${item.productName}</strong> - ${item.quantity} ${item.unitName} @ ${formatINR(item.pricePerUnit)}
                    ${item.description ? `<br/><small style="color:var(--muted);">${item.description}</small>` : ""}
                </td>
                <td>${formatINR(item.lineTotal)}</td>
            </tr>
        `).join("");
    }

    let subsidyRowsHtml = "";
    if (subsidy && subsidy.showSubsidy) {
        subsidyRowsHtml = subsidy.subsidyData.map(sub => `
        <tr>
            <td>${sub.name}</td>
            <td style="color:var(--red);">- ${formatINR(sub.amount)}</td>
        </tr>
        `).join("") + `
        <tr class="final">
            <td>Final Effective Cost to Customer After Subsidy</td>
            <td>${formatINR(subsidy.netCustomerCost)}</td>
        </tr>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sunselect — Proposal - ${quotation.quotationNumber}</title>
<style>
  :root{
    --red:#E31E24;
    --dark:#18181F;
    --text:#3B3F49;
    --muted:#9A9DA6;
    --border:#d6d6da;
    --highlight:#F2F2F2;
    --footer-bg:#0A0A0A;
    --font:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  *{ box-sizing:border-box; }

  body{
    margin:0;
    background:#e8e8ea;
    font-family:var(--font);
    color:var(--text);
    -webkit-font-smoothing:antialiased;
  }

  .sheet-wrap{
    padding:40px 16px;
    display:flex;
    justify-content:center;
  }

  .page{
    position:relative;
    width:794px;
    min-height:1123px;
    background:#fff;
    box-shadow:0 4px 30px rgba(0,0,0,0.15);
    overflow:hidden;
    display:flex;
    flex-direction:column;
  }

  .bg-watermark{
    position:absolute;
    top:0; right:0;
    width:46%;
    height:100%;
    z-index:0;
    pointer-events:none;
  }

  .content{
    position:relative;
    z-index:1;
    padding:56px 60px 20px;
    flex:1;
  }

  .header{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    margin-bottom:38px;
    gap:20px;
  }

  .proposal-title{
    font-weight:800;
    font-size:44px;
    letter-spacing:0.5px;
    color:var(--dark);
    display:inline-block;
    padding-bottom:10px;
    border-bottom:5px solid var(--red);
    margin:0;
  }

  .logo-slot{
    width:200px;
    height:86px;
    flex-shrink:0;
    border:2px dashed #c7c7cc;
    border-radius:6px;
    display:flex;
    align-items:center;
    justify-content:center;
    text-align:center;
    color:#a6a6ac;
    font-size:24px;
    font-weight:bold;
    line-height:1.4;
    padding:8px;
  }

  .intro{
    font-weight:700;
    font-size:17px;
    color:var(--dark);
    line-height:1.55;
    margin:4px 0 26px;
    max-width:520px;
  }

  table.quote{
    width:100%;
    border-collapse:collapse;
    margin-bottom:34px;
  }
  table.quote th, table.quote td{
    border:1px solid var(--border);
    padding:13px 20px;
    font-size:14.5px;
    text-align:left;
  }
  table.quote thead th{
    color:var(--red);
    font-weight:700;
    font-size:15px;
  }
  table.quote td:first-child, table.quote th:first-child{ width:67%; }
  tr.total td{ font-weight:700; color:var(--dark); }
  tr.final td{ font-weight:700; color:var(--dark); background:var(--highlight); }

  .cols{
    display:flex;
    gap:60px;
    margin-bottom:26px;
  }
  .cols h3{
    color:var(--red);
    font-size:16px;
    font-weight:700;
    margin:0 0 10px;
  }
  .cols .col{ flex:1; }
  .cols p{ margin:0; font-size:14px; line-height:1.7; }
  .cols .field{ font-size:14px; line-height:1.9; }

  .notice{
    color:var(--red);
    font-weight:700;
    font-size:13.5px;
    line-height:1.6;
    margin-top:14px;
  }

  .footer{
    position:relative;
    z-index:1;
    background:var(--footer-bg);
    color:#fff;
    padding:16px 60px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    font-size:13px;
    margin-top:auto;
  }
  .footer .brand, .footer .item{
    display:flex;
    align-items:center;
    gap:9px;
  }
  .footer .brand{ font-weight:700; font-size:14px; }

  .ic{
    width:20px;
    height:20px;
    border:1px dashed #555;
    border-radius:4px;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    font-size:10px;
    color:#888;
    flex-shrink:0;
  }

  .page-no{
    border:1px solid #444;
    font-weight:700;
    padding:4px 14px;
    border-radius:2px;
  }

  @media print{
    body{ background:#fff; }
    .sheet-wrap{ padding:0; }
    .page{ box-shadow:none; width:100%; min-height:100vh; }
    @page{ size:A4; margin:0; }
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
</style>
</head>
<body>
<div class="sheet-wrap">
  <div class="page">
    <div class="bg-watermark"></div>
    ${quotation.statusText === "Draft" ? '<div class="watermark">DRAFT</div>' : ""}

    <div class="content">
      <div class="header">
        <h1 class="proposal-title">PROPOSAL</h1>
        ${logoHtml}
      </div>

      <p class="intro">Price Quote &amp; Payment schedule for ${quotation.systemSize} KW System to ${customer.firstName} ${customer.lastName || ''}:</p>

      <table class="quote">
        <thead>
          <tr><th>Description</th><th>Amount (INR)</th></tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr><td>Subtotal</td><td>${formatINR(quotation.subtotal)}</td></tr>
          ${quotation.discount ? `<tr><td>Discount</td><td>- ${formatINR(quotation.discount)}</td></tr>` : ''}
          <tr><td>GST Amount ${quotation.packageGst ? `(${quotation.packageGst}%)` : ""}</td><td>${formatINR(quotation.gstAmount)}</td></tr>
          <tr class="total"><td>Grand Total Cost Of The Project</td><td>${formatINR(quotation.grandTotal)}</td></tr>
          ${subsidyRowsHtml}
        </tbody>
      </table>

      <div class="cols" style="align-items: flex-start; margin-top: 20px;">
         <div class="col" style="flex: 1.5; padding-right: 20px;">
             ${termsConditions.length > 0 ? termsConditions.map((tc) => `
                 <h3 style="color: var(--red); margin: 10px 0 5px 0;">${tc.title}</h3>
                 <ul style="margin: 0 0 10px 0; padding-left: 20px; font-size: 14px; line-height: 1.5; color: var(--text);">
                     ${Array.isArray(tc.description) 
                        ? tc.description.map(d => `<li style="margin-bottom: 4px;">${d}</li>`).join('')
                        : `<li style="margin-bottom: 4px;">${tc.description}</li>`}
                 </ul>
             `).join("") : '<div style="font-size: 14px; color: var(--text);">No specific terms defined.</div>'}
         </div>
         <div class="col" style="flex: 1;">
             <h3 style="color: var(--red); margin: 10px 0 5px 0;">Bank Details</h3>
             <table style="width: 100%; border: none; font-size: 14px; line-height: 1.6; color: var(--text); border-collapse: collapse;">
                 <tbody>
                     <tr><td style="padding: 3px 0; width: 90px; border: none; vertical-align: top;">Bank Name:</td><td style="padding: 3px 0; border: none; font-weight: 500;">HDFC Bank</td></tr>
                     <tr><td style="padding: 3px 0; border: none; vertical-align: top;">Name:</td><td style="padding: 3px 0; border: none; font-weight: 500;">SunSelect Solar Private Limited</td></tr>
                     <tr><td style="padding: 3px 0; border: none; vertical-align: top;">Account No:</td><td style="padding: 3px 0; border: none; font-weight: 500;">0876543210123</td></tr>
                     <tr><td style="padding: 3px 0; border: none; vertical-align: top;">IFSC Code:</td><td style="padding: 3px 0; border: none; font-weight: 500;">HDFC0001234</td></tr>
                     <tr><td style="padding: 3px 0; border: none; vertical-align: top;">Branch:</td><td style="padding: 3px 0; border: none; font-weight: 500;">Navi Mumbai</td></tr>
                 </tbody>
             </table>
         </div>
      </div>

      ${quotation.notes ? `<p class="notice">Note: ${quotation.notes}</p>` : ''}
    </div>

    <div class="footer">
      <div class="brand"><span class="ic">🏢</span>${franchise.name}</div>
      <div class="item"><span class="ic">📞</span>${franchise.mobile || ''}</div>
      <div class="item"><span class="ic">✉️</span>${franchise.email || ''}</div>
      <div class="page-no">1</div>
    </div>
  </div>
</div>
</body>
</html>
    `;
}
