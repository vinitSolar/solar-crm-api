import { Router } from "express";
import { InstallationMilestoneController } from "../controllers/installation-milestone.controller.js";
import { InstallationMilestoneService } from "../services/installation-milestone.service.js";
import { InstallationMilestoneRepository } from "../repositories/installation-milestone.repository.js";
import {
    createInstallationMilestoneSchema,
    updateInstallationMilestoneSchema,
    getByUidSchema,
    getAllSchema,
    validateInstallationMilestoneRequest,
} from "../validators/installation-milestone.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createInstallationMilestoneRouter(): Router {
    const router = Router();

    const repository = new InstallationMilestoneRepository(pool);
    const service = new InstallationMilestoneService(repository);
    const controller = new InstallationMilestoneController(service);

    router.use(authenticate);

    router.get(
        "/all",
        validateInstallationMilestoneRequest(getAllSchema),
        controller.getAllInstallationMilestones,
    );

    router.get(
        "/:uid",
        validateInstallationMilestoneRequest(getByUidSchema),
        controller.getInstallationMilestoneByUid,
    );

    router.post(
        "/",
        validateInstallationMilestoneRequest(createInstallationMilestoneSchema),
        controller.createInstallationMilestone,
    );

    router.put(
        "/:uid",
        validateInstallationMilestoneRequest(updateInstallationMilestoneSchema),
        controller.updateInstallationMilestone,
    );

    router.delete(
        "/:uid",
        validateInstallationMilestoneRequest(getByUidSchema),
        controller.deleteInstallationMilestone,
    );

    router.put(
        "/:uid/restore",
        validateInstallationMilestoneRequest(getByUidSchema),
        controller.restoreInstallationMilestone,
    );

    return router;
}

export const installationMilestoneRoutes = createInstallationMilestoneRouter();
