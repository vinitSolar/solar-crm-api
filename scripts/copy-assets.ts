import fs from "fs";
import path from "path";

const src = path.resolve(process.cwd(), "packages/database/migrations");
const dest = path.resolve(process.cwd(), "dist/packages/database/migrations");

if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log("✅ Successfully copied migrations to dist/packages/database/migrations");
}
