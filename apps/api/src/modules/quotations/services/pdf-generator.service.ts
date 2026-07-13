import puppeteer from "puppeteer";
import { generateQuotationHtml } from "../templates/quotation-pdf.template.js";
import type { IQuotationPdfData } from "../templates/quotation-pdf.template.js";
import { logger } from "@packages/logger/index.js";

export class QuotationPdfGenerator {
    /**
     * Spins up a headless browser, renders the formatted quotation HTML,
     * and compiles it into an A4 PDF document buffer.
     * 
     * @param data Dynamic mapping data parameters for the template
     * @returns A Promise resolving to the PDF file buffer
     */
    static async generatePdfBuffer(data: IQuotationPdfData): Promise<Buffer> {
        logger.info(`Rendering quotation HTML to PDF buffer for Quote #: ${data.quotation.quotationNumber}`);
        const html = generateQuotationHtml(data);
        
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"]
            });
            const page = await browser.newPage();
            
            // Set HTML content and wait for fonts/images to resolve
            await page.setContent(html, { waitUntil: "load" });
            await page.waitForNetworkIdle();
            
            // Render A4 PDF with custom repeating headers/footers in margins
            const pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: {
                    top: "22mm",
                    right: "15mm",
                    bottom: "22mm",
                    left: "15mm"
                },
                displayHeaderFooter: true,
                headerTemplate: `
                    <div style="font-size: 8px; font-family: 'Helvetica Neue', Arial, sans-serif; width: 100%; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-left: 15mm; margin-right: 15mm; color: #64748b;">
                        <div><strong>${data.franchise.name}</strong> - Quotation</div>
                        <div>Quote #: ${data.quotation.quotationNumber}</div>
                    </div>
                `,
                footerTemplate: `
                    <div style="font-size: 8px; font-family: 'Helvetica Neue', Arial, sans-serif; width: 100%; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-left: 15mm; margin-right: 15mm; color: #64748b;">
                        <div>Powered by SunSelect CRM</div>
                        <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
                    </div>
                `
            });
            
            return Buffer.from(pdfBuffer);
        } catch (error) {
            logger.error("Failed to render PDF using Puppeteer", error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}
