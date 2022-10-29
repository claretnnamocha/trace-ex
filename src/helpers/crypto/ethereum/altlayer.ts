import fetch from "node-fetch";

type ALTLAYER_NETWORKS = "altlayer-devnet";

interface AltToken {
  cataloged: boolean;
  contractAddress: string;
  decimals: string;
  name: string;
  symbol: string;
  totalSupply: string;
  type: string;
}

interface AltTransaction {
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

const BASE_URL = ({ network }: { network: ALTLAYER_NETWORKS }): string => {
  switch (network) {
    case "altlayer-devnet":
      return "https://devnet-explorer.altlayer.io/api";
    default:
      throw new Error("Network not supported");
  }
};

export const getTransaction = async ({
  txHash,
  network = "altlayer-devnet",
}: {
  txHash: string;
  network?: ALTLAYER_NETWORKS;
}): Promise<AltTransaction> => {
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
  network?: ALTLAYER_NETWORKS;
}): Promise<AltToken> => {
  const link = `${BASE_URL({
    network,
  })}?module=token&action=getToken&contractaddress=${contractAddress}`;
  const response = await fetch(link);
  const { result } = await response.json();

  return result;
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
  network?: ALTLAYER_NETWORKS;
}): Promise<AltTransaction[]> => {
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
  ];
};

export const normalizeTransaction = async (
  transaction: AltTransaction,
  address: string,
  network: ALTLAYER_NETWORKS = "altlayer-devnet"
): Promise<{
  amount: string;
  type: string;
  token: string;
  transaction: any;
}> => {
  const type = transaction.to === address ? "credit" : "debit";
  const amount = transaction.value;
  const token =
    transaction.contractAddress === ""
      ? "ETH"
      : (
          await getToken({
            contractAddress: transaction.contractAddress,
            network,
          })
        ).symbol;
  const trx: any = { transaction, type, amount, token };

  return trx;
};
