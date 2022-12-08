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
  let key: string;
  switch (network) {
    case "altlayer-devnet":
      key = "ALTLAYER_WALLET_FACTORY_ADDRESS";
      break;
    case "goerli":
      key = "GOERLI_WALLET_FACTORY_ADDRESS";
      break;
    default:
      key = "METIS_WALLET_FACTORY_ADDRESS";
      break;
  }

  const config: ConfigSchema = await Config.findOne({
    where: { key },
  });

  return config?.value;
};

export const VALID_NETWORKS = [
  "zksync-goerli",
  "altlayer-devnet",
  "metis-goerli",
];
export const VALID_ASSETS = ["alt", "kwt", "metis", "eth"];
export const VALID_BLOCKCHAINS = ["ethereum"];
