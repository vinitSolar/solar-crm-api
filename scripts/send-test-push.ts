import "dotenv/config";
import { Pool } from "pg";
import { pushProvider } from "../apps/api/src/modules/notification/providers/push.provider.js";
import { env } from "../packages/config/index.js";

function createPool(forceNoSsl = false): Pool {
  const connectionString = process.env.DATABASE_URL || (env as any).DATABASE?.URL;
  const isSsl = !forceNoSsl && (
    process.env.DB_SSL === "true" ||
    (process.env.DB_SSL !== "false" && Boolean(connectionString && (
      connectionString.includes("sslmode=require") ||
      connectionString.includes("neon.tech") ||
      connectionString.includes("supabase.co")
    )))
  );

  return new Pool(
    connectionString
      ? {
          connectionString,
          ...(isSsl ? { ssl: { rejectUnauthorized: false } } : {}),
        }
      : {
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT) || 5432,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          ...(isSsl ? { ssl: { rejectUnauthorized: false } } : {}),
        }
  );
}

async function main() {
  console.log("====================================================");
  console.log("   SolarSetu — Push Notification Test Tool");
  console.log("====================================================\n");

  let pool = createPool();

  try {
    // Test query and auto-fallback if SSL is unsupported by the server
    try {
      await pool.query("SELECT 1");
    } catch (err: any) {
      if (err.message?.includes("does not support SSL") || err.message?.includes("server does not support SSL")) {
        console.log("ℹ️  Server does not support SSL — reconnecting without SSL...");
        await pool.end().catch(() => {});
        pool = createPool(true);
        await pool.query("SELECT 1");
      } else {
        throw err;
      }
    }
    // 1. Ensure latest Xiaomi physical phone is active if found
    await pool.query(`
      UPDATE user_device_tokens 
      SET is_active = 1 
      WHERE device_name = 'Xiaomi 2201117TI' 
        AND updated_at = (SELECT MAX(updated_at) FROM user_device_tokens WHERE device_name = 'Xiaomi 2201117TI')
    `);

    // Fetch devices
    const query = `
      SELECT 
        u.uid AS user_uid,
        u.first_name,
        u.last_name,
        u.email,
        u.tenant_uid,
        t.device_name,
        t.device_type,
        t.device_token,
        t.is_active,
        t.updated_at
      FROM user_device_tokens t
      JOIN users u ON u.uid = t.user_uid
      ORDER BY t.updated_at DESC
      LIMIT 10
    `;

    const result = await pool.query(query);

    console.log(`📱 Found ${result.rows.length} total device records in database:`);
    result.rows.forEach((row, idx) => {
      console.log(`   [${idx + 1}] User: ${row.first_name} (${row.email}) | Device: ${row.device_name || "Unknown"} | Active: ${row.is_active} | Updated: ${row.updated_at}`);
    });
    console.log("");

    const activeRows = result.rows.filter(r => r.is_active === 1);
    if (activeRows.length === 0) {
      console.warn("⚠️  No active mobile device tokens found in database!");
      console.warn("   Make sure you have logged in to the SolarSetu mobile app on your phone.\n");
      return;
    }

    // Target the first active row (preferring non-emulator if available)
    const target = activeRows.find(r => !r.device_name?.includes("sdk_gphone")) || activeRows[0];
    const timestamp = new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" });
    const title = process.argv[2] || "SolarSetu Push Test";
    const body = process.argv[3] || `🔔 Test notification at ${timestamp}. Notification is working properly!`;

    console.log(`🚀 Sending test push to: ${target.first_name} (${target.email}) on ${target.device_name || "Device"}...`);

    await pushProvider.sendPush({
      tenantUid: target.tenant_uid,
      recipient: target.user_uid,
      channel: "push" as any,
      template: "test_push" as any,
      module: "test",
      referenceUid: target.user_uid,
      variables: {
        title,
        body,
        message: body,
      },
    });

    console.log("\n====================================================");
    console.log("🎉 Test Push Dispatched!");
    console.log(`   Title: ${title}`);
    console.log(`   Body:  ${body}`);
    console.log("   Check your phone's notification bar!");
    console.log("====================================================\n");
  } catch (err: any) {
    console.error("\n❌ Error sending test push notification:", err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
