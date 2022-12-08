import Joi from "joi";
import { VALID_ASSETS, VALID_NETWORKS } from "../../../../configs/constants";

export const l2Transfer = {
  to: Joi.string().required(),
  amount: Joi.number().required(),
  token: Joi.string()
    .valid(...VALID_ASSETS)
    .required(),
  network: Joi.string()
    .valid(...VALID_NETWORKS)
    .required(),
};
