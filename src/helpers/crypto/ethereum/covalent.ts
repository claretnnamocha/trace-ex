import fetch from "node-fetch";
import { NETWORKS, NormalizedTransaction, PROVIDER } from "./ethers";

interface Transaction {
  block_signed_at: string;
  block_height: number;
  tx_hash: string;
  tx_offset: number;
  successful: boolean;
  from_address: string;
  from_address_label: string;
  to_address: string;
  to_address_label: string;
  value: string;
  value_quote: number;
  gas_offered: number;
  gas_spent: number;
  gas_price: number;
  fees_paid: string;
  gas_quote: number;
  gas_quote_rate: number;
  log_events: {
    block_signed_at: string;
    block_height: number;
    tx_offset: number;
    log_offset: number;
    tx_hash: string;
    raw_log_topics: string[];
    sender_contract_decimals: number;
    sender_name: string;
    sender_contract_ticker_symbol: string;
    sender_address: string;
    sender_address_label: string;
    sender_logo_url: string;
    raw_log_data: string;
    decoded: {
      name: string;
      signature: string;
      params: {
        name: string;
        type: string;
        indexed: boolean;
        decoded: boolean;
        value: string;
      }[];
    };
  }[];
}

const BASE_URL = "https://api.covalenthq.com";

const request = async ({
  url,
  method = "get",
  body = undefined,
}: {
  url: string;
  method?: "get" | "post" | "put" | "patch" | "delete";
  body?: string;
}): Promise<any> => {
  const { COVALENT_API_KEY } = process.env;
  if (!COVALENT_API_KEY) throw new Error("Please provide COVALENT_API_KEY");
  const link = `${BASE_URL}/${url}`;

  const token = Buffer.from(`${COVALENT_API_KEY}:`).toString("base64");
  const authorization = `Basic ${token}`;

  const response = await fetch(link, {
    method,
    headers: { "content-type": "application/json", authorization },
    body,
  });

  return response.json();
};

export const getAllTransactions = async ({
  address,
  network = "goerli",
  page = 0,
  pageSize = 10000,
}: {
  address: string;
  network?: NETWORKS;
  page?: number;
  pageSize?: number;
}): Promise<Transaction[]> => {
  const provider = PROVIDER({ network });
  const { chainId } = await provider.getNetwork();
  const url =
    `v1/${chainId}/address/${address}/transactions_v2` +
    `/?page-number=${page}&page-size=${pageSize}`;
  const {
    data: { items: transactions },
  } = await request({ url });

  const count = transactions.length;

  if (!count) return transactions;

  return [
    ...transactions,
    ...(await getAllTransactions({
      address,
      network,
      page: page + 1,
      pageSize,
    })),
  ];
};

const getNativeTokenSymbol = (network: NETWORKS) => {
  switch (network) {
    case "goerli":
      return "ETH";
    default:
      throw new Error("Network not supported");
  }
};

export const normalizeTransaction = async (
  transaction: Transaction,
  address: string,
  network: NETWORKS = "goerli"
): Promise<NormalizedTransaction> => {
  let reciever = transaction.to_address.toLowerCase();
  let type = reciever === address.toLowerCase() ? "credit" : "debit";
  let token = parseInt(transaction.value, 10)
    ? getNativeTokenSymbol(network)
    : "";
  let amount = token ? transaction.value : "0";

  // ERC20
  if (!token) {
    const {
      log_events: [logEvent],
    } = transaction;

    token = logEvent.sender_contract_ticker_symbol;

    const {
      decoded: {
        params: [, { value: to }, { value }],
      },
    } = logEvent;

    amount = value;
    reciever = to.toLowerCase();
    type = reciever === address.toLowerCase() ? "credit" : "debit";
  }

  return {
    transaction: {
      ...transaction,
      hash: transaction?.tx_hash,
    },
    type,
    amount,
    token,
    confirmed: true,
  };
};
