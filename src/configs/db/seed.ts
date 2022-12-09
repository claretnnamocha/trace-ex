import {
  AppSchema,
  SupportedTokenSchema,
  UserSchema,
} from "../../types/models";
import { isTestnet } from "../env";

const supportedTokens = {
  ethereum: {
    goerli: {
      tokens: {
        eth: {
          name: "Ether",
          coinGeckoId: "ethereum",
          isNativeToken: true,
          isStableToken: false,
          contractAddress: undefined,
          decimals: 18,
          minimumDrainAmount: 0.005,
          isTestnet: true,
        },
        kwt: {
          name: "Keeway Token",
          coinGeckoId: "keeway-token",
          isNativeToken: false,
          isStableToken: false,
          contractAddress: "0x37d40c08f9137280FE6cfa19182A7932A96f0fd0",
          decimals: 18,
          minimumDrainAmount: 1,
          isTestnet: true,
        },
      },
      parentNetwork: null,
      chainId: 5,
      rpc: "https://eth-goerli.public.blastapi.io",
      explorer: "https://goerli.etherscan.io",
      walletFactory: "0xBa81239FF1BA21A2Ff80203f932A856E27A78526",
    },
    "altlayer-devnet": {
      tokens: {
        alt: {
          name: "Alt Coin",
          coinGeckoId: "altlayer-token",
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
          contractAddress: "0xBa81239FF1BA21A2Ff80203f932A856E27A78526",
          decimals: 18,
          minimumDrainAmount: 1,
          isTestnet: true,
        },
      },
      parentNetwork: "goerli",
      chainId: 9990,
      rpc: "https://devnet-rpc.altlayer.io",
      explorer: "https://devnet-explorer.altlayer.io",
      walletFactory: "0x1108a7F63A40c763B48192a02c52D8c6CE77939A",
    },
    "metis-goerli": {
      tokens: {
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

        kwt: {
          name: "Keeway Token",
          coinGeckoId: "keeway-token",
          isNativeToken: false,
          isStableToken: false,
          contractAddress: "0xBa81239FF1BA21A2Ff80203f932A856E27A78526",
          decimals: 18,
          minimumDrainAmount: 1,
          isTestnet: true,
        },
      },
      parentNetwork: "goerli",
      chainId: 599,
      rpc: "https://goerli.gateway.metisdevops.link",
      explorer: "https://goerli.explorer.metisdevops.link",
      walletFactory: "0x1108a7F63A40c763B48192a02c52D8c6CE77939A",
    },
    "bsc-testnet": {
      tokens: {
        bnb: {
          name: "BNB",
          coinGeckoId: "binancecoin",
          isNativeToken: true,
          isStableToken: false,
          contractAddress: undefined,
          decimals: 18,
          minimumDrainAmount: 0.02,
          isTestnet: true,
        },
        kwt: {
          name: "Keeway Token",
          coinGeckoId: "keeway-token",
          isNativeToken: false,
          isStableToken: false,
          contractAddress: "0xBa81239FF1BA21A2Ff80203f932A856E27A78526",
          decimals: 18,
          minimumDrainAmount: 1,
          isTestnet: true,
        },
      },
      parentNetwork: null,
      chainId: 97,
      rpc: "https://data-seed-prebsc-1-s3.binance.org:8545",
      explorer: "https://testnet.bscscan.com",
      walletFactory: "0x1108a7F63A40c763B48192a02c52D8c6CE77939A",
    },
  },
};
let counter = 1;

const createDefaultUser = async () => {
  const { User } = await import("../../models");

  const user = await User.create({
    email: "admin@trace.exchange",
    firstName: "Claret",
    lastName: "Nnamocha",
    password: "Password123!",
    phone: "+2349000000000",
    location: "Owerri, Nigeria",
    role: "super-admin",
    verifiedEmail: true,
  });

  counter += 1;

  return user;
};

