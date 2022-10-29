import { Router } from "express";
import { controller, validate } from "../../../middlewares";
import * as service from "./service";
import * as validator from "./validators";

const routes = Router();

routes.get(
  "/l2-balance",
  validate(validator.getTokenBalance),
  controller(service.getL2Balance)
);

export default routes;
