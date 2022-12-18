import { NextFunction, Response } from "express";
import { debug } from "../configs/env";
import { response } from "../helpers";
import { App } from "../models";
import { CustomRequest } from "../types/controllers";

export const authenticateKey = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // @ts-ignore
    const secretKey: string = req.headers["x-api-key"];

    if (!secretKey) {
      return response(
        res,
        { status: false, message: "Incorrect or Malformed API Key!" },
        401
      );
    }

    const app = await App.findOne({
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
