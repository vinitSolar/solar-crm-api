export interface IQuotationPdfData {
    franchise: {
        name: string;
        logo: string | null;
        email: string | null;
        mobile: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        pinCode: string | null;
    };
    customer: {
        firstName: string;
        lastName: string | null;
        mobileNumber: string;
        address: string | null;
        city: string | null;
        state: string | null;
        pinCode: string | null;
    };
    quotation: {
        quotationNumber: string;
        validTill: string;
        systemSize: number;
        statusText: string;
        subtotal: number;
        gstAmount: number;
        grandTotal: number;
        notes: string | null;
        createdAt: string;
    };
    items: Array<{
        productName: string;
        brandName: string;
        unitName: string;
        quantity: number;
        pricePerUnit: number;
        gstPercentage: number;
        lineTotal: number;
        description: string | null;
    }>;
    scopeOfWork: Array<{
        title: string;
        value: string;
    }>;
    termsConditions: Array<{
        title: string;
        description: string;
    }>;
    subsidy?: {
        centralSubsidy: number;
        stateSubsidy: number;
        netCustomerCost: number;
        showSubsidy: boolean;
    };
}

function formatINR(amount: number): string {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export function generateQuotationHtml(data: IQuotationPdfData): string {
    const { franchise, customer, quotation, items, scopeOfWork, termsConditions, subsidy } = data;

    // Build logo section
    const logoHtml = franchise.logo 
        ? `<img class="logo" src="${franchise.logo}" alt="${franchise.name}" />`
        : `<div class="logo-placeholder">${franchise.name.substring(0, 2).toUpperCase()}</div>`;

    // Build items rows
    const itemsHtml = items.map((item, idx) => `
        <tr>
            <td class="text-center">${idx + 1}</td>
            <td>
                <strong>${item.productName}</strong>
                ${item.description ? `<br/><small class="text-muted">${item.description}</small>` : ""}
            </td>
            <td>${item.brandName}</td>
            <td class="text-right">${item.quantity} ${item.unitName}</td>
            <td class="text-right">${formatINR(item.pricePerUnit)}</td>
            <td class="text-right">${item.gstPercentage}%</td>
            <td class="text-right">${formatINR(item.lineTotal)}</td>
        </tr>
    `).join("");

    // Build Scope of work grid items
    const sowHtml = scopeOfWork.length > 0 
        ? scopeOfWork.map(sow => `
            <div class="info-card-item">
                <span class="info-card-label">${sow.title}</span>
                <span class="info-card-value">${sow.value}</span>
            </div>
          `).join("")
        : `<p class="text-muted">No specific scope of work defined.</p>`;

    // Build Terms and conditions list
    const tcHtml = termsConditions.length > 0
        ? termsConditions.map((tc, idx) => `
            <div class="tc-item">
                <strong>${idx + 1}. ${tc.title}</strong>
                <p>${tc.description}</p>
            </div>
          `).join("")
        : `<p class="text-muted">No specific terms and conditions defined.</p>`;

    // Build Subsidy rows if applicable
    const subsidyRowsHtml = (subsidy && subsidy.showSubsidy) ? `
        <tr class="subsidy-row">
            <td colspan="5" class="text-right">Central Subsidy (PM-Surya Ghar):</td>
            <td colspan="2" class="text-right">- ${formatINR(subsidy.centralSubsidy)}</td>
        </tr>
        <tr class="subsidy-row">
            <td colspan="5" class="text-right">State Subsidy:</td>
            <td colspan="2" class="text-right">- ${formatINR(subsidy.stateSubsidy)}</td>
        </tr>
        <tr class="net-cost-row">
            <td colspan="5" class="text-right">Net Customer Cost:</td>
            <td colspan="2" class="text-right">${formatINR(subsidy.netCustomerCost)}</td>
        </tr>
    ` : "";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Quotation: ${quotation.quotationNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            font-size: 9.5px;
            line-height: 1.4;
            color: #334155;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            padding: 15px 25px;
        }

        /* Container grid */
        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 8px;
            margin-bottom: 8px;
        }

        .logo-section {
            flex: 1;
        }

        .logo {
            max-height: 40px;
            max-width: 150px;
            object-fit: contain;
        }

        .logo-placeholder {
            width: 35px;
            height: 35px;
            background-color: #f59e0b;
            color: #ffffff;
            font-size: 14px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        }

        .franchise-section {
            text-align: right;
            max-width: 300px;
        }

        .franchise-name {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 2px;
        }

        .franchise-details {
            color: #64748b;
            font-size: 8.5px;
            line-height: 1.3;
        }

        .title-block {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #f8fafc;
            border-left: 3px solid #f59e0b;
            padding: 6px 12px;
            margin-bottom: 8px;
        }

        .quote-title {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .quote-number {
            font-size: 11px;
            font-weight: 600;
            color: #0f172a;
        }

        /* 2-column info layout */
        .info-grid {
            display: flex;
            gap: 12px;
            margin-bottom: 8px;
        }

        .info-col {
            flex: 1;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px;
        }

        .info-header {
            font-size: 9.5px;
            font-weight: 600;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-row {
            display: flex;
            margin-bottom: 3px;
        }

        .info-label {
            width: 80px;
            font-weight: 500;
            color: #64748b;
        }

        .info-value {
            flex: 1;
            color: #334155;
            font-weight: 600;
        }

        /* Table Styling */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 8px;
            letter-spacing: 0.5px;
            padding: 5px 8px;
            border: 1px solid #0f172a;
        }

        td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
        }

        tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-muted { color: #64748b; }

        /* Calculations section */
        .calc-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 8px;
            page-break-inside: avoid;
        }

        .calc-table {
            width: 250px;
            margin-bottom: 0;
        }

        .calc-table td {
            padding: 4px 8px;
            border: none;
        }

        .bold-row {
            font-weight: 700;
            font-size: 10.5px;
            background-color: #f1f5f9;
            color: #0f172a;
        }

        .bold-row td {
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
        }

        .subsidy-row {
            font-style: italic;
            color: #047857;
            font-weight: 500;
        }

        .net-cost-row {
            font-weight: 700;
            font-size: 11px;
            background-color: #ecfdf5;
            color: #047857;
        }

        .net-cost-row td {
            border-top: 1.5px solid #047857;
            border-bottom: 2px double #047857;
        }

        /* Scope of work & terms cards */
        .sections-container {
            display: flex;
            gap: 12px;
            margin-bottom: 8px;
            page-break-inside: avoid;
        }

        .section-box {
            flex: 1;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px;
            background-color: #ffffff;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 9.5px;
            font-weight: 600;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-card-item {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            border-bottom: 1px dashed #f1f5f9;
        }

        .info-card-item:last-child {
            border-bottom: none;
        }

        .info-card-label {
            font-weight: 500;
            color: #64748b;
        }

        .info-card-value {
            font-weight: 600;
            color: #334155;
        }

        .tc-item {
            margin-bottom: 5px;
        }

        .tc-item:last-child {
            margin-bottom: 0;
        }

        .tc-item p {
            color: #64748b;
            margin-top: 0px;
            padding-left: 8px;
        }

        .notes-section {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px;
            margin-bottom: 10px;
            page-break-inside: avoid;
        }

        .notes-title {
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 2px;
        }

        /* Signatures block */
        .signatures-container {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            page-break-inside: avoid;
        }

        .sig-block {
            text-align: center;
            width: 160px;
        }

        .sig-line {
            border-top: 1px solid #94a3b8;
            margin-top: 25px;
            padding-top: 3px;
            color: #64748b;
            font-size: 8.5px;
        }

        .stamp-placeholder {
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #cbd5e1;
            font-style: italic;
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
            z-index: -1;
            white-space: nowrap;
        }
    </style>
</head>
<body>
    <!-- Watermark for draft mode -->
    ${quotation.statusText === "Draft" ? '<div class="watermark">DRAFT</div>' : ""}

    <!-- Top Header -->
    <div class="header-container">
        <div class="logo-section">
            ${logoHtml}
        </div>
        <div class="franchise-section">
            <div class="franchise-name">${franchise.name}</div>
            <div class="franchise-details">
                ${franchise.address ? `${franchise.address}<br/>` : ""}
                ${franchise.city ? `${franchise.city}, ` : ""}${franchise.state ? `${franchise.state} ` : ""}${franchise.pinCode ? `- ${franchise.pinCode}<br/>` : "<br/>"}
                ${franchise.mobile ? `Mobile: ${franchise.mobile}<br/>` : ""}
                ${franchise.email ? `Email: ${franchise.email}` : ""}
            </div>
        </div>
    </div>

    <!-- Title and Quote Number -->
    <div class="title-block">
        <div class="quote-title">Solar Power Quotation</div>
        <div class="quote-number">Quote #: ${quotation.quotationNumber}</div>
    </div>

    <!-- Customer and Quote Info Grid -->
    <div class="info-grid">
        <div class="info-col">
            <div class="info-header">Customer Details</div>
            <div class="info-row">
                <span class="info-label">Customer:</span>
                <span class="info-value">${customer.firstName} ${customer.lastName || ""}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Mobile:</span>
                <span class="info-value">${customer.mobileNumber}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">
                    ${customer.address ? `${customer.address}, ` : ""}
                    ${customer.city ? `${customer.city}, ` : ""}${customer.state ? customer.state : ""} ${customer.pinCode ? `- ${customer.pinCode}` : ""}
                </span>
            </div>
        </div>
        <div class="info-col">
            <div class="info-header">Quotation Info</div>
            <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${quotation.createdAt}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Valid Till:</span>
                <span class="info-value">${quotation.validTill}</span>
            </div>
            <div class="info-row">
                <span class="info-label">System Size:</span>
                <span class="info-value">${quotation.systemSize} kW</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">${quotation.statusText}</span>
            </div>
        </div>
    </div>

    <!-- Product Details Table -->
    <table>
        <thead>
            <tr>
                <th style="width: 5%;" class="text-center">#</th>
                <th style="width: 35%;">Item Description</th>
                <th style="width: 15%;">Brand</th>
                <th style="width: 10%;" class="text-right">Qty</th>
                <th style="width: 12%;" class="text-right">Rate</th>
                <th style="width: 8%;" class="text-right">GST</th>
                <th style="width: 15%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            ${itemsHtml}
        </tbody>
    </table>

    <!-- Calculations Container -->
    <div class="calc-container">
        <table class="calc-table">
            <tbody>
                <tr>
                    <td class="text-right">Subtotal:</td>
                    <td class="text-right" style="width: 120px;">${formatINR(quotation.subtotal)}</td>
                </tr>
                <tr>
                    <td class="text-right">GST Amount:</td>
                    <td class="text-right">${formatINR(quotation.gstAmount)}</td>
                </tr>
                <tr class="bold-row">
                    <td class="text-right">Grand Total (Incl. GST):</td>
                    <td class="text-right">${formatINR(quotation.grandTotal)}</td>
                </tr>
                ${subsidyRowsHtml}
            </tbody>
        </table>
    </div>

    <!-- Scope and Terms Columns -->
    <div class="sections-container">
        <div class="section-box">
            <div class="section-title">Scope Of Work</div>
            ${sowHtml}
        </div>
        <div class="section-box">
            <div class="section-title">Terms & Conditions</div>
            ${tcHtml}
        </div>
    </div>

    <!-- Notes Section if defined -->
    ${quotation.notes ? `
    <div class="notes-section">
        <div class="notes-title">Additional Notes:</div>
        <p>${quotation.notes}</p>
    </div>
    ` : ""}

    <!-- Signatures -->
    <div class="signatures-container">
        <div class="sig-block">
            <div class="stamp-placeholder">[ Company Seal ]</div>
            <div class="sig-line">Authorized Signatory<br/><strong>${franchise.name}</strong></div>
        </div>
        <div class="sig-block">
            <div style="height: 50px;"></div>
            <div class="sig-line">Accepted By<br/><strong>Customer Signature</strong></div>
        </div>
    </div>
</body>
</html>
    `;
}
