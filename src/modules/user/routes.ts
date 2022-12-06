import { Router } from "express";
import { authenticate, controller, validate } from "../../middlewares";
import * as user from "./service";
import * as app from "../api/app/service";
import * as validator from "./validators";
import * as appValidator from "../api/app/validators";

const routes = Router();

routes.use(authenticate({}));

routes.get("/", controller(user.getProfile));

routes.get("/totp-qrcode", controller(user.getTotpQrCode));

routes.put("/regenerate-totp-secret", controller(user.regenerateTotpSecret));

routes.get(
  "/validate-totp",
  validate(validator.verifyPhone),
  controller(user.validateTotp)
);

routes.get(
  "/verify-phone",
  validate(validator.verifyPhone),
  controller(user.verifyPhone)
);

routes.put(
  "/update-password",
  validate(validator.updatePassword),
  controller(user.updatePassword)
);

routes.put(
  "/update-profile",
  validate(validator.updateProfile),
  controller(user.updateProfile)
);

routes.get(
  "/all-users",
  validate(validator.getAllUsers),
  controller(user.getAllUsers)
);

routes.post("/log-other-devices-out", controller(user.logOtherDevicesOut));

routes.post("/sign-out", controller(user.signOut));

//
// Apps
//

routes.get("/apps", controller(app.getApps));

routes.get(
  "/get-app-keys",
  validate(appValidator.createApp),
  controller(app.getAppKeys)
);

routes.post(
  "/create-app",
  validate(appValidator.createApp),
  controller(app.createApp)
);

routes.put(
  "/update-app",
  validate(appValidator.updateApp),
  controller(app.updateApp)
);

routes.delete(
  "/delete-app",
  validate(appValidator.createApp),
  controller(app.deleteApp)
);

export default routes;
