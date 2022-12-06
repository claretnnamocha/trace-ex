import fetch from "node-fetch";
import { NormalizedTransaction } from "./ethers";

type LAYER_NETWORKS = "altlayer-devnet" | "metis-goerli" | "trust-testnet";

interface Token {
  cataloged: boolean;
  contractAddress: string;
  decimals: string;
  name: string;
  symbol: string;
  totalSupply: string;
  type: string;
}

interface Transaction {
  blockHash: string;
  blockNumber: string;
  confirmations: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  from: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  hash: string;
  input: string;
  isError: string;
  nonce: string;
  timeStamp: string;
  to: string;
  transactionIndex: string;
  txreceipt_status: string;
  value: string;
}

interface TokenTransaction {
  blockHash: string;
  blockNumber: string;
  confirmations: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  from: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  hash: string;
  input: string;
  logIndex: string;
  nonce: string;
  timeStamp: string;
  to: string;
  tokenDecimal: string;
  tokenName: string;
  tokenSymbol: string;
  transactionIndex: string;
  value: string;
}

interface InternalTransaction {
  blockNumber: string;
  contractAddress: string;
  errCode: string;
  from: string;
  gas: string;
  gasUsed: string;
  index: string;
  input: string;
  isError: string;
  timeStamp: string;
  to: string;
  transactionHash: string;
  type: string;
  value: string;
}

const BASE_URL = ({ network }: { network: LAYER_NETWORKS }): string => {
  switch (network) {
    case "altlayer-devnet":
      return "https://devnet-explorer.altlayer.io/api";
    case "metis-goerli":
      return "https://goerli.explorer.metisdevops.link/api";
    case "trust-testnet":
      return "https://trustscan.one/api";
    default:
      throw new Error("Network not supported");
  }
};

export const getTransaction = async ({
  txHash,
  network = "altlayer-devnet",
}: {
  txHash: string;
  network?: LAYER_NETWORKS;
}): Promise<Transaction> => {
  const link = `${BASE_URL({
    network,
  })}?module=transaction&action=gettxinfo&txhash=${txHash}`;
  const response = await fetch(link);
  const { result: tx } = await response.json();

  return tx;
};

export const getToken = async ({
  contractAddress,
  network = "altlayer-devnet",
}: {
  contractAddress: string;
  network?: LAYER_NETWORKS;
}): Promise<Token> => {
  const link = `${BASE_URL({
    network,
  })}?module=token&action=getToken&contractaddress=${contractAddress}`;
  const response = await fetch(link);
  const { result } = await response.json();

  return result;
};

const getAllTokenTransactions = async ({
  address,
  page = 1,
  offset = 10000,
  network = "altlayer-devnet",
}: {
  address: string;
  page?: number;
  offset?: number;
  network?: LAYER_NETWORKS;
}): Promise<TokenTransaction[]> => {
  const url = `${BASE_URL({
    network,
  })}?module=account&action=tokentx&address=${address}&page=${page}&offset=${offset}`;
  const response = await fetch(url);
  const { result: transactions } = await response.json();

  const count = transactions.length;

  if (!count) return transactions;

  return [
    ...transactions,
    ...(await getAllTokenTransactions({
      address,
      page: page + 1,
      offset,
      network,
    })),
  ];
};

const getAllInternalTransactions = async ({
  address,
  page = 1,
  offset = 10000,
  network = "altlayer-devnet",
}: {
  address: string;
  page?: number;
  offset?: number;
  network?: LAYER_NETWORKS;
}): Promise<TokenTransaction[]> => {
  const url = `${BASE_URL({
    network,
  })}?module=account&action=txlistinternal&address=${address}&page=${page}&offset=${offset}`;
  const response = await fetch(url);
  const { result: transactions } = await response.json();

  const count = transactions.length;

  if (!count) return transactions;

  return [
    ...transactions,
    ...(await getAllInternalTransactions({
      address,
      page: page + 1,
      offset,
      network,
    })),
  ];
};

export const getAllTransactions = async ({
  address,
  page = 1,
  offset = 10000,
  network = "altlayer-devnet",
}: {
  address: string;
  page?: number;
  offset?: number;
  network?: LAYER_NETWORKS;
}): Promise<Transaction[] | TokenTransaction[] | InternalTransaction[]> => {
  const url = `${BASE_URL({
    network,
  })}?module=account&action=txlist&address=${address}&page=${page}&offset=${offset}`;
  const response = await fetch(url);
  const { result: transactions } = await response.json();

  const count = transactions.length;

  if (!count) return transactions;

  return [
    ...transactions,
    ...(await getAllTransactions({
      address,
      page: page + 1,
      offset,
      network,
    })),
    ...(await getAllTokenTransactions({ address, network })),
    ...(await getAllInternalTransactions({ address, network })),
  ];
};

const getNativeTokenSymbol = (network: LAYER_NETWORKS) => {
  return network === "altlayer-devnet" ? "ALT" : "METIS";
};

export const normalizeTransaction = async (
  transaction: Transaction | TokenTransaction | InternalTransaction | any,
  address: string,
  network: LAYER_NETWORKS = "altlayer-devnet"
): Promise<NormalizedTransaction> => {
  const type =
    transaction.to.toLowerCase() === address.toLowerCase() ? "credit" : "debit";
  const amount = transaction.value;
  const token =
    transaction.contractAddress === ""
      ? getNativeTokenSymbol(network)
      : (
          await getToken({
            contractAddress: transaction.contractAddress,
            network,
          })
        ).symbol;

  return {
    transaction: {
      ...transaction,
      hash: transaction?.hash || transaction?.transactionHash,
    },
    type,
    amount,
    token,
    confirmed: true,
  };
};
