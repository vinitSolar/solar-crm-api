import xlsx from 'xlsx';
import axios from 'axios';
import { Pool } from 'pg';
import path from 'path';
import 'dotenv/config';

// Using standard pool connection instead of internal one to avoid potential issues with internal modules
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'vinit',
  database: process.env.DB_NAME || 'solar_crm_india',
});

const EXCEL_FILE = 'c:/Vinit/sunselect-crm/5c2f62fe-5afa-4119-a499-fec9d604d5bd 2.xlsx';
const POSTAL_API_URL = 'https://api.postalpincode.in/pincode';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runMigration() {
  console.log('Running migration to add postal info columns to cities table...');
  await pool.query(`
    ALTER TABLE cities
    ADD COLUMN IF NOT EXISTS block VARCHAR(255),
    ADD COLUMN IF NOT EXISTS branch_type VARCHAR(255),
    ADD COLUMN IF NOT EXISTS region VARCHAR(255);
  `);
  console.log('Migration completed.');
}

async function getPincodesFromExcel(): Promise<Set<string>> {
  const pincodes = new Set<string>();
  try {
    const workbook = xlsx.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      console.warn('No sheets found in the excel file.');
      return pincodes;
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.warn(`Sheet ${sheetName} not found.`);
      return pincodes;
    }
    const data = xlsx.utils.sheet_to_json<any>(sheet);

    for (const row of data) {
      for (const key of Object.keys(row)) {
        const value = String(row[key]).trim();
        if (/^\d{6}$/.test(value)) {
          pincodes.add(value);
        }
      }
    }
  } catch (error) {
    console.error('Error reading excel file:', error);
  }
  return pincodes;
}

async function insertState(name: string): Promise<string> {
  name = name.trim();
  const res = await pool.query('SELECT uid FROM states WHERE name = $1', [name]);
  if (res.rowCount && res.rowCount > 0) {
    return res.rows[0].uid;
  }
  
  const codeRes = await pool.query('SELECT COALESCE(MAX(code), 0) + 1 AS next_code FROM states');
  const code = codeRes.rows[0].next_code;

  const insertRes = await pool.query(
    'INSERT INTO states (code, name) VALUES ($1, $2) RETURNING uid',
    [code, name]
  );
  return insertRes.rows[0].uid;
}

async function insertDistrict(name: string, stateUid: string): Promise<string> {
  name = name.trim();
  const res = await pool.query('SELECT uid FROM districts WHERE name = $1 AND state_uid = $2', [name, stateUid]);
  if (res.rowCount && res.rowCount > 0) {
    return res.rows[0].uid;
  }
  
  const codeRes = await pool.query('SELECT COALESCE(MAX(code), 0) + 1 AS next_code FROM districts');
  const code = codeRes.rows[0].next_code;

  const insertRes = await pool.query(
    'INSERT INTO districts (code, state_uid, name) VALUES ($1, $2, $3) RETURNING uid',
    [code, stateUid, name]
  );
  return insertRes.rows[0].uid;
}

async function insertCity(name: string, stateUid: string, districtUid: string, pincode: number, block: string | null, branchType: string | null, region: string | null) {
  name = name.trim();
  const res = await pool.query('SELECT uid FROM cities WHERE name = $1 AND district_uid = $2 AND pincode = $3', [name, districtUid, pincode]);
  if (res.rowCount && res.rowCount > 0) {
    return res.rows[0].uid;
  }

  const codeRes = await pool.query('SELECT COALESCE(MAX(code), 0) + 1 AS next_code FROM cities');
  const code = codeRes.rows[0].next_code;

  const insertRes = await pool.query(
    'INSERT INTO cities (code, state_uid, district_uid, name, pincode, block, branch_type, region) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING uid',
    [code, stateUid, districtUid, name, pincode, block, branchType, region]
  );
  return insertRes.rows[0].uid;
}

async function seedData() {
  await runMigration();
  
  console.log('Reading pincodes from Excel...');
  const pincodes = await getPincodesFromExcel();
  console.log(`Found ${pincodes.size} unique pincodes.`);

  let processed = 0;
  for (const pincode of Array.from(pincodes)) {
    try {
      const response = await axios.get(`${POSTAL_API_URL}/${pincode}`);
      const data = response.data;
      
      if (data && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice)) {
        const postOffices = data[0].PostOffice;
        console.log(`Pincode ${pincode}: found ${postOffices.length} entries.`);
        
        for (const po of postOffices) {
          const stateName = po.State;
          const districtName = po.District;
          const cityName = po.Name;
          const block = po.Block;
          const branchType = po.BranchType;
          const region = po.Region;

          if (stateName && districtName && cityName) {
            const stateUid = await insertState(stateName);
            const districtUid = await insertDistrict(districtName, stateUid);
            await insertCity(cityName, stateUid, districtUid, parseInt(pincode), block, branchType, region);
          }
        }
      } else {
        console.log(`Pincode ${pincode}: not found or failed.`);
      }
    } catch (e: any) {
      console.error(`Error processing pincode ${pincode}:`, e.message);
    }
    
    processed++;
    // Basic rate limiting to not hit API too hard
    await delay(100); 
  }

  console.log(`Processed ${processed} pincodes. Finished.`);
  await pool.end();
}

seedData().catch(e => {
  console.error('Fatal Error:', e);
  pool.end();
});
