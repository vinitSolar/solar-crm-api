import { Router } from "express";
import { FranchiseDocumentTypeController } from "../controllers/franchise-document-type.controller.js";
import { FranchiseDocumentTypeService } from "../services/franchise-document-type.service.js";
import { FranchiseDocumentTypeRepository } from "../repositories/franchise-document-type.repository.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import {
    createFranchiseDocumentTypeSchema,
    updateFranchiseDocumentTypeSchema,
    getFranchiseDocumentTypeSchema,
    getPaginatedFranchiseDocumentTypesSchema,
    validateFranchiseDocumentTypeRequest,
} from "../validators/franchise-document-type.validator.js";
import { requirePermission } from "../../../middlewares/permission.middleware.js";

function createFranchiseDocumentTypeRouter(): Router {
    const router = Router();

    // Dependency Injection
    const repository = new FranchiseDocumentTypeRepository();
    const service = new FranchiseDocumentTypeService(repository);
    const controller = new FranchiseDocumentTypeController(service);

    // Apply authentication to all routes
    router.use(authenticate);

    router.post(
        "/",
        requirePermission("FRANCHISES", "can_create"),
        validateFranchiseDocumentTypeRequest(createFranchiseDocumentTypeSchema),
        controller.create
    );

    router.post(
        "/list",
        requirePermission("FRANCHISES", "can_view"),
        validateFranchiseDocumentTypeRequest(getPaginatedFranchiseDocumentTypesSchema),
        controller.getPaginated
    );

    router.get(
        "/all",
        requirePermission("FRANCHISES", "can_view"),
        controller.getAll
    );

    router.get(
        "/dropdown",
        requirePermission("FRANCHISES", "can_view"),
        controller.getAll
    );

    router.get(
        "/:uid",
        requirePermission("FRANCHISES", "can_view"),
        validateFranchiseDocumentTypeRequest(getFranchiseDocumentTypeSchema),
        controller.getByUid
    );

    router.put(
        "/:uid",
        requirePermission("FRANCHISES", "can_edit"),
        validateFranchiseDocumentTypeRequest(updateFranchiseDocumentTypeSchema),
        controller.update
    );

    router.delete(
        "/:uid",
        requirePermission("FRANCHISES", "can_delete"),
        validateFranchiseDocumentTypeRequest(getFranchiseDocumentTypeSchema),
        controller.delete
    );

    router.put(
        "/:uid/restore",
        requirePermission("FRANCHISES", "can_edit"),
        validateFranchiseDocumentTypeRequest(getFranchiseDocumentTypeSchema),
        controller.restore
    );

    return router;
}

export const franchiseDocumentTypeRoutes = createFranchiseDocumentTypeRouter();
