import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { pool as db } from '../../index.js';

// Helper to chunk arrays for bulk inserts
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

const runSeeder = async () => {
  console.log('Starting universal locations seeder...');
  const dataPath = path.resolve(__dirname, '../data'); // c:\Vinit\sunselect-crm\packages\database\data

  try {
    const statesMap = new Map();
    const districtsMap = new Map();
    const subdistrictsMap = new Map();
    const villagesMap = new Map();
    const citiesMap = new Map();

    const files = fs.readdirSync(dataPath);
    
    // --- 1. Load JSON data first ---
    if (files.includes('states.json')) {
      const content = fs.readFileSync(path.join(dataPath, 'states.json'), 'utf-8').replace(/^\uFEFF/, '');
      const d = JSON.parse(content);
      for (const s of d) {
        if (s.stateCode) statesMap.set(s.stateCode, s.stateNameEnglish.trim().replace(/'/g, "''"));
      }
    }
    
    if (files.includes('districts.json')) {
      const content = fs.readFileSync(path.join(dataPath, 'districts.json'), 'utf-8').replace(/^\uFEFF/, '');
      const d = JSON.parse(content);
      for (const district of d) {
        if (district.districtCode && statesMap.has(district.stateCode)) {
          districtsMap.set(district.districtCode, {
            stateCode: district.stateCode,
            name: district.districtNameEnglish.trim().replace(/'/g, "''")
          });
        }
      }
    }

    if (files.includes('subdistricts.json')) {
      const content = fs.readFileSync(path.join(dataPath, 'subdistricts.json'), 'utf-8').replace(/^\uFEFF/, '');
      const d = JSON.parse(content);
      for (const sd of d) {
        if (sd.subdistrictCode && districtsMap.has(sd.districtCode)) {
          subdistrictsMap.set(sd.subdistrictCode, {
            stateCode: sd.stateCode,
            districtCode: sd.districtCode,
            name: sd.subdistrictNameEnglish.trim().replace(/'/g, "''")
          });
        }
      }
    }

    if (files.includes('villages.json')) {
      const content = fs.readFileSync(path.join(dataPath, 'villages.json'), 'utf-8').replace(/^\uFEFF/, '');
      const d = JSON.parse(content);
      for (const v of d) {
        if (v.villageCode && subdistrictsMap.has(v.subdistrictCode)) {
          villagesMap.set(v.villageCode, {
            stateCode: v.stateCode,
            districtCode: v.districtCode,
            subdistrictCode: v.subdistrictCode,
            name: v.villageNameEnglish.trim().replace(/'/g, "''"),
            pincode: v.pincode || 'NULL'
          });
        }
      }
    }

    if (files.includes('cities.json')) {
      const content = fs.readFileSync(path.join(dataPath, 'cities.json'), 'utf-8').replace(/^\uFEFF/, '');
      const d = JSON.parse(content);
      for (const c of d) {
        if (c.cityCode && statesMap.has(c.stateCode)) {
          citiesMap.set(c.cityCode, {
            stateCode: c.stateCode,
            name: c.cityNameEnglish.trim().replace(/'/g, "''"),
            localBodyType: (c.localBodyTypeName || '').replace(/'/g, "''"),
            pincode: c.pincode || 'NULL'
          });
        }
      }
    }


    // --- 3. Insert ---
    const statesData = Array.from(statesMap.entries()).map(([code, name]) => ({ code, name }));
    console.log(`Inserting ${statesData.length} states...`);
    for (const chunk of chunkArray(statesData, 500)) {
      const values = chunk.map(s => `(${s.code}, '${s.name}')`).join(',');
      if (values) await db.query(`INSERT INTO states (code, name) VALUES ${values} ON CONFLICT (code) DO NOTHING`);
    }

    const statesResult = await db.query('SELECT id, code FROM states');
    const stateCodeToId = new Map(statesResult.rows.map(r => [r.code, r.id]));

    const districtsData = Array.from(districtsMap.entries()).map(([code, d]) => ({ code, ...d }));
    console.log(`Inserting ${districtsData.length} districts...`);
    for (const chunk of chunkArray(districtsData, 500)) {
      const values = chunk.map(d => {
         const stateId = stateCodeToId.get(d.stateCode);
         return stateId ? `(${d.code}, ${stateId}, '${d.name}')` : null;
      }).filter(v => v !== null).join(',');
      if (values) await db.query(`INSERT INTO districts (code, state_id, name) VALUES ${values} ON CONFLICT (code) DO NOTHING`);
    }

    const districtsResult = await db.query('SELECT id, code FROM districts');
    const districtCodeToId = new Map(districtsResult.rows.map(r => [r.code, r.id]));

    const subdistrictsData = Array.from(subdistrictsMap.entries()).map(([code, sd]) => ({ code, ...sd }));
    console.log(`Inserting ${subdistrictsData.length} subdistricts...`);
    for (const chunk of chunkArray(subdistrictsData, 500)) {
      const values = chunk.map(sd => {
         const stateId = stateCodeToId.get(sd.stateCode);
         const districtId = districtCodeToId.get(sd.districtCode);
         return (stateId && districtId) ? `(${sd.code}, ${stateId}, ${districtId}, '${sd.name}')` : null;
      }).filter(v => v !== null).join(',');
      if (values) await db.query(`INSERT INTO subdistricts (code, state_id, district_id, name) VALUES ${values} ON CONFLICT (code) DO NOTHING`);
    }

    const subdistrictsResult = await db.query('SELECT id, code FROM subdistricts');
    const subdistrictCodeToId = new Map(subdistrictsResult.rows.map(r => [r.code, r.id]));

    const villagesData = Array.from(villagesMap.entries()).map(([code, v]) => ({ code, ...v }));
    console.log(`Inserting ${villagesData.length} villages...`);
    for (const chunk of chunkArray(villagesData, 500)) {
      const values = chunk.map(v => {
         const stateId = stateCodeToId.get(v.stateCode);
         const districtId = districtCodeToId.get(v.districtCode);
         const subdistrictId = subdistrictCodeToId.get(v.subdistrictCode);
         return (stateId && districtId && subdistrictId) ? `(${v.code}, ${stateId}, ${districtId}, ${subdistrictId}, '${v.name}', ${v.pincode})` : null;
      }).filter(val => val !== null).join(',');
      if (values) await db.query(`INSERT INTO villages (code, state_id, district_id, subdistrict_id, name, pincode) VALUES ${values} ON CONFLICT (code) DO NOTHING`);
    }

    const citiesData = Array.from(citiesMap.entries()).map(([code, c]) => ({ code, ...c }));
    if (citiesData.length > 0) {
      console.log(`Inserting ${citiesData.length} cities...`);
      for (const chunk of chunkArray(citiesData, 500)) {
        const values = chunk.map(c => {
           const stateId = stateCodeToId.get(c.stateCode);
           return stateId ? `(${c.code}, ${stateId}, '${c.name}', '${c.localBodyType}', ${c.pincode})` : null;
        }).filter(val => val !== null).join(',');
        if (values) await db.query(`INSERT INTO cities (code, state_id, name, local_body_type, pincode) VALUES ${values} ON CONFLICT (code) DO NOTHING`);
      }
    }

    console.log('Universal locations seeder completed successfully.');
  } catch (error) {
    console.error('Error running locations seeder:', error);
    process.exit(1);
  } finally {
      process.exit(0);
  }
};

runSeeder();
