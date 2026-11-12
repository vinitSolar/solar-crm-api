import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import pool from "../packages/connection.js";

interface DummyLeadTemplate {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  alternateNumber?: string;
  email: string;
  address: string;
  landmark: string;
  locality: string;
  city: string;
  state: string;
  pinCode: string;
  monthlyBillAmount: number;
  systemSize: number;
  category: number;
  sourceName: string;
  statusName: string;
  followUpOffsetDays: number;
  remarks: string;
}

const DUMMY_LEADS: DummyLeadTemplate[] = [
  {
    firstName: "Rohan",
    lastName: "Patel",
    mobileNumber: "9898110001",
    alternateNumber: "9898110101",
    email: "rohan.patel.demo@example.com",
    address: "14 Shyamal Residency, Satellite Road",
    landmark: "Near Shyamal Cross Road",
    locality: "Satellite",
    city: "Ahmedabad",
    state: "Gujarat",
    pinCode: "380015",
    monthlyBillAmount: 5500,
    systemSize: 3,
    category: 1,
    sourceName: "Website",
    statusName: "New",
    followUpOffsetDays: 1,
    remarks: "Interested in 3 kW on-grid residential rooftop system under PM Surya Ghar.",
  },
  {
    firstName: "Priya",
    lastName: "Shah",
    mobileNumber: "9898110002",
    email: "priya.shah.demo@example.com",
    address: "B-204 Serenity Greens, Vesu",
    landmark: "Opp. VR Mall",
    locality: "Vesu",
    city: "Surat",
    state: "Gujarat",
    pinCode: "395007",
    monthlyBillAmount: 8200,
    systemSize: 5,
    category: 1,
    sourceName: "Social Media",
    statusName: "Contacted",
    followUpOffsetDays: 2,
    remarks: "Requested site survey availability for next week morning slot.",
  },
  {
    firstName: "Kiran",
    lastName: "Desai",
    mobileNumber: "9898110003",
    email: "kiran.desai.demo@example.com",
    address: "42 Alkapuri Society, RC Dutt Road",
    landmark: "Near Express Hotel",
    locality: "Alkapuri",
    city: "Vadodara",
    state: "Gujarat",
    pinCode: "390007",
    monthlyBillAmount: 7200,
    systemSize: 4,
    category: 3,
    sourceName: "Referral",
    statusName: "Follow Up",
    followUpOffsetDays: 1,
    remarks: "Referred by existing Vadodara customer; wants mono PERC vs TOPCon comparison.",
  },
  {
    firstName: "Neha",
    lastName: "Mehta",
    mobileNumber: "9898110004",
    alternateNumber: "9898110104",
    email: "neha.mehta.demo@example.com",
    address: "88 Kalawad Road Bungalows",
    landmark: "Near KKV Hall",
    locality: "Kalawad Road",
    city: "Rajkot",
    state: "Gujarat",
    pinCode: "360005",
    monthlyBillAmount: 10500,
    systemSize: 6,
    category: 1,
    sourceName: "Walk-in",
    statusName: "Quotation Sent",
    followUpOffsetDays: 3,
    remarks: "6 kW quotation shared; customer reviewing net-metering timeline.",
  },
  {
    firstName: "Siddharth",
    lastName: "Joshi",
    mobileNumber: "9898110005",
    email: "siddharth.joshi.demo@example.com",
    address: "Plot 19, Sector 21",
    landmark: "Near District Shopping Centre",
    locality: "Sector 21",
    city: "Gandhinagar",
    state: "Gujarat",
    pinCode: "382021",
    monthlyBillAmount: 4800,
    systemSize: 3,
    category: 2,
    sourceName: "Website",
    statusName: "Negotiation",
    followUpOffsetDays: 2,
    remarks: "Comparing 3 kW packages; asked for structure elevation details.",
  },
  {
    firstName: "Anjali",
    lastName: "Parikh",
    mobileNumber: "9898110006",
    email: "anjali.parikh.demo@example.com",
    address: "7 Waghawadi Heritage Row Houses",
    landmark: "Near Takhteshwar Temple",
    locality: "Waghawadi Road",
    city: "Bhavnagar",
    state: "Gujarat",
    pinCode: "364001",
    monthlyBillAmount: 6400,
    systemSize: 4,
    category: 1,
    sourceName: "Cold Call",
    statusName: "New",
    followUpOffsetDays: 1,
    remarks: "Fresh inquiry captured; terrace has unobstructed south-facing area.",
  },
  {
    firstName: "Manish",
    lastName: "Gohil",
    mobileNumber: "9898110007",
    email: "manish.gohil.demo@example.com",
    address: "112 Patel Colony, Street 4",
    landmark: "Near DKV Circle",
    locality: "Patel Colony",
    city: "Jamnagar",
    state: "Gujarat",
    pinCode: "361008",
    monthlyBillAmount: 14500,
    systemSize: 8,
    category: 1,
    sourceName: "Event/Exhibition",
    statusName: "Contacted",
    followUpOffsetDays: 4,
    remarks: "Met at Renewable Energy Expo; owns duplex home with two AC units.",
  },
  {
    firstName: "Hinal",
    lastName: "Modi",
    mobileNumber: "9898110008",
    email: "hinal.modi.demo@example.com",
    address: "29 Modhera Road, Tirupati Bunglows",
    landmark: "Near Nagalpur College",
    locality: "Modhera Road",
    city: "Mehsana",
    state: "Gujarat",
    pinCode: "384002",
    monthlyBillAmount: 3900,
    systemSize: 2,
    category: 3,
    sourceName: "Referral",
    statusName: "Follow Up",
    followUpOffsetDays: 2,
    remarks: "Needs 2 kW residential setup with Gujarat subsidy guidance.",
  },
  {
    firstName: "Vivek",
    lastName: "Trivedi",
    mobileNumber: "9898110009",
    alternateNumber: "9898110109",
    email: "vivek.trivedi.demo@example.com",
    address: "503 Sindhu Bhavan Enclave",
    landmark: "Off SG Highway",
    locality: "Bodakdev",
    city: "Ahmedabad",
    state: "Gujarat",
    pinCode: "380054",
    monthlyBillAmount: 18000,
    systemSize: 10,
    category: 1,
    sourceName: "Website",
    statusName: "Quotation Sent",
    followUpOffsetDays: 3,
    remarks: "Three-phase 10 kW residential bungalow requirement; proposal sent.",
  },
  {
    firstName: "Pooja",
    lastName: "Kulkarni",
    mobileNumber: "9898110010",
    email: "pooja.kulkarni.demo@example.com",
    address: "18 Prabhat Housing Society, Kothrud",
    landmark: "Near Karve Statue",
    locality: "Kothrud",
    city: "Pune",
    state: "Maharashtra",
    pinCode: "411038",
    monthlyBillAmount: 7600,
    systemSize: 5,
    category: 1,
    sourceName: "Social Media",
    statusName: "New",
    followUpOffsetDays: 1,
    remarks: "Inquired about central PM Surya Ghar subsidy outside Gujarat.",
  },
  {
    firstName: "Hardik",
    lastName: "Raval",
    mobileNumber: "9898110011",
    email: "hardik.raval.demo@example.com",
    address: "33 Vidyanagar Duplex",
    landmark: "Near Mota Bazar",
    locality: "Vallabh Vidyanagar",
    city: "Anand",
    state: "Gujarat",
    pinCode: "388120",
    monthlyBillAmount: 6100,
    systemSize: 3.5,
    category: 4,
    sourceName: "Walk-in",
    statusName: "Negotiation",
    followUpOffsetDays: 2,
    remarks: "Visited branch office; finalizing inverter brand selection.",
  },
  {
    firstName: "Kavita",
    lastName: "Chauhan",
    mobileNumber: "9898110012",
    email: "kavita.chauhan.demo@example.com",
    address: "9 Zadeshwar Green Villas",
    landmark: "Near Golden Bridge Approach",
    locality: "Zadeshwar",
    city: "Bharuch",
    state: "Gujarat",
    pinCode: "392011",
    monthlyBillAmount: 9200,
    systemSize: 5,
    category: 1,
    sourceName: "Cold Call",
    statusName: "Contacted",
    followUpOffsetDays: 3,
    remarks: "Evening callback scheduled with family homeowner.",
  },
  {
    firstName: "Nikhil",
    lastName: "Bhatt",
    mobileNumber: "9898110013",
    email: "nikhil.bhatt.demo@example.com",
    address: "64 College Road Tenaments",
    landmark: "Near Santram Mandir",
    locality: "College Road",
    city: "Nadiad",
    state: "Gujarat",
    pinCode: "387001",
    monthlyBillAmount: 5100,
    systemSize: 3,
    category: 2,
    sourceName: "Referral",
    statusName: "Follow Up",
    followUpOffsetDays: 4,
    remarks: "Collecting last 3 electricity bills for DISCOM load verification.",
  },
  {
    firstName: "Meera",
    lastName: "Solanki",
    mobileNumber: "9898110014",
    email: "meera.solanki.demo@example.com",
    address: "22 Tithal Coastal Homes",
    landmark: "Near Tithal Beach Road",
    locality: "Tithal",
    city: "Valsad",
    state: "Gujarat",
    pinCode: "396001",
    monthlyBillAmount: 6900,
    systemSize: 4,
    category: 1,
    sourceName: "Event/Exhibition",
    statusName: "Quotation Sent",
    followUpOffsetDays: 2,
    remarks: "Requested corrosion-resistant mounting structure for coastal area.",
  },
  {
    firstName: "Arjun",
    lastName: "Jadeja",
    mobileNumber: "9898110015",
    alternateNumber: "9898110115",
    email: "arjun.jadeja.demo@example.com",
    address: "5 Ward 12B, Tagore Road",
    landmark: "Near Rotary Circle",
    locality: "Gandhidham",
    city: "Kutch",
    state: "Gujarat",
    pinCode: "370201",
    monthlyBillAmount: 12000,
    systemSize: 7,
    category: 1,
    sourceName: "Website",
    statusName: "New",
    followUpOffsetDays: 1,
    remarks: "Looking for turnkey rooftop installation with biometric financing option.",
  },
];

