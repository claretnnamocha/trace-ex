import { Router } from "express";
import { controller, validate } from "../../../middlewares";
import * as service from "./service";
import * as validator from "./validators";
import l2 from "./l2/routes";

const routes = Router();

routes.use("/l2", l2);

routes.get(
  "/generate-wallet",
  validate(validator.generateAddress),
  controller(service.generateWallet)
);

routes.get("/default-wallets", controller(service.getAppDefaultWallets));

routes.get(
  "/wallets",
  validate(validator.getAppWallets),
  controller(service.getAppWallets)
);

routes.get(
  "/wallet",
  validate(validator.getWallet),
  controller(service.getWallet)
);

routes.post(
  "/send-crypto",
  validate(validator.sendCrypto),
  controller(service.sendCrypto)
);

export default routes;
