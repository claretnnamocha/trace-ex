import { BigNumber } from "bignumber.js";
import * as bitcoin from "bitcoinjs-lib";
import fetch from "node-fetch";
import { NormalizedTransaction } from "../ethereum/ethers";
import {
  addPSBTInputs,
  generateAccountWithMnemonic,
  generateAddressWithMnemonic,
  NETWORK,
  signPSBTInputsWithMnemonic,
} from "./bitcoinjs-lib";

const DECIMALS = 8;

interface Transaction {
  txid: string;
  version: number;
  locktime: number;
  vin: {
    txid: string;
    vout: number;
    prevout: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address: string;
      value: number;
    };
    scriptsig: string;
    scriptsig_asm: string;
    witness: string[];
    is_coinbase: boolean;
    sequence: number;
  }[];
  vout: {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address: string;
    value: number;
  }[];
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
}

interface UTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}

const BASE_URL = ({ testnet = false }: { testnet: boolean }): string => {
  return testnet
    ? "https://blockstream.info/testnet/api"
    : "https://blockstream.info/api";
};

const request = async ({
  testnet,
  url,
  method = "get",
  body = undefined,
  type = "json",
}: {
  testnet: boolean;
  url: string;
  method?: "put" | "get" | "post" | "delete" | "patch";
  body?: any;
  type?: "text" | "json";
}): Promise<any> => {
  const link = `${BASE_URL({ testnet })}/${url}`;
  if (body && typeof body !== "string") JSON.stringify(body);
  const response = await fetch(link, { method, body });
  return type === "json" ? response.json() : response.text();
};

const getAddressUTXO = async ({
  address,
  testnet = false,
}: {
  address: string;
  testnet?: boolean;
}): Promise<UTXO[]> => {
  const url = `address/${address}/utxo`;
  return request({ testnet, url });
};

const getFeeRates = async ({
  testnet = false,
}: {
  testnet: boolean;
}): Promise<any> => {
  return request({ testnet, url: "fee-estimates" });
};

const getRawTransaction = async ({
  txid,
  testnet = false,
  hex = true,
}: {
  txid: string;
  testnet?: boolean;
  hex?: boolean;
}): Promise<string> => {
  const type = hex ? "hex" : "raw";
  const url = `tx/${txid}/${type}`;
  return request({ testnet, url, type: "text" });
};

const calculateTransactionFee = async ({
  testnet,
  vSize,
}: {
  testnet: boolean;
  vSize: number;
}): Promise<number> => {
  const rates = await getFeeRates({ testnet });
  const feeRate = rates["1"];
  return Math.floor(new BigNumber(feeRate).multipliedBy(vSize).toNumber());
};

const getUTXOSatoshis = (utxos: UTXO[]): number => {
  let total = 0;
  for (let index = 0; index < utxos.length; index += 1) {
    const { value } = utxos[index];
    total = new BigNumber(total).plus(value).toNumber();
  }
  return total;
};

const sendTransaction = async ({
  hex,
  testnet,
}: {
  hex: string;
  testnet: boolean;
}): Promise<{ txid: string }> => {
  const txid = await request({
    testnet,
    url: "tx",
    type: "text",
    body: hex,
    method: "post",
  });

  const hexRegex = /^(0x|0X)?[a-fA-F0-9]+$/;
  const success = hexRegex.test(txid);

  if (!success) throw new Error(txid);

  return { txid };
};

export const getBalance = async ({
  testnet,
  address,
}: {
  testnet: boolean;
  address: string;
}): Promise<number> => {
  const data = await getAddressUTXO({ testnet, address });

  let satoshi = new BigNumber(0);

  for (let index = 0; index < data.length; index += 1) {
    const utxo = data[index];
    satoshi = satoshi.plus(new BigNumber(utxo.value));
  }

  return satoshi.toNumber();
};

export const getAllTransactions = async ({
  address,
  testnet = false,
  lastSeenTxid = "",
}: {
  address: string;
  testnet?: boolean;
  lastSeenTxid?: string;
}): Promise<Transaction[]> => {
  const url = `address/${address}/txs/chain/${lastSeenTxid}`;

  const transactions: Transaction[] = await request({ testnet, url });
  const count = transactions.length;

  if (!count) return transactions;

  return [
    ...transactions,
    ...(await getAllTransactions({
      address,
      testnet,
      lastSeenTxid: transactions[count - 1].txid,
    })),
  ];
};

