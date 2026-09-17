import puppeteer from "puppeteer";
import { generateQuotationHtmlV2 } from "../templates/quotation-pdf-v2.template.js";
import type { IQuotationPdfData } from "../templates/quotation-pdf.template.js";
import { logger } from "@packages/logger/index.js";

/**
 * Concurrency Limiter for Headless Chromium
 * Limits simultaneous Puppeteer browser instances to MAX_CONCURRENT_PDF_RENDERS (2)
 * to prevent server memory spikes and Docker container crashes under concurrent load.
 */
const MAX_CONCURRENT_PDF_RENDERS = 2;
let activeRenders = 0;
const renderQueue: Array<() => void> = [];

async function acquireRenderSlot(): Promise<void> {
    if (activeRenders < MAX_CONCURRENT_PDF_RENDERS) {
        activeRenders++;
        return;
    }
    logger.info(`PDF render queued: active=${activeRenders}/${MAX_CONCURRENT_PDF_RENDERS}, queueLength=${renderQueue.length + 1}`);
    return new Promise<void>((resolve) => {
        renderQueue.push(() => {
            activeRenders++;
            resolve();
        });
    });
}

function releaseRenderSlot(): void {
    activeRenders--;
    if (renderQueue.length > 0) {
        const next = renderQueue.shift();
        if (next) next();
    }
}

export class QuotationPdfGenerator {
    /**
     * Spins up a headless browser, renders the formatted quotation HTML,
     * and compiles it into an A4 PDF document buffer.
     * Uses a concurrency queue to protect Docker server memory.
     * 
     * @param data Dynamic mapping data parameters for the template
     * @returns A Promise resolving to the PDF file buffer
     */
    static async generatePdfBuffer(data: IQuotationPdfData): Promise<Buffer> {
        await acquireRenderSlot();
        logger.info(`Acquired PDF render slot for Quote #: ${data.quotation.quotationNumber} [Active: ${activeRenders}/${MAX_CONCURRENT_PDF_RENDERS}, Queued: ${renderQueue.length}]`);
        const html = generateQuotationHtmlV2(data);
        
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                ...(process.env.PUPPETEER_EXECUTABLE_PATH ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH } : {}),
                args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            });
            const page = await browser.newPage();
            
            // Set HTML content and wait for fonts to resolve (all images/fonts are embedded base64 data URIs)
            await page.setContent(html, { waitUntil: "load" });
            await page.evaluateHandle("document.fonts.ready");
            
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
                await browser.close().catch(() => {});
            }
            releaseRenderSlot();
            logger.info(`Released PDF render slot for Quote #: ${data.quotation.quotationNumber} [Active: ${activeRenders}/${MAX_CONCURRENT_PDF_RENDERS}, Queued: ${renderQueue.length}]`);
        }
    }
}
