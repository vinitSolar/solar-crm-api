import { Router } from "express";
import { authRoutes } from "../modules/auth/index.js";
import { roleRoutes } from "../modules/roles/index.js";
import { userRoutes } from "../modules/users/index.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/roles", roleRoutes);
apiRouter.use("/users", userRoutes);

export default apiRouter;
