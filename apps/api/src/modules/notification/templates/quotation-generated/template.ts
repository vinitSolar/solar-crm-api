/**
 * Quotation Generated — Template Configuration
 *
 * Provides the HTML file path and list of required template variables.
 */

import path from "path";
import { fileURLToPath } from "url";
import { QUOTATION_GENERATED_SUBJECT } from "./subject.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const quotationGeneratedTemplate = {
    subject: QUOTATION_GENERATED_SUBJECT,
    requiredKeys: [
        "customer_name",
        "quotation_number",
        "quotation_date",
        "quotation_amount",
        "project_capacity",
        "valid_until",
        "company_name",
        "company_email",
        "company_phone",
        "quotation_download_link"
    ],
    getHtmlPath(): string {
        return path.join(__dirname, "quotation-generated.html");
    }
};
