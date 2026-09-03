import puppeteer from "puppeteer";
import { generateQuotationHtmlV2 } from "../templates/quotation-pdf-v2.template.js";
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
        const html = generateQuotationHtmlV2(data);
        
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
            
            // Render A4 PDF with full bleed (margins: 0) to allow cover page and custom designed headers/footers
            const pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: {
                    top: "0px",
                    right: "0px",
                    bottom: "0px",
                    left: "0px"
                },
                displayHeaderFooter: false
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
