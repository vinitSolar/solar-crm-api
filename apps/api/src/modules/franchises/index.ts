/**
 * Franchises Module — Public API
 *
 * Re-exports the key pieces that other modules need to consume:
 * - Routes for mounting in the Express app
 * - Interfaces for type annotations
 * - DTOs for response mapping
 * - Constants for shared status values
 */

// Routes
export { franchiseRoutes } from "./routes/franchise.routes.js";

// Interfaces
export type {
    ITenant,
    IFranchiseOwnerDetails,
    IFranchiseBusinessDetails,
    ICreateFranchiseRequest,
    IUpdateFranchiseRequest,
    ICreateFranchiseResponse,
    IFranchiseSafe,
    IFranchiseDetail,
    IFranchisePaginationQuery,
    IPaginatedFranchiseResponse,
} from "./interfaces/franchise.interface.js";

// DTOs
export { toCreateFranchiseDTO, toFranchiseSafe, toOwnerDetailsSafe, toBusinessDetailsSafe } from "./dto/franchise.dto.js";

// Constants
export {
    FRANCHISE_MESSAGES,
    TENANT_TYPE,
    ONBOARDING_STATUS,
    FRANCHISE_STATUS,
} from "./constants/franchise.constants.js";

// Classes (for DI or testing)
export { FranchiseController } from "./controllers/franchise.controller.js";
export { FranchiseService } from "./services/franchise.service.js";
export { FranchiseRepository } from "./repositories/franchise.repository.js";
