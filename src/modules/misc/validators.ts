import Joi from "joi";
import { VALID_ASSETS } from "../../configs/constants";

export const networks = {
  token: Joi.string().valid(...VALID_ASSETS),
};
