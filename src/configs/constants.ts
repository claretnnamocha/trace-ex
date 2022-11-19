import crypto from "crypto";
import { Config } from "../models";
import { ConfigSchema } from "../types/models";

export const HD_PATH = (index: number) => `m/49'/1'/0'/0/${index}'`;

export const SALT = ({ secretKey, walletIndex }) =>
  `0x${crypto
    .createHmac("sha512", secretKey)
    .update(walletIndex.toFixed())
    .digest("hex")}`;

export const WALLET_FACTORY_ADDRESS = async (
  network: string = "altlayer-devnet"
) => {
  const key =
    network === "altlayer-devnet"
      ? "ALTLAYER_WALLET_FACTORY_ADDRESS"
      : "METIS_WALLET_FACTORY_ADDRESS";

  const config: ConfigSchema = await Config.findOne({
    where: { key },
  });

  return config?.value;
};
