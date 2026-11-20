import { Pool } from "pg";
import { pushProvider } from "../apps/api/src/modules/notification/providers/push.provider.js";
import { env } from "../packages/config/index.js";

async function main() {
  console.log("====================================================");
  console.log("   SolarSetu — Push Notification Test Tool");
  console.log("====================================================\n");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || (env as any).DATABASE?.URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // 1. Fetch active devices
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
        t.updated_at
      FROM user_device_tokens t
      JOIN users u ON u.uid = t.user_uid
      WHERE t.is_active = 1
      ORDER BY t.updated_at DESC
      LIMIT 10
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.warn("⚠️  No active mobile device tokens found in database!");
      console.warn("   Make sure you have logged in to the SolarSetu mobile app on your phone.\n");
      return;
    }

    console.log(`📱 Found ${result.rows.length} active registered device(s):`);
    result.rows.forEach((row, idx) => {
      console.log(`   [${idx + 1}] User: ${row.first_name} ${row.last_name || ""} (${row.email}) | Device: ${row.device_name || "Unknown"} (${row.device_type})`);
    });
    console.log("");

    // Target the first user with active token
    const target = result.rows[0];
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
