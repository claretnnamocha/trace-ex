import { Router } from "express";
import { controller } from "../../middlewares";
import * as service from "./service";

const routes = Router();

routes.get("/ping", controller(service.ping));

export default routes;
