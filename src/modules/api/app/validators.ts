import Joi from "joi";
import {
  VALID_ASSETS,
  VALID_BLOCKCHAINS,
  VALID_NETWORKS,
} from "../../../configs/constants";

const JoiPhone = Joi.extend(require("joi-phone-number"));

export const createApp = {
  name: Joi.string().trim().lowercase().required(),
};

export const updateApp = {
  name: Joi.string().trim().lowercase().required(),
  displayName: Joi.string().trim().lowercase(),
  supportEmail: Joi.string().email().trim().lowercase(),
  webhookUrl: Joi.string().uri().trim().lowercase(),
  instantSettlement: Joi.boolean().valid(true, false),
};

export const generateAddress = {
  symbol: Joi.string()
    .valid(...VALID_ASSETS)
    .insensitive()
    .lowercase()
    .required(),
  network: Joi.string()
    .valid(...VALID_NETWORKS)
    .insensitive()
    .lowercase()
    .required(),
  blockchain: Joi.string()
    .valid(...VALID_BLOCKCHAINS)
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
    .valid(...VALID_ASSETS)
    .required(),
  network: Joi.string()
    .valid(...VALID_NETWORKS)
    .required(),
  blockchain: Joi.string()
    .valid(...VALID_BLOCKCHAINS)
    .required(),
};

export const getAppBalance = {
  token: Joi.string()
    .valid(...VALID_ASSETS)
    .required(),
};
