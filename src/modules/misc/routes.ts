import { Router } from "express";
import { controller } from "../../middlewares";
import * as service from "./service";

const routes = Router();

routes.get("/ping", controller(service.ping));

routes.get("/tokens", controller(service.supportedTokens));

export default routes;
