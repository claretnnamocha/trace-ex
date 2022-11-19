import { Router } from "express";
import { controller, validate } from "../../middlewares";
import * as appUtils from "../api/utils/service";
import * as apiValidator from "../api/utils/validators";
import * as validator from "./validators";
import * as service from "./service";

const routes = Router();

routes.get("/ping", controller(service.ping));

routes.get("/tokens", controller(service.supportedTokens));

routes.get(
  "/networks",
  validate(validator.networks),
  controller(service.supportedNetworks)
);

routes.get(
  "/address-balance",
  validate(apiValidator.getTokenBalance),
  controller(appUtils.getBalance)
);

export default routes;
