import path from "path";
import { fileURLToPath } from "url";
import { FRANCHISE_CREDENTIALS_SUBJECT } from "./subject.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const franchiseCredentialsTemplate = {
    subject: FRANCHISE_CREDENTIALS_SUBJECT,
    requiredKeys: [
        "franchiseName",
        "email",
        "password",
        "loginUrl",
        "heroImageUrl",
        "logoUrl"
    ],
    getHtmlPath(): string {
        return path.join(__dirname, "franchise-credentials.html");
    }
};
