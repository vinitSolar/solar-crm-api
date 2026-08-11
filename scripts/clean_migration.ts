import * as fs from 'fs';
import * as path from 'path';

const migrationPath = path.join(process.cwd(), 'packages/database/migrations/000_initial_schema.sql');
let content = fs.readFileSync(migrationPath, 'utf8');

// Remove BOM if present
if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
}

// Remove BEGIN; and COMMIT; globally
content = content.replace(/^BEGIN;\r?\n/gm, '');
content = content.replace(/^COMMIT;\r?\n/gm, '');

// Also catch any leftover ones without newline or at start/end
content = content.replace(/BEGIN;/g, '');
content = content.replace(/COMMIT;/g, '');

fs.writeFileSync(migrationPath, content, 'utf8');
console.log('Cleaned BOM and keywords from 000_initial_schema.sql');
