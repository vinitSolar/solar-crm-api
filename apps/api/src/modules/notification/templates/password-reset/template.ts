import path from "path";
import { fileURLToPath } from "url";
import { PASSWORD_RESET_SUBJECT } from "./subject.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const passwordResetTemplate = {
    subject: PASSWORD_RESET_SUBJECT,
    requiredKeys: [
        "firstName",
        "lastName",
        "otp",
        "expiryMinutes"
    ],
    getHtmlPath(): string {
        return path.join(__dirname, "password-reset.html");
    }
};
