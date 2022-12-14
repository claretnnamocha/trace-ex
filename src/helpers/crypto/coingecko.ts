import fetch from "node-fetch";

const BASE_URL = "https://api.coingecko.com/api/v3";

const request = async ({
  url,
  method = "get",
  body = undefined,
}: {
  url: string;
  method?: "get" | "post" | "put" | "patch" | "delete";
  body?: string;
}): Promise<any> => {
  const link = `${BASE_URL}/${url}`;

  const response = await fetch(link, {
    method,
    headers: { "content-type": "application/json" },
    body,
  });

  return response.json();
};

export const currentPrices = async ({ tokens: ids, currencies = "usd" }) => {
  const query = new URLSearchParams({
    ids,
    vs_currencies: currencies,
  }).toString();

  const url = `simple/price?${query}`;
  const response = await request({ url });

  const prices = [];
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    prices.push(response?.[id]?.[currencies] || 0);
  }

  return prices;
};
