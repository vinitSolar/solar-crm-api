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

const router = Router();
const repository = new ProductSpecificationRepository(pool);
const service = new ProductSpecificationService(repository);
const controller = new ProductSpecificationController(service);

router.use(authenticate);

router.post("/list", validateProductSpecificationRequest(paginationSchema), controller.getPaginatedSpecifications);
router.get("/:uid", controller.getSpecificationByUid);
router.post("/", validateProductSpecificationRequest(createProductSpecificationSchema), controller.createSpecification);
router.put("/:uid", validateProductSpecificationRequest(updateProductSpecificationSchema), controller.updateSpecification);
router.delete("/:uid", controller.deleteSpecification);

// Category Mapping Routes
router.post("/category/:categoryUid/map", validateProductSpecificationRequest(mapSpecificationToCategorySchema), controller.mapSpecificationToCategory);
router.put("/category/:categoryUid/map/:specificationUid", validateProductSpecificationRequest(updateCategorySpecificationMappingSchema), controller.updateCategoryMapping);


export default router;
