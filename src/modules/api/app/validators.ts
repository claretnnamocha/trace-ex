import Joi from "joi";

const JoiPhone = Joi.extend(require("joi-phone-number"));

export const createApp = {
  name: Joi.string().trim().lowercase().required(),
};

export const updateApp = {
  name: Joi.string().trim().lowercase().required(),
  displayName: Joi.string().trim().lowercase(),
  supportEmail: Joi.string().email().trim().lowercase(),
  instantSettlement: Joi.boolean().valid(true, false),
};

const validNetworks = ["zksync-goerli", "altlayer-devnet"];
const validAssets = ["alt", "kwt"];
const validBlockchains = ["ethereum"];

export const generateAddress = {
  symbol: Joi.string()
    .valid(...validAssets)
    .insensitive()
    .lowercase()
    .required(),
  network: Joi.string()
    .valid(...validNetworks)
    .insensitive()
    .lowercase()
    .required(),
  blockchain: Joi.string()
    .valid(...validBlockchains)
    .insensitive()
    .lowercase()
    .required(),
  contactEmail: Joi.string().email().lowercase().required(),
  addressValidity: Joi.number().integer().min(10),
  targetAmount: Joi.number().min(0.00001),
  contactName: Joi.string(),
  contactPhone: JoiPhone.string().phoneNumber({
    format: "e164",
    defaultCountry: "NG",
  }),
};

export const getWallet = {
  reference: Joi.string().lowercase().required(),
};

export const getAppWallets = {
  page: Joi.number().default(1),
  pageSize: Joi.number().default(10),
};

export const sendCrypto = {
  to: Joi.string().required(),
  amount: Joi.number().required(),
  token: Joi.string()
    .valid(...validAssets)
    .required(),
  network: Joi.string()
    .valid(...validNetworks)
    .required(),
  blockchain: Joi.string()
    .valid(...validBlockchains)
    .required(),
};
