import { env } from "@packages/config/index.js";
import { connectDatabase } from "@packages/index.js";
import { startNotificationWorker } from "./modules/notification/index.js";
import { startQuotationWorker } from "./modules/quotations/index.js";
import http from "http";

import app from "./app.js";

const server = http.createServer(app);

async function startServer() {
    // Connect to database and run migrations
    await connectDatabase();

    // Start BullMQ notification worker (fail-safe: logs warning if Redis unavailable)
    startNotificationWorker();

    // Start quotation snapshot worker (fail-safe too)
    startQuotationWorker();

    server.listen(env.APP.PORT, () => {
        console.log(`
=========================================
 ${env.APP.NAME} API
 Environment : ${env.APP.NODE_ENV}
 Port        : ${env.APP.PORT}
=========================================
`);
    });
}

startServer();