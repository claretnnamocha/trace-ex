import { Response, Router } from "express";
import { response } from "./helpers";
import api from "./modules/api/routes";
import auth from "./modules/auth/routes";
import exchange from "./modules/exchange/routes";
import misc from "./modules/misc/routes";
import user from "./modules/user/routes";

const routes = Router();

routes.use("/api", api);

routes.use("/auth", auth);

routes.use("/misc", misc);

routes.use("/user", user);

routes.use("/exchange", exchange);

routes.use((_, res: Response) => {
  response(res, { status: false, message: "Route not found" }, 404);
});

export default routes;