const createDefaultExchangeUser = async (app: AppSchema) => {
  const { SupportedToken, Wallet, ExchangeUser } = await import("../../models");

  let walletIndex: number = await Wallet.max("index");
  walletIndex = walletIndex === null ? 0 : walletIndex + 1;

  await ExchangeUser.create({
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
  const tokens: SupportedTokenSchema[] = await SupportedToken.findAll({
    where: { verified: true },
  });

  for (let index = 0; index < tokens.length; index += 1) {
    const {
      network: { name: network, blockchain },
      symbol,
    } = tokens[index];

    await generateWallet({
      appId: app.id,
      blockchain,
      contactEmail: "admin@trace.exchange",
      network,
      symbol,
      index: walletIndex,
    });
  }

  counter += 1;
};

const createDefaultApp = async (user: UserSchema) => {
  const id = "b5d797c1-dc90-4230-8510-4df5026ccff9";
  const webhookUrl = "https://eoz0svlp6qduwmn.m.pipedream.net";
  const testWebhookUrl = webhookUrl;

  const { App } = await import("../../models");

  const app = App.create({
    id,
    user,
    supportEmail: "support@keeway.link",
    name: "keeway",
    displayName: "Keeway Inc.",
    webhookUrl,
    testWebhookUrl,
  });

  counter += 1;

  return app;
};

const createSupportedNetworks = async () => {
  const blockchainKeys = Object.keys(supportedTokens);

  const { Network } = await import("../../models");

  for (let index1 = 0; index1 < blockchainKeys.length; index1 += 1) {
    const blockchain = blockchainKeys[index1];

    const networks = supportedTokens[blockchain];
    const networkKeys = Object.keys(networks);

    for (let index2 = 0; index2 < networkKeys.length; index2 += 1) {
      const network = networkKeys[index2];
      const coins = networks[network];
      const {
        parentNetwork: parentNetworkString,
        chainId,
        rpc,
        explorer,
        walletFactory,
      } = coins;
      let parentNetwork: any;

      if (parentNetworkString) {
        parentNetwork = await Network.findOne({
          where: { name: parentNetworkString },
        });
      }

      await Network.create({
        chainId,
        rpc,
        explorer,
        parentNetwork,
        name: network,
        blockchain,
        walletFactory,
      });
    }
  }

  counter += 1;
};

const createSupportedTokens = async () => {
  const { SupportedToken, Network } = await import("../../models");

  const blockchainKeys = Object.keys(supportedTokens);

  for (let index1 = 0; index1 < blockchainKeys.length; index1 += 1) {
    const blockchain = blockchainKeys[index1];

    const networks = supportedTokens[blockchain];
    const networkKeys = Object.keys(networks);

    for (let index2 = 0; index2 < networkKeys.length; index2 += 1) {
      const networkName = networkKeys[index2];
      const coins = networks[networkName];
      const { tokens } = coins;
      const symbols = Object.keys(tokens);

      const network = await Network.findOne({ where: { name: networkName } });

      for (let index3 = 0; index3 < symbols.length; index3 += 1) {
        const symbol = symbols[index3];
        const {
          decimals,
          contractAddress,
          coinGeckoId,
          isTestnet: testnet,
          isStableToken,
          name,
          minimumDrainAmount,
        } = tokens[symbol];

        const isNativeToken = contractAddress === undefined;
        if (isTestnet === testnet) {
          await SupportedToken.create({
            symbol,
            decimals,
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

  counter += 1;
};

const createConfig = async () => {
  const { Config } = await import("../../models");

  await Config.create({ key: "env", value: JSON.stringify(process.env) });

  counter += 1;
};

export const seed = async () => {
  const total = 6;

  console.log("DB cleared\n");

  console.log(`[${counter}/${total}]`, "Create supported networks");
  await createSupportedNetworks();
  console.log("✅ Complete!\n");

  console.log(`[${counter}/${total}]`, "Create supported tokens");
  await createSupportedTokens();
  console.log("✅ Complete!\n");

  console.log(`[${counter}/${total}]`, "Create config");
  await createConfig();
  console.log("✅ Complete!\n");

  console.log(`[${counter}/${total}]`, "Create default user");
  const user = await createDefaultUser();
  console.log("✅ Complete!\n");

  console.log(`[${counter}/${total}]`, "Create default app");
  const app = await createDefaultApp(user);
  console.log("✅ Complete!\n");

  console.log(`[${counter}/${total}]`, "Create exchange user");
  await createDefaultExchangeUser(app);
  console.log("✅ Complete!\n");

  console.log("Database Seeded 🌱");
};
