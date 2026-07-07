import { Router } from "express";
import { authRoutes } from "../modules/auth/index.js";
import { roleRoutes } from "../modules/roles/index.js";
import { userRoutes } from "../modules/users/index.js";
import { franchiseRoutes } from "../modules/franchises/index.js";
import { menuRoutes } from "../modules/menus/index.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/roles", roleRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/franchises", franchiseRoutes);
apiRouter.use("/menus", menuRoutes);

export default apiRouter;
