import Joi from "joi";

const validNetworks = ["zksync-goerli", "altlayer-devnet"];
const validAssets = ["eth", "usdc"];

export const l2Transfer = {
  to: Joi.string().required(),
  amount: Joi.number().required(),
  token: Joi.string()
    .valid(...validAssets)
    .required(),
  network: Joi.string()
    .valid(...validNetworks)
    .required(),
};
