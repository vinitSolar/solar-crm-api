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
        validateFranchiseDocumentTypeRequest(createFranchiseDocumentTypeSchema),
        controller.create
    );

    router.post(
        "/list",
        validateFranchiseDocumentTypeRequest(getPaginatedFranchiseDocumentTypesSchema),
        controller.getPaginated
    );

    router.get(
        "/all",
        controller.getAll
    );

    router.get(
        "/dropdown",
        controller.getAll
    );

    router.get(
        "/:uid",
        validateFranchiseDocumentTypeRequest(getFranchiseDocumentTypeSchema),
        controller.getByUid
    );

    router.put(
        "/:uid",
        validateFranchiseDocumentTypeRequest(updateFranchiseDocumentTypeSchema),
        controller.update
    );

    router.delete(
        "/:uid",
        validateFranchiseDocumentTypeRequest(getFranchiseDocumentTypeSchema),
        controller.delete
    );

    router.put(
        "/:uid/restore",
        validateFranchiseDocumentTypeRequest(getFranchiseDocumentTypeSchema),
        controller.restore
    );

    return router;
}

export const franchiseDocumentTypeRoutes = createFranchiseDocumentTypeRouter();