export const getSingleTransaction = async ({
  txid,
  testnet = false,
}: {
  txid: string;
  testnet: boolean;
}): Promise<Transaction> => {
  return request({ testnet, url: `tx/${txid}` });
};

export const normalizeTransactionObject = ({
  transaction,
  address,
}: {
  transaction: Transaction;
  address: string;
}): NormalizedTransaction => {
  const type =
    transaction.vin[0].prevout.scriptpubkey_address.toLowerCase() !==
    address.toLowerCase()
      ? "credit"
      : "debit";
  let subtotal: BigNumber = new BigNumber(0);

  for (let index = 0; index < transaction.vout.length; index += 1) {
    const vout = transaction.vout[index];
    if (vout.scriptpubkey_address.toLowerCase() === address.toLowerCase()) {
      subtotal = subtotal.plus(vout.value);
    }
  }
  const amount = subtotal.toFixed();

  return {
    amount,
    type,
    transaction: { ...transaction, hash: transaction.txid },
    token: "btc",
    confirmed: transaction.status.confirmed,
  };
};

export const sendFromMultipleAccountsWithMnemonic = async ({
  fromPaths,
  mnemonic,
  amount,
  to,
  changeAddress,
  testnet = false,
  fee = null,
}: {
  fromPaths: string[];
  mnemonic: string;
  amount: number;
  to: string;
  changeAddress: string;
  testnet?: boolean;
  fee?: number;
}): Promise<{ txid: string }> => {
  const network = NETWORK({ testnet });

  const satoshiAmount = Math.floor(
    new BigNumber(amount).times(10 ** DECIMALS).toNumber()
  );

  const allUtxos = [];

  for (let index1 = 0; index1 < fromPaths.length; index1 += 1) {
    const path = fromPaths[index1];

    const { address } = generateAddressWithMnemonic({
      mnemonic,
      network,
      path,
    });

    const { index } = generateAccountWithMnemonic({
      mnemonic,
      network,
      path,
    });

    const utxos: any[] = await getAddressUTXO({ testnet, address });

    for (let index2 = 0; index2 < utxos.length; index2 += 1) {
      const utxo = utxos[index2];
      const { txid } = utxo;
      const raw: string = await getRawTransaction({ txid, testnet });
      const nonWitnessUtxo = Buffer.from(raw, "hex");
      utxos[index2] = {
        ...utxo,
        index,
        path,
        address,
        nonWitnessUtxo,
      };
    }

    allUtxos.push(...utxos);
  }

  const total = getUTXOSatoshis(allUtxos);

  if (new BigNumber(total).lte(satoshiAmount))
    throw new Error("Insufficient btc");

  let psbt = new bitcoin.Psbt({ network });
  psbt = addPSBTInputs({ psbt, utxos: allUtxos });

  let balance: number = new BigNumber(total).minus(satoshiAmount).toNumber();

  if (new BigNumber(total).lte(satoshiAmount))
    throw new Error("Insufficient btc");

  if (fee) balance = new BigNumber(balance).minus(fee).toNumber();

  psbt.addOutput({ address: to, value: satoshiAmount });
  if (balance) psbt.addOutput({ address: changeAddress, value: balance });

  psbt = signPSBTInputsWithMnemonic({
    psbt,
    mnemonic,
    network,
    utxos: allUtxos,
  });
  psbt.finalizeAllInputs();

  const tx = psbt.extractTransaction();

  if (!fee) {
    const vSize = tx.virtualSize();
    const newFee = await calculateTransactionFee({ testnet, vSize });
    const newAmount = new BigNumber(satoshiAmount)
      .div(10 ** DECIMALS)
      .toNumber();

    return sendFromMultipleAccountsWithMnemonic({
      amount: newAmount,
      fromPaths,
      mnemonic,
      to,
      changeAddress,
      fee: newFee,
      testnet,
    });
  }

  const hex = tx.toHex();

  return sendTransaction({ hex, testnet });
};
