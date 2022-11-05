import BigNumber from "bignumber.js";
import { ethers, providers, Wallet } from "ethers";
import fetch from "node-fetch";
import * as zksync from "zksync-web3";
import {
  DECIMALS as ETH_DECIMALS,
  getContract,
  IERC20_ABI,
  NETWORKS,
  NormalizedTransaction,
  PROVIDER as ETH_PROVIDER,
} from "../ethers";

interface ZKToken {
  id: number;
  address: string;
  symbol: string;
  decimals: number;
  enabledForFees: boolean;
}

interface ZKTransaction {
  txHash: string;
  blockIndex: number;
  blockNumber: number;
  op: {
    type: string;
    from: string;
    tokenId: number;
    amount: string;
    to: string;
    accountId: number;
    ethHash: string;
    id: number;
    txHash: string;
  };
  status: string;
  failReason: string;
  createdAt: string;
  batchId: string;
}

const BASE_URL = ({ network }: { network: NETWORKS }): string => {
  switch (network) {
    case "zksync-mainnet":
      return "https://api.zksync.io/api/v0.2";
    case "zksync-goerli":
      return "https://goerli-api.zksync.io/api/v0.2";
    default:
      throw new Error("Network not supported");
  }
};

const PROVIDER = async (): Promise<zksync.Provider> => {
  return new zksync.Provider("https://zksync2-testnet.zksync.dev");
};

export const getWallet = async ({
  ethWallet,
}: {
  ethWallet: Wallet;
  network?: NETWORKS;
}): Promise<zksync.Wallet> => {
  const provider = await PROVIDER();
  return new zksync.Wallet(ethWallet.privateKey, provider, ethWallet.provider);
};

// Transfer from L1 to L2
export const deposit = async ({
  reciever,
  amount,
  privateKey,
  token = "0x0000000000000000000000000000000000000000",
  network = "zksync-mainnet",
  decimals = ETH_DECIMALS,
}: {
  reciever: string;
  amount: number;
  token?: string;
  decimals?: number;
  privateKey: string;
  network?: NETWORKS;
}) => {
  const value = new BigNumber(amount).multipliedBy(10 ** decimals).toFixed();

  const zkSyncWallet = await getWallet({
    ethWallet: new Wallet(privateKey, ETH_PROVIDER({ network })),
  });

  const operation = await zkSyncWallet.deposit({
    token,
    amount: value,
    to: reciever,
  });

  return operation.wait();
};

// Transfer from L2 to L1
export const withdraw = async ({
  reciever,
  amount,
  privateKey,
  token = "ETH",
  network = "zksync-mainnet",
  decimals = ETH_DECIMALS,
}: {
  reciever: string;
  amount: number;
  token?: string;
  decimals?: number;
  privateKey: string;
  network?: NETWORKS;
}) => {
  const value = new BigNumber(amount).multipliedBy(10 ** decimals).toFixed();

  const zkSyncWallet = await getWallet({
    ethWallet: new Wallet(privateKey, ETH_PROVIDER({ network })),
  });

  const operation = await zkSyncWallet.withdraw({
    token,
    amount: value,
    to: reciever,
  });

  return operation.wait();
};

export const getBalance = async ({
  address,
  token = undefined,
}: // network = "zksync-mainnet",
{
  address: string;
  token?: string;
  // network?: NETWORKS;
}): Promise<number> => {
  const rpc = "https://zksync2-testnet.zksync.dev";
  const provider = new providers.JsonRpcProvider(rpc);

  let balance: ethers.BigNumber;

  if (!token) {
    balance = await provider.getBalance(address);
  } else {
    const erc20 = getContract({
      contractAddress: token,
      abi: IERC20_ABI,
      signer: provider,
    });

    balance = await erc20.balanceOf(address);
  }

  return balance.toNumber();
};

// Transfer on L1
export const transfer = async ({
  reciever,
  amount,
  privateKey,
  token = "ETH",
  network = "zksync-mainnet",
  decimals = ETH_DECIMALS,
}: {
  reciever: string;
  amount: number;
  token?: string;
  decimals?: number;
  privateKey: string;
  network?: NETWORKS;
}) => {
  const zkSyncWallet = await getWallet({
    ethWallet: new Wallet(privateKey, ETH_PROVIDER({ network })),
  });

  const value = new BigNumber(amount).multipliedBy(10 ** decimals).toFixed();

  return zkSyncWallet.transfer({
    amount: value,
    to: reciever,
    token,
  });
};

export const listTokens = async ({
  network = "zksync-mainnet",
  from = "latest",
}: {
  network?: NETWORKS;
  from?: number | "latest";
}): Promise<ZKToken[]> => {
  const link = `${BASE_URL({
    network,
  })}/tokens?from=${from}&limit=100&direction=older`;
  const response = await fetch(link);
  const {
    result: { list },
  } = await response.json();

  const count = list.length;
  if (!count || list[count - 1].id === from) return list;

  return [
    ...list,
    ...(await listTokens({
      network,
      from: list[count - 1].id,
    })),
  ];
};

export const getToken = async ({
  network = "zksync-mainnet",
  id,
}: {
  network?: NETWORKS;
  id?: number;
}): Promise<ZKToken> => {
  const link = `${BASE_URL({
    network,
  })}/tokens/${id}`;
  const response = await fetch(link);
  const { result } = await response.json();
  return result;
};

export const getTransaction = async ({
  txHash,
  network = "zksync-mainnet",
}: {
  txHash: string;
  network?: NETWORKS;
}): Promise<ZKTransaction> => {
  const link = `${BASE_URL({ network })}/transactions/${txHash}/data`;
  const response = await fetch(link);
  const {
    result: { tx },
  } = await response.json();

  return tx;
};

export const getAllTransactions = async ({
  address,
  network = "zksync-mainnet",
  from = "latest",
  limit = 100,
}: {
  address: string;
  network?: NETWORKS;
  from?: string;
  limit?: number;
}): Promise<ZKTransaction[]> => {
  const url = `${BASE_URL({
    network,
  })}/accounts/${address}/transactions?from=${from}&limit=100&direction=older`;
  const response = await fetch(url);
  const {
    result: { list: transactions = null },
  } = await response.json();

  const count = transactions.length;

  if (!count || transactions[count - 1].txHash === from) return transactions;

  return [
    ...transactions,
    ...(await getAllTransactions({
      address,
      from: transactions[count - 1].txHash,
      limit,
      network,
    })),
  ];
};

export const normalizeTransaction = async (
  transaction: ZKTransaction,
  address: string,
  network: NETWORKS = "zksync-mainnet"
): Promise<NormalizedTransaction> => {
  const type =
    transaction.op.to.toLowerCase() === address.toLowerCase()
      ? "credit"
      : "debit";
  const token =
    transaction.op.tokenId === 0
      ? "ETH"
      : (await getToken({ network, id: transaction.op.tokenId })).symbol;
  const { amount } = transaction.op;

  return { transaction, type, amount, token, confirmed: true };
};
