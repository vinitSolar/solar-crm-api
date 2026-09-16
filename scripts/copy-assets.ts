import fs from "fs";
import path from "path";

// 1. Copy database migrations
const migrationsSrc = path.resolve(process.cwd(), "packages/database/migrations");
const migrationsDest = path.resolve(process.cwd(), "dist/packages/database/migrations");

if (fs.existsSync(migrationsSrc)) {
    fs.cpSync(migrationsSrc, migrationsDest, { recursive: true, force: true });
    console.log("✅ Successfully copied migrations to dist/packages/database/migrations");
}

// 2. Copy notification HTML email templates
const templatesSrc = path.resolve(process.cwd(), "apps/api/src/modules/notification/templates");
const templatesDest = path.resolve(process.cwd(), "dist/apps/api/src/modules/notification/templates");

if (fs.existsSync(templatesSrc)) {
    fs.cpSync(templatesSrc, templatesDest, {
        recursive: true,
        force: true,
        filter: (source) => {
            if (fs.statSync(source).isDirectory()) return true;
            return !source.endsWith(".ts");
        },
    });
    console.log("✅ Successfully copied email templates to dist/apps/api/src/modules/notification/templates");
}

// 3. Copy public static assets (logos, icons, defaults)
const publicSrc = path.resolve(process.cwd(), "apps/api/public");
const publicDest = path.resolve(process.cwd(), "dist/apps/api/public");

if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
    console.log("✅ Successfully copied public static assets to dist/apps/api/public");
}
