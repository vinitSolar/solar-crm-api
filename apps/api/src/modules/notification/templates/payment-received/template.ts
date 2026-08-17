import path from "path";
import { fileURLToPath } from "url";
import { PAYMENT_RECEIVED_SUBJECT } from "./subject.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const paymentReceivedTemplate = {
    subject: PAYMENT_RECEIVED_SUBJECT,
    requiredKeys: [
        "leadName",
        "amount",
        "paymentDate",
        "transactionReference"
    ],
    getHtmlPath(): string {
        return path.join(__dirname, "payment-received.html");
    }
};
