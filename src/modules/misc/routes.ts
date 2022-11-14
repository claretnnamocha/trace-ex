import { Router } from "express";
import { controller, validate } from "../../middlewares";
import * as appUtils from "../api/utils/service";
import * as validator from "../api/utils/validators";
import * as service from "./service";

const routes = Router();

routes.get("/ping", controller(service.ping));

routes.get("/tokens", controller(service.supportedTokens));

routes.get(
  "/address-balance",
  validate(validator.getTokenBalance),
  controller(appUtils.getBalance)
);

export default routes;
