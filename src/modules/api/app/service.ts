import { BigNumber } from "bignumber.js";
import { SALT, WALLET_FACTORY_ADDRESS } from "../../../configs/constants";
import { db } from "../../../configs/db";
import { spenderPrivateKey } from "../../../configs/env";
import { currentPrices } from "../../../helpers/crypto/coingecko";
import { ethers } from "../../../helpers/crypto/ethereum";
import { App, SupportedToken, User, Wallet } from "../../../models";
import { AppSchema, UserSchema, WalletSchema } from "../../../types/models";
import { SupportedTokenSchema } from "../../../types/models/SupportedToken";
import { api, others } from "../../../types/services";
import { updateWalletBalance } from "../utils/service";

/**
 * Creates a new Keeway app
 * @param {api.app.CreateApp} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const createApp = async (
  params: api.app.CreateApp
): Promise<others.Response> => {
  try {
    const { name, userId } = params;
    const user: UserSchema = await User.findByPk(userId);

    const exists = await App.findOne({
      where: { "user.email": user.email, name, isDeleted: false },
    });
    if (exists) return { status: false, message: "App already exists" };

    await App.create({ user, name });

    return {
      code: 201,
      payload: { status: true, message: "App created" },
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to create new app",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get all user apps
 * @param {api.app.CreateApp} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getApps = async (
  params: others.LoggedIn
): Promise<others.Response> => {
  try {
    const { userId } = params;

    const user: UserSchema = await User.findByPk(userId);
    const data = await App.findAll({
      where: { "user.email": user.email, isDeleted: false },
    });

    return { status: true, message: "User Apps", data };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to user apps",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get app keys
 * @param {api.app.CreateApp} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getAppKeys = async (
  params: api.app.CreateApp
): Promise<others.Response> => {
  try {
    const { userId, name } = params;

    const user: UserSchema = await User.findByPk(userId);

    const app: AppSchema = await App.findOne({
      where: { "user.email": user.email, name, isDeleted: false },
    });

    if (!app) {
      return {
        code: 404,
        payload: { status: false, message: "App does not exist" },
      };
    }

    const { apiKey, secretKey } = app;

    return {
      status: true,
      message: "App Keys",
      data: { apiKey, secretKey },
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get app keys",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Update user's app
 * @param {api.app.UpdateApp} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const updateApp = async (
  params: api.app.UpdateApp
): Promise<others.Response> => {
  try {
    const {
      userId,
      displayName,
      name,
      instantSettlement,
      supportEmail,
      webhookUrl,
    } = params;

    const user: UserSchema = await User.findByPk(userId);

    const app: AppSchema = await App.findOne({
      where: { "user.email": user.email, name, isDeleted: false },
    });

    if (!app) {
      return {
        code: 404,
        payload: { status: false, message: "App does not exist" },
      };
    }

    const payload: any = {};
    if (displayName !== undefined) payload.displayName = displayName;
    if (instantSettlement !== undefined)
      payload.instantSettlement = instantSettlement;
    if (supportEmail !== undefined) payload.supportEmail = supportEmail;

    if (webhookUrl !== undefined) payload.webhookUrl = supportEmail;

    await app.update(payload);

    return {
      status: true,
      message: "App Updated",
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to update app",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Delete user's app
 * @param {api.app.CreateApp} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const deleteApp = async (
  params: api.app.CreateApp
): Promise<others.Response> => {
  try {
    const { userId, name } = params;

    const user: UserSchema = await User.findByPk(userId);

    const app: AppSchema = await App.findOne({
      where: { "user.email": user.email, name },
    });

    if (!app) {
      return {
        code: 404,
        payload: { status: false, message: "App does not exist" },
      };
    }

    await app.update({ isDeleted: true });

    return {
      status: true,
      message: "App Deleted",
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to delete app",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Generates new wallet
 * @param {api.app.GenerateWalletAddress} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const generateWallet = async (
  params: api.app.GenerateWalletAddress
): Promise<others.Response> => {
  try {
    const {
      appId,
      contactEmail,
      blockchain,
      network,
      contactPhone,
      contactName,
      addressValidity,
      targetAmount,
      symbol,
    } = params;
    let { index } = params;

    const token: SupportedTokenSchema = await SupportedToken.findOne({
      where: { network, blockchain, symbol },
    });

    if (!token) return { status: false, message: "Token not found" };

    if (!index) {
      index = await Wallet.max("index", {
        where: {
          "token.blockchain": blockchain,
          "token.network": network,
          "token.symbol": symbol,
        },
      });
      index = index === null ? 0 : index + 1;
    }

    let address: string;

    if (blockchain === "ethereum") {
      switch (network) {
        case "altlayer-devnet":
        case "metis-goerli": {
          const contractAddress = await WALLET_FACTORY_ADDRESS(network);

          const walletFactory = ethers.getFactory({
            contractAddress,
            network,
          });

          const { secretKey }: AppSchema = await App.findByPk(appId);

          const salt = SALT({ walletIndex: index, secretKey });
          address = await ethers.getAddressWithFactory({ salt, walletFactory });

          break;
        }
        default:
          return {
            status: false,
            message: "This blockchain is not supported yet",
          };
      }
    }

    const app: AppSchema = await App.findByPk(appId);
    let expiresAt: number;

    if (addressValidity)
      expiresAt = new BigNumber(Date.now()).plus(addressValidity).toNumber();

    const contact = {
      email: contactEmail,
      phone: contactPhone,
      name: contactName,
    };

    const { id: reference }: WalletSchema = await Wallet.create({
      app,
      token,
      address,
      targetAmount,
      index,
      contact,
      expiresAt,
    });

    return {
      payload: {
        status: true,
        message: "Wallet address created",
        data: {
          reference,
          address,
          index,
          targetAmount,
          contact,
          token,
          expiresAt,
        },
      },
      code: 201,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to generate wallet address",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get wallet details
 * @param {api.app.GetWalletAddress} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getWallet = async (
  params: api.app.GetWalletAddress
): Promise<others.Response> => {
  try {
    const { appId, reference } = params;

    const query = `
    SELECT  *
       ,(CAST(wallet."balance" AS DECIMAL) / pow(10,CAST(token ->> 'decimals' AS INTEGER))) AS "balance"
    FROM wallet
    WHERE app ->> 'id' = :appId
    AND id = :reference
  `;

    const [[data]] = await db.query(query, {
      replacements: { reference, appId },
    });

    if (!data) {
      return {
        code: 404,
        payload: { status: false, message: "Wallet not found" },
      };
    }

    return {
      status: true,
      message: "Wallet details",
      data,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get wallet",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get App's default wallets
 * @param {api.app.APIAuthenticated} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getAppDefaultWallets = async (
  params: api.app.APIAuthenticated
): Promise<others.Response> => {
  try {
    const { appId } = params;

    const query = `
    SELECT  DISTINCT
    ON ("token" ->> 'name') *
    FROM "wallet"
    WHERE CAST("app" ->> 'id' AS TEXT) = :appId
    ORDER BY "token" ->> 'name', "index"
    `;

    const [data] = await db.query(query, { replacements: { appId } });
    // const data = [];

    // for (let index = 0; index < wallets.length; index += 1) {
    //   const { id: reference }: any = wallets[index];
    //   /* eslint-disable no-await-in-loop */
    //   const { data: wallet }: any = await getWallet({ reference, appId });

    //   data.push(wallet);
    // }
    return {
      status: true,
      message: "App default wallets",
      data,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get app's default wallets",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get App's wallets
 * @param {api.app.APIAuthenticated} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getAppWallets = async (
  params: api.app.APIAuthenticated
): Promise<others.Response> => {
  try {
    const { appId, page, pageSize } = params;
    const where = { "app.id": appId, isDeleted: false };

    const total: number = await Wallet.count({ where });

    const query = `
        SELECT
          "token" ->> 'symbol' AS "symbol",
          "token" ->> 'coinGeckoId' AS "coinGeckoId",
          SUM(CAST(wallet. "platformBalance" AS DECIMAL) / pow(10, CAST(token ->> 'decimals' AS INTEGER))) AS "balance"
        FROM
          wallet
        WHERE
          "app" ->> 'id' = :appId
          AND "isDeleted" = false
        GROUP BY
          "token" ->> 'coinGeckoId',
          "token" ->> 'symbol'
        LIMIT :limit
        OFFSET :offset
    `;

    const [wallets]: any = await db.query(query, {
      replacements: { appId, limit: pageSize, offset: pageSize * (page - 1) },
    });

    const usdPrices = await currentPrices({
      tokens: wallets.map(({ coinGeckoId }) => coinGeckoId),
    });

    let totalUsdValue = 0;

    for (let index = 0; index < wallets.length; index += 1) {
      const usdValue = parseFloat(
        (usdPrices[index] * wallets[index].balance).toFixed(2)
      );
      wallets[index].usdValue = usdValue;

      totalUsdValue += usdValue;
    }

    const data = { wallets, totalUsdValue };

    return {
      status: true,
      message: "App wallets",
      data,
      metadata: { page, pageSize, total },
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get app's wallets",
        error,
      },
      code: 500,
    };
  }
};

