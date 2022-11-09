import Joi from "joi";
import passwordComplexity from "joi-password-complexity";

const JoiPhone = Joi.extend(require("joi-phone-number"));

const validAssets = ["alt", "kwt"];
const validNetworks = ["zksync-goerli", "altlayer-devnet"];

export const signIn = {
  user: Joi.string().required(),
  password: Joi.string().required(),
};

export const signUp = {
  firstName: Joi.string(),
  lastName: Joi.string(),
  phone: JoiPhone.string().phoneNumber({
    defaultCountry: "NG",
    format: "e164",
  }),
  email: Joi.string().email().lowercase().required(),
  password: passwordComplexity(),
};

export const verify = {
  token: Joi.string(),
  email: Joi.string().email().lowercase().required(),
  resend: Joi.boolean(),
};

export const initiateReset = {
  email: Joi.string().email().lowercase().required(),
};

export const verifyReset = {
  token: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
};

export const updateReset = {
  email: Joi.string().email().lowercase().required(),
  token: Joi.string().required(),
  password: Joi.string(),
};

export const updateProfile = {
  firstName: Joi.string(),
  lastName: Joi.string(),
  location: Joi.string(),
  avatar: Joi.string().uri(),
};

export const updatePassword = {
  password: Joi.string(),
  newPassword: passwordComplexity(),
  logOtherDevicesOut: Joi.boolean().default(false),
};

export const verifyPhone = {
  token: Joi.string(),
};

export const getAllUsers = {
  name: Joi.string(),
  email: Joi.string().email().lowercase(),
  verifiedEmail: Joi.boolean(),
  verifiedPhone: Joi.boolean(),
  active: Joi.boolean(),
  isDeleted: Joi.boolean(),
  dob: Joi.date(),
  phone: Joi.string(),
  permissions: Joi.array().items(Joi.string().required()).unique(),
  role: Joi.string().valid("admin", "user"),
  page: Joi.number().default(1),
  pageSize: Joi.number().default(10),
};

export const getWallet = {
  token: Joi.string()
    .valid(...validAssets)
    .required(),
  network: Joi.string()
    .valid(...validNetworks)
    .insensitive()
    .lowercase()
    .required(),
};

export const transactions = {
  token: Joi.string().valid(...validAssets),
  network: Joi.string()
    .valid(...validNetworks)
    .insensitive()
    .lowercase(),
};

export const sendL2 = {
  to: Joi.string().required(),
  amount: Joi.number().required(),
  token: Joi.string()
    .valid(...validAssets)
    .required(),
  network: Joi.string()
    .valid(...validNetworks)
    .required(),
};
