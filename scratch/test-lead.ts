import pool from "../packages/connection.js";
import { LeadRepository } from "../apps/api/src/modules/leads/repositories/lead.repository.js";
import { LeadStatusRepository } from "../apps/api/src/modules/leads/repositories/lead-status.repository.js";

async function run() {
    try {
        console.log("Connecting...");
        const statusRepo = new LeadStatusRepository(pool);
        const repo = new LeadRepository(pool);

        // find a tenant
        const tResult = await pool.query("SELECT uid FROM tenants LIMIT 1");
        const tenantUid = tResult.rows[0].uid;
        console.log("Tenant:", tenantUid);

        // find a default status
        const defaultStatus = await statusRepo.getDefault(tenantUid);
        console.log("Default status:", defaultStatus?.uid);

        // try create
        const lead = await repo.create(tenantUid, {
            firstName: "string",
            lastName: "string",
            mobileNumber: "7845784578",
            alternateNumber: "8965896589",
            email: "string@gmail.com",
            address: "string",
            state: "string",
            city: "string",
            pinCode: "383001",
            monthlyBillAmount: 0,
            systemSize: 0,
            followUpDate: "2026-07-07T12:00:00Z",
            leadSourceUid: "22d00f85-2ce4-4705-9bbf-5a45e10983c7",
            statusUid: defaultStatus?.uid || "",
            assignedTo: "970ede9f-eb45-487c-b712-3be51cd71762",
            remarks: "string"
        }, "sys");

        console.log("Success:", lead.uid);
    } catch (e) {
        console.error("Failed:", e);
    } finally {
        process.exit(0);
    }
}
run();
