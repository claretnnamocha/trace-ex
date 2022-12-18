import { NextFunction, Response } from "express";
import JWT from "jsonwebtoken";
import { env } from "../configs";
import { debug } from "../configs/env";
import { response } from "../helpers";
import { ExchangeUser } from "../models";
import { CustomRequest } from "../types/controllers";

export const authenticate2 = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { authorization } = req.headers;

    if (!authorization)
      return response(res, { status: false, message: "Unauthorized" }, 401);

    const { payload: userId, loginValidFrom }: any = JWT.verify(
      authorization.replace("Bearer ", ""),
      env.jwtSecret
    );

    if (!userId || !loginValidFrom)
      return response(res, { status: false, message: "Unauthorized" }, 401);

    const where: any = { id: userId, isDeleted: false, active: true };

    const user = await ExchangeUser.findOne({ where });

    if (!user || loginValidFrom < user.loginValidFrom)
      return response(res, { status: false, message: "Unauthorized" }, 401);

    req.form = req.form || {};
    req.form.userId = user.id;

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
