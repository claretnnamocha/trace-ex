import { Response } from "express";
import * as telegram from "./telegram";

export const response = async (
  res: Response,
  data: any,
  code: number = 200,
  debug = false
) => {
  const newData = data;
  const { error } = newData;

  if (!debug) delete newData.error;

  res.status(code).send({
    ...newData,
    timestamp: `${new Date().toUTCString()}`,
  });

  if (error) telegram.notify({ error });
};