async function run() {
  const client = await pool.connect();

  try {
    const tenantArg = process.argv.find((arg) => arg.startsWith("--tenant="));
    const targetCode = tenantArg ? tenantArg.split("=")[1]?.trim().toUpperCase() : "HO";

    const tenantRes = await client.query(
      "SELECT uid, code, name FROM tenants WHERE code = $1 AND is_deleted = 0 LIMIT 1",
      [targetCode],
    );
    if (tenantRes.rows.length === 0) {
      throw new Error(`Tenant with code "${targetCode}" not found.`);
    }
    const tenant = tenantRes.rows[0] as { uid: string; code: string; name: string };

    const usersRes = await client.query(
      `
        SELECT u.uid, u.first_name, u.last_name, r.name AS role_name, r.can_sale
        FROM users u
        LEFT JOIN roles r ON u.role_uid = r.uid
        WHERE u.tenant_uid = $1 AND u.is_deleted = 0 AND u.is_active = 1
        ORDER BY r.can_sale DESC NULLS LAST, u.created_at ASC
      `,
      [tenant.uid],
    );
    const createdByUser = usersRes.rows[0] as { uid: string } | undefined;
    const assignedUser =
      (usersRes.rows.find((u) => Number(u.can_sale) === 1) as { uid: string } | undefined) ?? createdByUser;

    if (!createdByUser || !assignedUser) {
      throw new Error(`No active users found for tenant "${tenant.code}".`);
    }

    const sourcesRes = await client.query(
      "SELECT uid, name, is_default FROM lead_sources WHERE tenant_uid = $1 AND is_deleted = 0 AND is_active = 1 ORDER BY sort_order ASC",
      [tenant.uid],
    );
    const statusesRes = await client.query(
      "SELECT uid, name, is_default FROM lead_statuses WHERE tenant_uid = $1 AND is_deleted = 0 AND is_active = 1 ORDER BY sort_order ASC",
      [tenant.uid],
    );

    const sourceByName = new Map<string, string>();
    let defaultSourceUid = sourcesRes.rows[0]?.uid as string | undefined;
    for (const row of sourcesRes.rows) {
      sourceByName.set(String(row.name).trim().toLowerCase(), row.uid);
      if (Number(row.is_default) === 1) defaultSourceUid = row.uid;
    }

    const statusByName = new Map<string, string>();
    let defaultStatusUid = statusesRes.rows[0]?.uid as string | undefined;
    for (const row of statusesRes.rows) {
      statusByName.set(String(row.name).trim().toLowerCase(), row.uid);
      if (Number(row.is_default) === 1) defaultStatusUid = row.uid;
    }

    if (!defaultSourceUid || !defaultStatusUid) {
      throw new Error(`Missing lead sources or lead statuses for tenant "${tenant.code}".`);
    }

    await client.query("BEGIN");

    const maxNumRes = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(lead_number FROM 3) AS INTEGER)), 0) AS max_num
      FROM leads
      WHERE lead_number ~ '^SS[0-9]+$'
    `);
    let nextNum = Number(maxNumRes.rows[0]?.max_num || 0);

    const insertedNumbers: string[] = [];
    const skippedMobiles: string[] = [];

    for (const item of DUMMY_LEADS) {
      const existing = await client.query(
        "SELECT uid FROM leads WHERE tenant_uid = $1 AND mobile_number = $2 AND is_deleted = 0 LIMIT 1",
        [tenant.uid, item.mobileNumber],
      );
      if (existing.rows.length > 0) {
        skippedMobiles.push(item.mobileNumber);
        continue;
      }

      nextNum += 1;
      const leadNumber = `SS${String(nextNum).padStart(5, "0")}`;
      const leadUid = uuidv4();
      const followUpDate = new Date(Date.now() + item.followUpOffsetDays * 24 * 60 * 60 * 1000);
      const sourceUid = sourceByName.get(item.sourceName.trim().toLowerCase()) ?? defaultSourceUid;
      const statusUid = statusByName.get(item.statusName.trim().toLowerCase()) ?? defaultStatusUid;

      await client.query(
        `
          INSERT INTO leads (
            uid, tenant_uid, lead_number, first_name, last_name, mobile_number, alternate_number,
            email, address, landmark, locality, state, city, pin_code,
            monthly_bill_amount, system_size, follow_up_date,
            lead_source_uid, status_uid, assigned_to, category, is_quick_lead, created_by
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17,
            $18, $19, $20, $21, 0, $22
          )
        `,
        [
          leadUid,
          tenant.uid,
          leadNumber,
          item.firstName,
          item.lastName,
          item.mobileNumber,
          item.alternateNumber ?? null,
          item.email,
          item.address,
          item.landmark,
          item.locality,
          item.state,
          item.city,
          item.pinCode,
          item.monthlyBillAmount,
          item.systemSize,
          followUpDate,
          sourceUid,
          statusUid,
          assignedUser.uid,
          item.category,
          createdByUser.uid,
        ],
      );

      await client.query(
        `
          INSERT INTO notes (uid, tenant_uid, module, module_uid, note, created_by)
          VALUES ($1, $2, 'lead', $3, $4, $5)
        `,
        [uuidv4(), tenant.uid, leadUid, item.remarks, createdByUser.uid],
      );

      insertedNumbers.push(`${leadNumber} (${item.firstName} ${item.lastName})`);
    }

    await client.query("COMMIT");

    console.log(`Tenant: ${tenant.name} (${tenant.code})`);
    console.log(`Inserted ${insertedNumbers.length} dummy leads:`);
    for (const entry of insertedNumbers) {
      console.log(`  - ${entry}`);
    }
    if (skippedMobiles.length > 0) {
      console.log(`Skipped ${skippedMobiles.length} already-existing mobile numbers.`);
    }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Failed to seed dummy leads:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();

