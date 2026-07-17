import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool as db } from '../../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

const runSeeder = async () => {
  console.log('Starting Geonames Seeder...');

  const geonamesPath = path.resolve(__dirname, '../../../geonames-postal-code (2).json');

  const statesMap = new Map();
  const districtsMap = new Map();
  const citiesMap = new Map();

  let stateCodeCounter = 10000;
  let cityCodeCounter = 100000;
  let districtCodeCounter = 100000;

  const processStream = () => new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(geonamesPath, { encoding: 'utf8', highWaterMark: 64 * 1024 });
    let inString = false;
    let escape = false;
    let depth = 0;
    let objBuffer = '';

    stream.on('data', (chunk: string) => {
      for (let i = 0; i < chunk.length; i++) {
        const char = chunk[i];

        if (escape) {
          escape = false;
        } else if (char === '\\') {
          escape = true;
        } else if (char === '"') {
          inString = !inString;
        }

        if (!inString) {
          if (char === '{') {
            depth++;
          } else if (char === '}') {
            depth--;
          }
        }

        if (depth > 0 || (depth === 0 && char === '}')) {
          objBuffer += char;
        }

        if (depth === 0 && objBuffer.length > 0) {
          if (objBuffer.trim().startsWith('{')) {
            try {
              const entry = JSON.parse(objBuffer);
              if (entry.admin_name1 && entry.admin_code1) {
                if (!statesMap.has(entry.admin_code1)) {
                  let code = parseInt(entry.admin_code1);
                  if (isNaN(code)) code = stateCodeCounter++;
                  statesMap.set(entry.admin_code1, { code, name: entry.admin_name1 });
                }
              }

              if (entry.admin_name2 && entry.admin_code1) {
                let dCode = entry.admin_code2 ? parseInt(entry.admin_code2) : districtCodeCounter++;
                if (isNaN(dCode)) dCode = districtCodeCounter++;
                const districtKey = `${entry.admin_code1}_${entry.admin_name2}`;
                if (!districtsMap.has(districtKey)) {
                  districtsMap.set(districtKey, {
                    code: dCode,
                    stateCodeStr: entry.admin_code1,
                    name: entry.admin_name2
                  });
                }
              }

              if (entry.admin_name3 && entry.admin_code1) {
                let cCode = entry.admin_code3 ? parseInt(entry.admin_code3) : cityCodeCounter++;
                if (isNaN(cCode)) cCode = cityCodeCounter++;
                // Clean punctuation and whitespace for checking uniqueness and storing
                const rawName = entry.admin_name3;
                const cleanName = rawName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
                const cityKey = cleanName.toLowerCase();
                if (!citiesMap.has(cityKey)) {
                  citiesMap.set(cityKey, {
                    code: cCode,
                    stateCodeStr: entry.admin_code1,
                    districtNameStr: entry.admin_name2,
                    name: cleanName,
                    pincode: entry.postal_code || 'NULL'
                  });
                }
              }
            } catch (e) {
              // Ignore invalid JSON on stray braces
            }
          }
          objBuffer = '';
        }
      }
    });

    stream.on('end', () => resolve());
    stream.on('error', err => reject(err));
  });

  try {
    console.log('Clearing existing location data to prevent duplicates...');
    await db.query('TRUNCATE TABLE cities, districts, states CASCADE');

    console.log('Parsing JSON stream efficiently...');
    await processStream();
    console.log(`Extracted ${statesMap.size} states, ${districtsMap.size} districts, ${citiesMap.size} cities.`);

    // 1. States
    const statesData = Array.from(statesMap.values());
    console.log(`Inserting ${statesData.length} states...`);
    for (const chunk of chunkArray(statesData, 500)) {
      const values = chunk.map(s => `(${s.code}, '${s.name.replace(/'/g, "''")}')`).join(',');
      if (values) await db.query(`INSERT INTO states (code, name) VALUES ${values} ON CONFLICT (code) DO NOTHING`);
    }

    const statesResult = await db.query('SELECT uid, code FROM states');
    const stateCodeToUid = new Map(statesResult.rows.map(r => [r.code, r.uid]));

    // 2. Districts
    const districtsData = Array.from(districtsMap.values());
    console.log(`Inserting ${districtsData.length} districts...`);
    for (const chunk of chunkArray(districtsData, 500)) {
      const values = chunk.map(d => {
        const stateObj = statesMap.get(d.stateCodeStr);
        const stateUid = stateObj ? stateCodeToUid.get(stateObj.code) : null;
        return stateUid ? `(${d.code}, '${stateUid}', '${d.name.replace(/'/g, "''")}')` : null;
      }).filter(v => v !== null).join(',');
      if (values) await db.query(`INSERT INTO districts (code, state_uid, name) VALUES ${values} ON CONFLICT (code) DO NOTHING`);
    }

    const districtsResult = await db.query('SELECT uid, code FROM districts');
    const districtCodeToUid = new Map(districtsResult.rows.map(r => [r.code, r.uid]));

    // 3. Cities
    console.log(`Inserting ${citiesMap.size} cities...`);
    const citiesData = Array.from(citiesMap.values());
    for (const chunk of chunkArray(citiesData, 500)) {
      const values = chunk.map(c => {
        const stateObj = statesMap.get(c.stateCodeStr);
        const stateUid = stateObj ? stateCodeToUid.get(stateObj.code) : null;
        
        let districtUid = 'NULL';
        if (c.districtNameStr) {
            const districtKey = `${c.stateCodeStr}_${c.districtNameStr}`;
            const districtObj = districtsMap.get(districtKey);
            if (districtObj) {
                const uid = districtCodeToUid.get(districtObj.code);
                if (uid) districtUid = `'${uid}'`;
            }
        }

        let pin = 'NULL';
        if (c.pincode !== 'NULL') {
          const parsed = parseInt(c.pincode);
          if (!isNaN(parsed)) pin = parsed.toString();
        }
        return stateUid ? `(${c.code}, '${stateUid}', ${districtUid}, '${c.name.replace(/'/g, "''")}', '', ${pin})` : null;
      }).filter(val => val !== null).join(',');
      if (values) await db.query(`INSERT INTO cities (code, state_uid, district_uid, name, local_body_type, pincode) VALUES ${values} ON CONFLICT (code) DO NOTHING`);
    }

    console.log('Geonames seeder completed successfully.');
  } catch (error) {
    console.error('Error running geonames seeder:', error);
  } finally {
    process.exit(0);
  }
};

runSeeder();
