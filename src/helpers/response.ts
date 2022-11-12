import { Response } from "express";

export const response = async (
  res: Response,
  data: any,
  code: number = 200,
  debug = false
) => {
  const newData = data;

  if (!debug) delete newData.error;

  res.status(code).send({
    ...newData,
    timestamp: `${new Date().toUTCString()}`,
  });
};
