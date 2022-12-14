import Joi from "joi";
import {
  VALID_ASSETS,
  VALID_BLOCKCHAINS,
  VALID_NETWORKS,
} from "../../../configs/constants";

export const getTokenBalance = {
  network: Joi.string()
    .valid(...VALID_NETWORKS)
    .required(),
  token: Joi.string()
    .valid(...VALID_ASSETS)
    .required(),
  address: Joi.string().trim().required(),
  blockchain: Joi.string()
    .valid(...VALID_BLOCKCHAINS)
    .insensitive()
    .lowercase()
    .required(),
};
