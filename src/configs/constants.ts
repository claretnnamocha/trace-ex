import crypto from "crypto";

export const HD_PATH = (index: number) => `m/49'/1'/90'/87/${index}'`;

export const SALT = ({ secretKey, walletIndex }) =>
  `0x${crypto
    .createHmac("sha512", secretKey)
    .update(walletIndex.toFixed())
    .digest("hex")}`;

export const VALID_NETWORKS = [
  "zksync-goerli",
  "altlayer-devnet",
  "metis-goerli",
  "goerli",
  "bitcoin-testnet",
];
export const VALID_ASSETS = ["alt", "kwt", "metis", "eth", "btc"];
export const VALID_BLOCKCHAINS = ["ethereum", "bitcoin"];
