import Joi from "joi";

const validL2Networks = ["altlayer-devnet"];
const validAssets = ["alt", "kwt"];
const validBlockchains = ["ethereum"];

export const getTokenBalance = {
  network: Joi.string()
    .valid(...validL2Networks)
    .required(),
  token: Joi.string()
    .valid(...validAssets)
    .required(),
  address: Joi.string().trim().required(),
  blockchain: Joi.string()
    .valid(...validBlockchains)
    .insensitive()
    .lowercase()
    .required(),
};
