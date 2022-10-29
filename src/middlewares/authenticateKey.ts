import { NextFunction, Response } from "express";
import { debug } from "../configs/env";
import { response } from "../helpers";
import { App } from "../models";
import { CustomRequest } from "../types/controllers";
import { AppSchema } from "../types/models";

export const authenticateKey = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return response(
        res,
        { status: false, message: "Incorrect or Malformed API Key!" },
        401
      );
    }
    const secretKey = authorization.replace("Bearer ", "");

    const app: AppSchema = await App.findOne({
      where: { isDeleted: false, secretKey },
    });

    if (!app) {
      return response(
        res,
        { status: false, message: "Incorrect or Malformed API Key" },
        401
      );
    }

    if (!app.active) {
      return response(
        res,
        { status: false, message: "This app has been suspended" },
        403
      );
    }

    req.form = req.form || {};
    req.form.appId = app.id;

    return next();
  } catch (error) {
    return response(
      res,
      {
        status: false,
        message: "Unauthorized",
        error,
      },
      401,
      debug
    );
  }
};
