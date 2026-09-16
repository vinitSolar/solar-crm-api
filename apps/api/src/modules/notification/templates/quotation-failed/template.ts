/**
 * Quotation Generation Failed — Template Configuration
 */

import path from "path";
import { fileURLToPath } from "url";
import { QUOTATION_FAILED_SUBJECT } from "./subject.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const quotationFailedTemplate = {
    subject: QUOTATION_FAILED_SUBJECT,
    requiredKeys: [
        "creator_name",
        "quotation_number",
        "lead_number",
        "customer_name",
        "system_size",
        "error_message"
    ],
    getHtmlPath(): string {
        return path.join(__dirname, "quotation-failed.html");
    }
};