const getTotal = async (params: any): Promise<others.Response> => {
  try {
    const { appId, token, type } = params;

    const queryCredit = `
    SELECT
      CAST("wallet" ->> 'token' AS JSONB) ->> 'symbol' AS "token",
      SUM((CAST(transaction. "amount" AS DECIMAL) / pow(10, CAST(CAST(wallet ->> 'token' AS JSONB) ->> 'decimals' AS INTEGER)))) AS "balance"
    FROM
      "transaction"
    WHERE
      CAST(wallet ->> 'app' AS JSONB) ->> 'id' = 'b5d797c1-dc90-4230-8510-4df5026ccff9'
      AND "type" = :type
      ${
        token
          ? "AND CAST(\"wallet\" ->> 'token' AS JSONB) ->> 'symbol' = :token"
          : ""
      }
    GROUP BY
      "token"
  `;

    const replacements: any = { appId, token, type };

    const [[data]]: any = await db.query(queryCredit, {
      replacements,
    });

    return {
      status: true,
      message: `App ${type} total [${token}]`,
      data,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get app total",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get app balance
 * @param {api.app.GetAppBalance} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getAppBalance = async (
  params: api.app.GetAppBalance
): Promise<others.Response> => {
  try {
    const { appId, token } = params;
    const { data: { balance: credit = 0 } = {} }: any = await getTotal({
      appId,
      token,
      type: "credit",
    });

    const { data: { balance: debit = 0 } = {} }: any = await getTotal({
      appId,
      token,
      type: "debit",
    });

    const balance = new BigNumber(credit)
      .minus(new BigNumber(debit))
      .toNumber();

    return {
      status: true,
      message: "App Balance",
      data: { balance, token },
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get app balance",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get app balances
 * @param {api.app.GetAppBalance} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getAppBalances = async (
  params: api.app.GetAppBalance
): Promise<others.Response> => {
  try {
    const { appId } = params;

    const tokens: SupportedTokenSchema[] = await SupportedToken.findAll({
      where: { verified: true },
    });
    const data: any = [];
    for (let index = 0; index < tokens.length; index += 1) {
      const { symbol: token } = tokens[index];
      const { data: result }: any = await getAppBalance({ appId, token });

      data.push(result);
    }

    return {
      status: true,
      message: "App Balances",
      data,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get app balances",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get App's wallets
 * @param {api.app.SendCrypto} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const sendCrypto = async (
  params: api.app.SendCrypto
): Promise<others.Response> => {
  try {
    const { amount, network, token: symbol, to, blockchain, appId } = params;

    const token: SupportedTokenSchema = await SupportedToken.findOne({
      where: { symbol, network, blockchain },
    });

    if (!token)
      return {
        code: 404,
        payload: { message: "Token not found", status: false },
      };

    const {
      data: { balance },
    }: any = await getAppBalance({ appId, token: token.symbol });

    const realAmount = new BigNumber(amount)
      .multipliedBy(10 ** token.decimals)
      .toNumber();

    if (
      new BigNumber(realAmount).gte(
        new BigNumber(balance).multipliedBy(10 ** token.decimals)
      )
    )
      return { status: false, message: "Insufficient balance" };

    if (blockchain === "ethereum") {
      switch (network) {
        case "altlayer-devnet": {
          const contractAddress = await WALLET_FACTORY_ADDRESS(network);
          const walletFactory = ethers.getFactory({
            contractAddress,
            network,
            privateKey: spenderPrivateKey,
          });

          if (token.isNativeToken) {
            await ethers.transferEtherFromFactory({
              amount,
              reciever: to,
              walletFactory,
            });
          } else {
            await ethers.transferERC20FromFactory({
              amount,
              reciever: to,
              tokenAddress: token.contractAddress,
              walletFactory,
            });
          }
          break;
        }
        default:
          return { status: false, message: "Network not found" };
      }
    }

    await updateWalletBalance({
      transaction: { to, token },
      type: "debit",
      amount: realAmount.toFixed(),
      appId,
    });

    return {
      status: true,
      message: "Crypto sent",
      data: {
        amount,
        network,
        token: symbol.toUpperCase(),
        recipient: to,
        blockchain,
      },
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to send crypto",
        error,
      },
      code: 500,
    };
  }
};
