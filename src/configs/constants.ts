import crypto from "crypto";
import { Config } from "../models";
import { ConfigSchema } from "../types/models";

export const HD_PATH = (index: number) => `m/49'/1'/0'/0/${index}'`;

export const SALT = ({ secretKey, walletIndex }) =>
  `0x${crypto
    .createHmac("sha512", secretKey)
    .update(walletIndex.toFixed())
    .digest("hex")}`;

export const WALLET_FACTORY_ADDRESS = async () => {
  const config: ConfigSchema = await Config.findOne({
    where: { key: "WALLET_FACTORY_ADDRESS" },
  });

  return config.value;
};
