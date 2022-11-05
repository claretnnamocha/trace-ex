import { isTestnet } from "../env";

const seedDefaultUser = async (models: any) =>
  models.User.create({
    email: "admin@keeway.link",
    firstName: "Claret",
    lastName: "Nnamocha",
    password: "Password123!",
    phone: "+2349000000000",
    location: "Owerri, Nigeria",
    role: "super-admin",
    verifiedEmail: true,
  });

const seedDefaultApp = async (user: any) => {
  const id = "b5d797c1-dc90-4230-8510-4df5026ccff9";
  const webhookUrl = "https://eoz0svlp6qduwmn.m.pipedream.net";
  const testWebhookUrl = webhookUrl;

  const { App } = await import("../../models");

  return App.create({
    id,
    user,
    supportEmail: "support@keeway.link",
    name: "keeway",
    displayName: "Keeway Inc.",
    webhookUrl,
    testWebhookUrl,
  });
};

const supportedTokens = {
  ethereum: {
    "altlayer-devnet": {
      alt: {
        name: "Alt Coin",
        coinGeckoId: "alt-coin",
        isNativeToken: true,
        isStableToken: false,
        contractAddress: undefined,
        decimals: 18,
        minimumDrainAmount: 1,
        isTestnet: true,
      },
      kwt: {
        name: "Keeway Token",
        coinGeckoId: "keeway-token",
        isNativeToken: false,
        isStableToken: false,
        contractAddress: "0xBd59BCB8B2648bAfC11D2a7915de9b9d173545A1",
        decimals: 18,
        minimumDrainAmount: 1,
        isTestnet: true,
      },
    },
  },
};
const WALLET_FACTORY_ADDRESS = "0xDEF44ABCC5C3d8B7858CE2B4E3560aEcd1816840";

const seedSupportedTokens = async () => {
  const blockchainKeys = Object.keys(supportedTokens);

  const { SupportedToken } = await import("../../models");

  for (let index1 = 0; index1 < blockchainKeys.length; index1 += 1) {
    const blockchain = blockchainKeys[index1];

    const networks = supportedTokens[blockchain];
    const networkKeys = Object.keys(networks);

    for (let index2 = 0; index2 < networkKeys.length; index2 += 1) {
      const network = networkKeys[index2];
      const coins = networks[network];
      const tokens = Object.keys(coins);
      for (let index3 = 0; index3 < tokens.length; index3 += 1) {
        const symbol = tokens[index3];
        const {
          decimals,
          contractAddress,
          coinGeckoId,
          isTestnet: testnet,
          isStableToken,
          name,
          minimumDrainAmount,
        } = coins[symbol];

        const isNativeToken = contractAddress === undefined;
        if (isTestnet === testnet) {
          await SupportedToken.create({
            symbol,
            decimals,
            blockchain,
            network,
            contractAddress,
            isNativeToken,
            coinGeckoId,
            isStableToken,
            name,
            verified: true,
            minimumDrainAmount,
          });
        }
      }
    }
  }
};

const seedConfig = async () => {
  const { Config } = await import("../../models");

  return Config.create({
    key: "WALLET_FACTORY_ADDRESS",
    value: WALLET_FACTORY_ADDRESS,
  });
};

export const seed = async (models: any) => {
  console.log("DB cleared\n");

  console.log("Seeding supported tokens");
  await seedSupportedTokens();
  console.log("Complete!\n");

  console.log("Seeding config");
  await seedConfig();
  console.log("Complete!\n");

  console.log("Seeding default user");
  const user = await seedDefaultUser(models);
  console.log("Complete!\n");

  console.log("Seeding default app");
  await seedDefaultApp(user);
  console.log("Complete!\n");

  // todo: plant other db seeds 😎
  console.log("Database Seeded");
};
