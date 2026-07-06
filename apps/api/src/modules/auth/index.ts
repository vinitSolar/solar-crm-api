/**
 * Auth Module — Public API
 *
 * Re-exports the key pieces that other modules need to consume:
 * - Routes for mounting in the Express app
 * - Middleware for protecting other module routes
 * - Types for annotating authenticated requests
 */

// Routes
export { authRoutes } from "./routes/auth.routes.js";

// Middleware
export { authenticate, authorize } from "./middleware/auth.middleware.js";

// Interfaces
export type { IAuthenticatedRequest, IUser, IUserSafe } from "./interfaces/auth.interface.js";
export type { IJwtPayload, IJwtRefreshPayload } from "./interfaces/jwt-payload.interface.js";

// Classes (for DI or testing)
export { AuthController } from "./controllers/auth.controller.js";
export { AuthService } from "./services/auth.service.js";
export { AuthRepository } from "./repositories/auth.repository.js";

// Constants
export { AUTH_MESSAGES, USER_STATUS, TOKEN_TYPES } from "./constants/auth.constants.js";
