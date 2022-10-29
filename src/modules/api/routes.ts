import { Router } from "express";
import { authenticateKey } from "../../middlewares";
import app from "./app/routes";
import utils from "./utils/routes";

const routes = Router();

routes.use("/utils", utils);

routes.use(authenticateKey);

routes.use("/app", app);

export default routes;
