import Joi from "joi";

const validL2Networks = [
  "altlayer-devnet",
  "metis-goerli",
  "zksync-goerli",
  "zksync-mainnet",
];
const validAssets = ["alt", "kwt"];

export const getTokenBalance = {
  network: Joi.string()
    .valid(...validL2Networks)
    .required(),
  token: Joi.string()
    .valid(...validAssets)
    .required(),
  address: Joi.string().trim().required(),
};
