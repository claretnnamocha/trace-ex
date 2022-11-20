import BigNumber from "bignumber.js";
import { Wallet } from "ethers";
import fetch from "node-fetch";
import * as zksync from "zksync";
import { DECIMALS as ETH_DECIMALS, PROVIDER as ETH_PROVIDER } from "../ethers";

interface ZKToken {
  id: number;
  address: string;
  symbol: string;
  decimals: number;
  kind: string;
  is_nft: boolean;
}

interface ZKTransaction {
  tx_type: string;
  from: string;
  to: string;
  token: number;
  amount: string;
  fee: string;
  block_number: number;
  nonce: number;
  created_at: string;
  fail_reason: null;
  tx: {
    to: string;
    fee: string;
    from: string;
    type: string;
    nonce: number;
    token: number;
    amount: string;
    accountId: number;
    signature: {
      pubKey: string;
      signature: string;
    };
    validFrom: number;
    validUntil: number;
  };
  batch_id: number;
}

export type NETWORKS = "zksync-mainnet" | "zksync-goerli";

const RPC_LINK = ({ network }: { network: NETWORKS }): string => {
  switch (network) {
    case "zksync-mainnet":
      return "https://api.zksync.io/jsrpc";
    case "zksync-goerli":
      return "https://goerli-api.zksync.io/jsrpc";
    default:
      throw new Error("Network not supported");
  }
};

const BASE_URL = ({ network }: { network: NETWORKS }): string => {
  switch (network) {
    case "zksync-mainnet":
      return "https://api.zksync.io/api/v0.1";
    case "zksync-goerli":
      return "https://goerli-api.zksync.io/api/v0.1";
    default:
      throw new Error("Network not supported");
  }
};

const PROVIDER = async ({
  network = "zksync-mainnet",
}: {
  network: NETWORKS;
}): Promise<zksync.Provider> => {
  const net = network === "zksync-mainnet" ? "mainnet" : "goerli";
  return zksync.getDefaultProvider(net);
};

export const getWallet = async ({
  ethWallet,
  network = "zksync-mainnet",
}: {
  ethWallet: Wallet;
  network?: NETWORKS;
}): Promise<zksync.Wallet> => {
  const provider = await PROVIDER({ network });
  return zksync.Wallet.fromEthSigner(ethWallet, provider);
};

export const getBalance = async ({
  address,
  token = "ETH",
  network = "zksync-mainnet",
}: {
  address: string;
  token?: string;
  network?: NETWORKS;
}): Promise<number> => {
  const rpc = RPC_LINK({ network });
  const response = await fetch(rpc, {
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "account_info",
      params: [address],
      id: 10,
    }),
    headers: { "content-type": "application/json" },
    method: "post",
  });
  const {
    result: {
      committed: { balances },
    },
  }: any = await response.json();
  const balance: BigNumber = new BigNumber(balances[token] || 0);
  return balance.toNumber();
};

// Transfer from L1 to L2
export const deposit = async ({
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
    ethWallet: new Wallet(privateKey, await ETH_PROVIDER({ network })),
    network,
  });

  const approved = await zkSyncWallet.isERC20DepositsApproved(token);
  if (!approved) await zkSyncWallet.approveERC20TokenDeposits(token);

  const operation = await zkSyncWallet.depositToSyncFromEthereum({
    depositTo: reciever,
    token,
    amount: value,
  });

  return operation.awaitReceipt();
};

// Transfer from L2 to L1
export const withdraw = async ({
  recievers,
  amounts,
  privateKey,
  token = "ETH",
  network = "zksync-mainnet",
  decimals = ETH_DECIMALS,
}: {
  recievers: string[];
  amounts: number[];
  token?: string;
  decimals?: number;
  privateKey: string;
  network?: NETWORKS;
}) => {
  const zkSyncWallet = await getWallet({
    ethWallet: new Wallet(privateKey, await ETH_PROVIDER({ network })),
    network,
  });

  const batchBuilder = zkSyncWallet.batchBuilder();

  if (recievers.length !== amounts.length)
    throw new Error("Length of reciever must be same as length of amounts");

  for (let index = 0; index < recievers.length; index += 1) {
    const reciever = recievers[index];
    const amount = amounts[index];
    const value = new BigNumber(amount).multipliedBy(10 ** decimals).toFixed();

    batchBuilder.addWithdraw({ amount: value, token, ethAddress: reciever });
  }

  return batchBuilder.build();
};

// Transfer on L1
export const transfer = async ({
  recievers,
  amounts,
  privateKey,
  token = "ETH",
  network = "zksync-mainnet",
  decimals = ETH_DECIMALS,
}: {
  recievers: string[];
  amounts: number[];
  token?: string;
  decimals?: number;
  privateKey: string;
  network?: NETWORKS;
}) => {
  const zkSyncWallet = await getWallet({
    ethWallet: new Wallet(privateKey, await ETH_PROVIDER({ network })),
    network,
  });

  const batchBuilder = zkSyncWallet.batchBuilder();

  if (recievers.length !== amounts.length)
    throw new Error("Length of reciever must be same as length of amounts");

  for (let index = 0; index < recievers.length; index += 1) {
    const reciever = recievers[index];
    const amount = amounts[index];
    const value = new BigNumber(amount).multipliedBy(10 ** decimals).toFixed();

    batchBuilder.addTransfer({ amount: value, token, to: reciever });
  }

  return batchBuilder.build();
};

export const listTokens = async ({
  network = "zksync-mainnet",
}: {
  network?: NETWORKS;
}): Promise<ZKToken[]> => {
  const link = `${BASE_URL({ network })}/tokens`;
  const response = await fetch(link);
  return response.json();
};

export const getTransaction = async ({
  txHash,
  network = "zksync-mainnet",
}: {
  txHash: string;
  network?: NETWORKS;
}): Promise<ZKTransaction> => {
  const link = `${BASE_URL({ network })}/transactions_all/${txHash}`;
  const response = await fetch(link);
  return response.json();
};

export const getAllTransactions = async ({
  address,
  network = "zksync-mainnet",
  offset = 0,
  limit = 100,
}: {
  address: string;
  network?: NETWORKS;
  offset?: number;
  limit?: number;
}): Promise<ZKTransaction[]> => {
  const url = `${BASE_URL({
    network,
  })}/account/${address}/history/${offset}/${limit}`;
  const response = await fetch(url);
  const transactions = await response.json();
  const count = transactions.length;

  if (!count) return transactions;

  return [
    ...transactions,
    ...(await getAllTransactions({
      address,
      offset: limit,
      limit,
    })),
  ];
};
