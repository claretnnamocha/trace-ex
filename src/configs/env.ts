import { JobOptions } from "bull";
import { config } from "dotenv";
import Joi from "joi";

config();

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "staging")
    .default("development"),
  PORT: Joi.number().required(),
  JWT_SECRET: Joi.string().required(),
  DB_URL: Joi.string().required().description("Database connection URL"),
  SPENDER_PRIVATE_KEY: Joi.string().required(),

  // ====================================
  // Optional
  // ====================================
  TOTP_WINDOW: Joi.number(),
  REDIS_URL: Joi.string(),
  DB_SECURE: Joi.boolean().default(false),
  DEBUG: Joi.boolean().default(false),
  IS_TESTNET: Joi.boolean().default(true),
  CLEAR_DB: Joi.boolean().default(false),
  ENABLE_WEBHOOKS: Joi.boolean().default(true),
  ENABLE_WALLET_DRAIN: Joi.boolean().default(true),
  ENABLE_WALLET_SCAN: Joi.boolean().default(true),
  ENABLE_MAILING: Joi.boolean().default(true),
})
  .unknown()
  .required();

const { error, value } = schema.validate(process.env);

if (error) throw error;

export const env: string = value.NODE_ENV;
export const port: number = value.PORT;
export const dbURL: string = value.DB_URL;
export const redisURL: string = value.REDIS_URL;
export const jwtSecret: string = value.JWT_SECRET;
export const dbSecure: boolean = value.DB_SECURE;
export const clearDb: boolean = value.CLEAR_DB;
export const isTestnet: boolean = value.IS_TESTNET;
export const debug: boolean =
  ["development", "staging"].includes(env) || value.DEBUG;

export const expiryInMinutesGrace: number = 10;
export const cronOption: JobOptions = { repeat: { every: 10 * 1000 } };
export const drainCronOption: JobOptions = {
  repeat: { every: 60 * 1000 * 10 },
};
export const scanOption: JobOptions = { attempts: 10, backoff: 30 * 1000 };

export const totpWindow: number = value.TOTP_WINDOW;

export const mnemonic: string = value.MNEMONIC;
export const spenderPrivateKey: string = value.SPENDER_PRIVATE_KEY;

export const enableWebhooks: boolean = value.ENABLE_WEBHOOKS;
export const enableWalletDrain: boolean = value.ENABLE_WALLET_DRAIN;
export const enableWalletScan: boolean = value.ENABLE_WALLET_SCAN;
export const enableMailing: boolean = value.ENABLE_MAILING;
