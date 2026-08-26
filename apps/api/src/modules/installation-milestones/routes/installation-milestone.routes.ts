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
import { requirePermission } from "../../../middlewares/permission.middleware.js";

function createInstallationMilestoneRouter(): Router {
    const router = Router();

    const repository = new InstallationMilestoneRepository(pool);
    const service = new InstallationMilestoneService(repository);
    const controller = new InstallationMilestoneController(service);

    router.use(authenticate);

    router.get(
        "/all",
        requirePermission("installation_milestones", "can_view"),
        validateInstallationMilestoneRequest(getAllSchema),
        controller.getAllInstallationMilestones,
    );

    router.get(
        "/:uid",
        requirePermission("installation_milestones", "can_view"),
        validateInstallationMilestoneRequest(getByUidSchema),
        controller.getInstallationMilestoneByUid,
    );

    router.post(
        "/",
        requirePermission("installation_milestones", "can_create"),
        validateInstallationMilestoneRequest(createInstallationMilestoneSchema),
        controller.createInstallationMilestone,
    );

    router.put(
        "/:uid",
        requirePermission("installation_milestones", "can_edit"),
        validateInstallationMilestoneRequest(updateInstallationMilestoneSchema),
        controller.updateInstallationMilestone,
    );

    router.delete(
        "/:uid",
        requirePermission("installation_milestones", "can_delete"),
        validateInstallationMilestoneRequest(getByUidSchema),
        controller.deleteInstallationMilestone,
    );

    router.put(
        "/:uid/restore",
        requirePermission("installation_milestones", "can_edit"),
        validateInstallationMilestoneRequest(getByUidSchema),
        controller.restoreInstallationMilestone,
    );

    return router;
}

export const installationMilestoneRoutes = createInstallationMilestoneRouter();
