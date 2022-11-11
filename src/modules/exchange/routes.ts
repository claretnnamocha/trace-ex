import { Router } from "express";
import {
  authenticate2 as authenticate,
  authenticateKey,
  controller,
  validate,
} from "../../middlewares";
import * as service from "./service";
import * as validator from "./validators";

const routes = Router();

routes.use(authenticateKey);

routes.post(
  "/auth/sign-up",
  validate(validator.signUp),
  controller(service.signUp)
);

routes.post(
  "/auth/sign-in",
  validate(validator.signIn),
  controller(service.signIn)
);

routes.get(
  "/auth/verify",
  validate(validator.verify),
  controller(service.verifyAccount)
);

routes.post(
  "/auth/initiate-reset",
  validate(validator.initiateReset),
  controller(service.initiateReset)
);

routes.get(
  "/auth/verify-reset",
  validate(validator.verifyReset),
  controller(service.verifyReset)
);

routes.put(
  "/auth/reset-password",
  validate(validator.updateReset),
  controller(service.resetPassword)
);

routes.use(authenticate);

routes.get("/user", controller(service.getProfile));

routes.get("/user/totp-qrcode", controller(service.getTotpQrCode));

routes.put(
  "/user/regenerate-totp-secret",
  controller(service.regenerateTotpSecret)
);

routes.get(
  "/user/validate-totp",
  validate(validator.verifyPhone),
  controller(service.validateTotp)
);

routes.get(
  "/user/verify-phone",
  validate(validator.verifyPhone),
  controller(service.verifyPhone)
);

routes.put(
  "/user/update-password",
  validate(validator.updatePassword),
  controller(service.updatePassword)
);

routes.put(
  "/user/update-profile",
  validate(validator.updateProfile),
  controller(service.updateProfile)
);

routes.get(
  "/user/all-users",
  validate(validator.getAllUsers),
  controller(service.getAllUsers)
);

routes.post("/log-other-devices-out", controller(service.logOtherDevicesOut));

routes.post("/sign-out", controller(service.signOut));

//

routes.get("/wallets", controller(service.getWallets));

routes.get(
  "/wallet",
  validate(validator.getWallet),
  controller(service.getWallet)
);

routes.get(
  "/transactions",
  validate(validator.transactions),
  controller(service.getTransactions)
);

routes.post(
  "/send-crypto",
  validate(validator.sendL2),
  controller(service.sendCrypto)
);

export default routes;
