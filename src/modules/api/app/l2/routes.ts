import { Router } from "express";
import { controller, validate } from "../../../../middlewares";
import * as auth from "./service";
import * as validator from "./validators";

const routes = Router();

routes.post(
  "/transfer",
  validate(validator.l2Transfer),
  controller(auth.transfer)
);

routes.post(
  "/deposit",
  validate(validator.l2Transfer),
  controller(auth.deposit)
);

routes.post(
  "/withdraw",
  validate(validator.l2Transfer),
  controller(auth.withdraw)
);

export default routes;
