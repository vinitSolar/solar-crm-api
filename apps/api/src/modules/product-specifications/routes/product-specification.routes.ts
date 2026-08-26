import { Router } from "express";
import { ProductSpecificationController } from "../controllers/product-specification.controller.js";
import { ProductSpecificationService } from "../services/product-specification.service.js";
import { ProductSpecificationRepository } from "../repositories/product-specification.repository.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";

import { 
    validateProductSpecificationRequest, 
    createProductSpecificationSchema, 
    updateProductSpecificationSchema, 
    paginationSchema,
    mapSpecificationToCategorySchema,
    updateCategorySpecificationMappingSchema
} from "../validators/product-specification.validator.js";
import pool from "@packages/connection.js";
import { requirePermission } from "../../../middlewares/permission.middleware.js";

const router = Router();
const repository = new ProductSpecificationRepository(pool);
const service = new ProductSpecificationService(repository);
const controller = new ProductSpecificationController(service);

router.use(authenticate);

router.post("/list", requirePermission("PRODUCT_SPECIFICATIONS", "can_view"), validateProductSpecificationRequest(paginationSchema), controller.getPaginatedSpecifications);
router.get("/:uid", requirePermission("PRODUCT_SPECIFICATIONS", "can_view"), controller.getSpecificationByUid);
router.post("/", requirePermission("PRODUCT_SPECIFICATIONS", "can_create"), validateProductSpecificationRequest(createProductSpecificationSchema), controller.createSpecification);
router.put("/:uid", requirePermission("PRODUCT_SPECIFICATIONS", "can_edit"), validateProductSpecificationRequest(updateProductSpecificationSchema), controller.updateSpecification);
router.delete("/:uid", requirePermission("PRODUCT_SPECIFICATIONS", "can_delete"), controller.deleteSpecification);

// Category Mapping Routes
router.post("/category/:categoryUid/map", requirePermission("PRODUCT_SPECIFICATIONS", "can_edit"), validateProductSpecificationRequest(mapSpecificationToCategorySchema), controller.mapSpecificationToCategory);
router.put("/category/:categoryUid/map/:specificationUid", requirePermission("PRODUCT_SPECIFICATIONS", "can_edit"), validateProductSpecificationRequest(updateCategorySpecificationMappingSchema), controller.updateCategoryMapping);


export default router;
