import Joi from "joi";

const validAssets = ["alt", "kwt", "metis"];

export const networks = {
  token: Joi.string().valid(...validAssets),
};
