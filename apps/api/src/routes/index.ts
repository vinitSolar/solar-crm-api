import { Router } from "express";
import { authRoutes } from "../modules/auth/index.js";
import { roleRoutes } from "../modules/roles/index.js";
import { userRoutes } from "../modules/users/index.js";
import { franchiseRoutes } from "../modules/franchises/index.js";
import { menuRoutes } from "../modules/menus/index.js";
import { leadRoutes, leadSourceRoutes, leadStatusRoutes } from "../modules/leads/index.js";
import { siteSurveyRoutes } from "../modules/site-surveys/index.js";
import { surveyDocumentTypeRoutes } from "../modules/survey-documents/index.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/roles", roleRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/franchises", franchiseRoutes);
apiRouter.use("/menus", menuRoutes);
apiRouter.use("/leads", leadRoutes);
apiRouter.use("/lead-sources", leadSourceRoutes);
apiRouter.use("/lead-statuses", leadStatusRoutes);
apiRouter.use("/site-surveys", siteSurveyRoutes);
apiRouter.use("/survey-document-types", surveyDocumentTypeRoutes);

export default apiRouter;
