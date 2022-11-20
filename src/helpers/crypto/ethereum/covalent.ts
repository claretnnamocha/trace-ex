import { PROVIDER, NETWORKS } from "./ethers";

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
  const provider = await PROVIDER({ network });
  const { chainId } = await provider.getNetwork();
  const url =
    `v1/${chainId}/address/${address}/transactions_v2` +
    `/?no-logs=true&page-number${page}&page-size=${pageSize}`;
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
