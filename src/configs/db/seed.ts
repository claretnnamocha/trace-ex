import { isTestnet } from "../env";

const seedDefaultUser = async (models: any) =>
  models.User.create({
    email: "admin@trace.exchange",
    firstName: "Claret",
    lastName: "Nnamocha",
    password: "Password123!",
    phone: "+2349000000000",
    location: "Owerri, Nigeria",
    role: "super-admin",
    verifiedEmail: true,
  });

const seedExchangeUser = async (models: any, app: any) => {
  let walletIndex: number = await models.Wallet.max("index");
  walletIndex = walletIndex === null ? 0 : walletIndex + 1;

  models.ExchangeUser.create({
    email: "admin@trace.exchange",
    firstName: "Claret",
    lastName: "Nnamocha",
    password: "Password123!",
    phone: "+2349000000000",
    app,
    verifiedEmail: true,
    index: walletIndex,
  });
  const { generateWallet } = await import("../../modules/api/app/service");
  const tokens = await models.SupportedToken.findAll({
    where: { verified: true },
  });
  for (let index = 0; index < tokens.length; index += 1) {
    const { blockchain, network, symbol } = tokens[index];
    await generateWallet({
      appId: app.id,
      blockchain,
      contactEmail: "admin@trace.exchange",
      network,
      symbol,
      index: walletIndex,
    });
  }
};

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
        contractAddress: "0x3b08a8313CED4b9B8AD95F02e34Fd4676d22063b",
        decimals: 18,
        minimumDrainAmount: 1,
        isTestnet: true,
      },
    },
    "metis-goerli": {
      metis: {
        name: "Metis",
        coinGeckoId: "metis-token",
        isNativeToken: true,
        isStableToken: false,
        contractAddress: undefined,
        decimals: 18,
        minimumDrainAmount: 1,
        isTestnet: true,
      },
    },
  },
};
const ALTLAYER_WALLET_FACTORY_ADDRESS =
  "0x48d044e8926Ff95d88baCf3c01cCF6cF06817Cf2";
const METIS_WALLET_FACTORY_ADDRESS =
  "0x5a3efCD8691c7a15BB8C373Cd2C3c491183e4AbE";

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

const seedENV = async () => {
  const { Config } = await import("../../models");
  return Config.create({ key: "env", value: JSON.stringify(process.env) });
};

const seedConfig = async () => {
  const { Config } = await import("../../models");

  await Config.bulkCreate([
    {
      key: "ALTLAYER_WALLET_FACTORY_ADDRESS",
      value: ALTLAYER_WALLET_FACTORY_ADDRESS,
    },
    {
      key: "METIS_WALLET_FACTORY_ADDRESS",
      value: METIS_WALLET_FACTORY_ADDRESS,
    },
  ]);
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
  const app = await seedDefaultApp(user);
  console.log("Complete!\n");

  console.log("Seeding exchange user");
  await seedExchangeUser(models, app);
  console.log("Complete!\n");

  console.log("Seeding ENV");
  await seedENV();
  console.log("Complete!\n");

  // todo: plant other db seeds 😎
  console.log("Database Seeded");
};
