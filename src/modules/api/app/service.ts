import { BigNumber } from "bignumber.js";
import crypto from "crypto";
import { HD_PATH } from "../../../configs/constants";
import { db } from "../../../configs/db";
import { mnemonic } from "../../../configs/env";
import { ethers } from "../../../helpers/crypto/ethereum";
import { App, Config, SupportedToken, User, Wallet } from "../../../models";
import {
  AppSchema,
  ConfigSchema,
  UserSchema,
  WalletSchema,
} from "../../../types/models";
import { SupportedTokenSchema } from "../../../types/models/SupportedToken";
import { api, others } from "../../../types/services";

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

    const { apiKey, secretKey, testApiKey } = app;

    return {
      status: true,
      message: "App Keys",
      data: { apiKey, secretKey, testApiKey },
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
    const { userId, displayName, name, instantSettlement, supportEmail } =
      params;

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

    const token: SupportedTokenSchema = await SupportedToken.findOne({
      where: { network, blockchain, symbol },
    });

    if (!token) return { status: false, message: "Token not found" };

    let index: number = await Wallet.max("index", {
      where: {
        "token.blockchain": blockchain,
        "token.network": network,
        "token.symbol": symbol,
      },
    });
    index = index === null ? 0 : index + 1;
    let address: string;

    switch (blockchain) {
      case "ethereum": {
        const { value: contractAddress }: ConfigSchema = await Config.findOne({
          where: { key: "WALLET_FACTORY_ADDRESS" },
        });

        // @ts-ignore
        const walletFactory = ethers.getFactory({ contractAddress, network });

        const { secretKey }: AppSchema = await App.findByPk(appId);
        const salt = `0x${crypto
          .createHmac("sha512", secretKey)
          .update(index.toFixed())
          .digest("hex")}`;

        address = await ethers.getAddressWithFactory({ salt, walletFactory });
        break;
      }
      default:
        return {
          status: false,
          message: "This blockchain is not supported yet",
        };
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
       ,(CAST(wallet."platformBalance" AS DECIMAL) / pow(10,CAST(token ->> 'decimals' AS INTEGER))) AS "platformBalance"
       ,(CAST(wallet."onChainBalance" AS DECIMAL) / pow(10,CAST(token ->> 'decimals' AS INTEGER)))  AS "onChainBalance"
       ,(CAST(wallet."totalRecieved" AS DECIMAL) / pow(10,CAST(token ->> 'decimals' AS INTEGER)))   AS "totalRecieved"
       ,(CAST(wallet."totalSpent" AS DECIMAL) / pow(10,CAST(token ->> 'decimals' AS INTEGER)))      AS "totalSpent"
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

    const [wallets] = await db.query(query, { replacements: { appId } });
    const data = [];

    for (let index = 0; index < wallets.length; index += 1) {
      const { id: reference }: any = wallets[index];
      /* eslint-disable no-await-in-loop */
      const { data: wallet }: any = await getWallet({ reference, appId });

      data.push(wallet);
    }
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

    const wallets = await Wallet.findAll({
      where,
      limit: pageSize,
      offset: pageSize * (page - 1),
    });

    const total: number = await Wallet.count({ where });

    const data = [];

    for (let index = 0; index < wallets.length; index += 1) {
      const { id: reference }: any = wallets[index];
      /* eslint-disable no-await-in-loop */
      const { data: wallet }: any = await getWallet({ reference, appId });

      data.push(wallet);
    }
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

/**
 * Get App's wallets
 * @param {api.app.SendCrypto} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const sendCrypto = async (
  params: api.app.SendCrypto
): Promise<others.Response> => {
  try {
    const { amount, network, token: symbol, to, blockchain } = params;

    const token: SupportedTokenSchema = await SupportedToken.findOne({
      where: { symbol, network },
    });

    if (!token) {
      return {
        code: 404,
        payload: { message: "Token not found", status: false },
      };
    }

    let data: any;

    switch (blockchain) {
      case "ethereum": {
        const path = HD_PATH(0);
        const { privateKey } = ethers.getWalletFromMnemonic({
          mnemonic,
          path,
          // @ts-ignore
          network,
        });

        if (symbol === "alt") {
          const { hash } = await ethers.sendEther({
            reciever: to,
            amount,
            privateKey,
            // @ts-ignore
            network,
          });
          data = { hash };
        } else {
          const { contractAddress } = token;
          const { hash } = await ethers.sendERC20Token({
            reciever: to,
            amount,
            privateKey,
            contractAddress,
            // @ts-ignore
            network,
          });
          data = { hash };
        }
        break;
      }

      default:
        return {
          status: false,
          message: "This blockchain is not supported yet",
        };
    }

    return {
      status: true,
      message: "Crypto sent",
      data: {
        ...data,
        amount,
        blockchain,
        token: symbol,
        recipient: to,
        network,
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
