import { Router } from "express";
import { CustomerHistoryController } from "../controllers/customer-history.controller.js";
import { CustomerHistoryService } from "../services/customer-history.service.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createCustomerHistoryRouter(): Router {
    const router = Router();
    const service = new CustomerHistoryService(pool);
    const controller = new CustomerHistoryController(service);

    router.use(authenticate);

    router.get("/", controller.getPaginated);
    router.get("/lead/:leadUid", controller.getByLeadUid);
    router.get("/:uid", controller.getByUid);

    return router;
}

export const customerHistoryRoutes = createCustomerHistoryRouter();
