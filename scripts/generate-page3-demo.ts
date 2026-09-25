import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { generateQuotationHtmlV3 } from '../apps/api/src/modules/quotations/templates/quotation-pdf-v3.template.js';
import type { IQuotationPdfData } from '../apps/api/src/modules/quotations/templates/quotation-pdf.template.js';

const sampleData: IQuotationPdfData = {
    franchise: {
        name: "SunSelect Solar Private Limited",
        logo: null,
        email: "admin@sunselect.in",
        mobile: "+91 9876543210",
        address: "Navi Mumbai",
        city: "Navi Mumbai",
        state: "Maharashtra",
        pinCode: "400703"
    },
    bankDetails: {
        bankName: "HDFC Bank",
        accountHolderName: "SunSelect Solar Private Limited",
        accountNumber: "0876543210123",
        ifscCode: "HDFC0001234",
        branchName: "Navi Mumbai"
    },
    customer: {
        firstName: "Abhishek",
        lastName: "Dixit",
        mobileNumber: "9876543210",
        address: "Flat 402, Sunshine Heights",
        city: "Navi Mumbai",
        state: "Maharashtra",
        pinCode: "400703"
    },
    quotation: {
        quotationNumber: "SQ-2026-0925",
        validTill: "31 Oct 2026",
        systemSize: 3.72,
        statusText: "Draft",
        subtotal: 155000.00,
        gstAmount: 27900.00,
        grandTotal: 182900.00,
        discount: 0.00,
        extra: {
            title: "Structure Elevation",
            description: "Structure Elevation & Heavy Duty Cabling",
            value: 5000.00,
            isGstApplied: true,
            gstPercentage: 18
        },
        packageGst: 18,
        packageName: "3.72 kw Waaree",
        packageDescription: "Recommended rooftop solar system package",
        notes: "Quotation generated for 3.72 kW solar installation with extra structure elevation charges.",
        createdAt: "25 Sep 2026"
    },
    items: [
        {
            productName: "Waaree 540Wp Mono PERC Solar Panel",
            brandName: "Waaree",
            unitName: "Nos",
            quantity: 7,
            pricePerUnit: 12500.00,
            gstPercentage: 18.00,
            lineTotal: 87500.00,
            description: "Solar PV Modules",
            isExtra: 0
        },
        {
            productName: "Waaree 10kW On-Grid Solar Inverter",
            brandName: "Waaree",
            unitName: "Nos",
            quantity: 1,
            pricePerUnit: 62500.00,
            gstPercentage: 18.00,
            lineTotal: 62500.00,
            description: "Grid-tied solar inverter",
            isExtra: 0
        }
    ],
    scopeOfWork: [
        { title: "Module Mounting Structure Installation", value: "GI structure installation on RCC roof" },
        { title: "Inverter & Electrical Wiring", value: "DC/AC cabling, earthing & net-metering liaison" }
    ],
    termsConditions: [
        {
            title: "Payment Terms",
            description: [
                "20% advance payment along with work order.",
                "70% upon delivery of materials at site.",
                "10% post-commissioning and handover."
            ]
        }
    ],
    subsidy: {
        subsidyData: [
            { uid: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", name: "State Solar Subsidy", amount: 18000.00 }
        ],
        netCustomerCost: 164900.00,
        showSubsidy: true
    }
};

async function main() {
    console.log("Generating HTML v3...");
    const fullHtml = generateQuotationHtmlV3(sampleData);

    const artifactDir = "C:/Users/RDPAdmin/.gemini/antigravity-ide/brain/289cb249-f6c2-4841-ad66-d2c2e95ca84c";
    const imagePath = path.join(artifactDir, "page3_quotation_demo.png");
    const pdfPath = path.join(artifactDir, "sample_quotation_v3.pdf");
    const singlePageHtmlPath = path.join(artifactDir, "page3_demo.html");

    // Launch browser
    const browser = await puppeteer.launch({
        headless: true,
        ...(process.env.PUPPETEER_EXECUTABLE_PATH ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } : {}),
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });

    const page = await browser.newPage();
    // A4 dimensions at 96 DPI: 794 x 1123, with scale 2 for crisp image
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    await page.setContent(fullHtml, { waitUntil: "load" });
    await page.evaluateHandle("document.fonts.ready");

    // Generate Full PDF
    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
        displayHeaderFooter: false
    });
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log("✅ PDF saved to:", pdfPath);

    // Find Page 3 element
    const pages = await page.$$(".page");
    if (pages.length >= 3) {
        const page3 = pages[2]!;
        await page3.screenshot({
            path: imagePath,
            type: "png"
        });
        console.log("✅ Page 3 screenshot saved to:", imagePath);
    } else {
        console.warn("⚠️ Could not find 3rd page element, found:", pages.length);
    }

    // Extract standalone Page 3 HTML
    const standaloneHtml = await page.evaluate(() => {
        const styleEl = document.querySelector("style");
        const page3El = document.querySelectorAll(".page")[2];
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SunSelect Proposal - Page 3 Demo</title>
<style>
${styleEl ? styleEl.innerHTML : ''}
body { background: #525659; display: flex; justify-content: center; padding: 20px 0; }
.page { box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
</style>
</head>
<body>
${page3El ? page3El.outerHTML : ''}
</body>
</html>`;
    });
    fs.writeFileSync(singlePageHtmlPath, standaloneHtml, "utf-8");
    console.log("✅ Standalone Page 3 HTML saved to:", singlePageHtmlPath);

    await browser.close();
    console.log("Demo generation complete!");
}

main().catch(err => {
    console.error("Error generating demo:", err);
    process.exit(1);
});
