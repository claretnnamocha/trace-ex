import { BigNumber } from "bignumber.js";
import sequelize, { Op } from "sequelize";
import { SALT, WALLET_FACTORY_ADDRESS } from "../../../configs/constants";
import { spenderPrivateKey } from "../../../configs/env";
import { altlayer, ethers, zksync } from "../../../helpers/crypto/ethereum";
import { NormalizedTransaction } from "../../../helpers/crypto/ethereum/ethers";
import { App, SupportedToken, Transaction, Wallet } from "../../../models";
import {
  AppSchema,
  SupportedTokenSchema,
  TransactionSchema,
  WalletSchema,
} from "../../../types/models";
import { api, others } from "../../../types/services";

/**
 * Get L2 balance
 * @param {api.utils.GetTokenBalance} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getL2Balance = async (
  params: api.utils.GetTokenBalance
): Promise<others.Response> => {
  try {
    const { network, address, token: symbol } = params;

    const token: SupportedTokenSchema = await SupportedToken.findOne({
      where: { symbol, network },
    });

    if (!token) {
      return {
        code: 404,
        payload: { message: "Token not found", status: false },
      };
    }
    const { decimals, contractAddress } = token;

    let wei: number;

    switch (network) {
      case "zksync-goerli":
        wei = await zksync.v2.getBalance({
          address,
          token: !contractAddress ? symbol.toUpperCase() : contractAddress,
        });
        break;
      case "altlayer-devnet":
        if (!contractAddress) {
          wei = await ethers.getNativeTokenBalance({ address, network });
        } else {
          wei = await ethers.getERC20TokenBalance({
            address,
            network,
            contractAddress,
          });
        }
        break;

      default:
        return {
          status: false,
          message: "This network is not supported yet",
        };
    }

    const data = new BigNumber(wei).div(10 ** decimals).toFixed();

    return {
      status: true,
      message: `L2 balance for: ${address} [${network}]`,
      data,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying get L2 balance",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Update wallet balance
 * @param {api.utils.UpdateWalletBalance} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const updateWalletBalance = async (
  params: api.utils.UpdateWalletBalance
): Promise<others.Response> => {
  try {
    const { walletId, transaction, amount, type, confirmed, appId } = params;

    let wallet: WalletSchema | any;

    if (walletId) wallet = await Wallet.findByPk(walletId);
    else if (appId) {
      const app: AppSchema = await App.findByPk(appId);
      wallet = { app };
    }

    await Transaction.create({
      wallet,
      metadata: { transaction },
      type,
      amount,
      confirmed,
    });

    let [{ amount: totalRecieved }]: Array<TransactionSchema> =
      await Transaction.findAll({
        where: { type: "credit", "wallet.id": walletId, shouldAggregate: true },
        attributes: [
          [
            sequelize.fn(
              "sum",
              sequelize.cast(sequelize.col("amount"), "DECIMAL")
            ),
            "amount",
          ],
        ],
      });
    totalRecieved = new BigNumber(totalRecieved || 0).toFixed();

    let [{ amount: totalSpent }]: Array<TransactionSchema> =
      await Transaction.findAll({
        where: { type: "debit", "wallet.id": walletId, shouldAggregate: true },
        attributes: [
          [
            sequelize.fn(
              "sum",
              sequelize.cast(sequelize.col("amount"), "DECIMAL")
            ),
            "amount",
          ],
        ],
      });
    totalSpent = new BigNumber(totalSpent || 0).toFixed();

    const platformBalance = new BigNumber(totalRecieved)
      .minus(new BigNumber(totalSpent))
      .toFixed();

    let onChainBalance: number;
    const {
      address,
      token: { network, isNativeToken, contractAddress },
    } = wallet;

    switch (network) {
      case "zksync-goerli":
      case "altlayer-devnet":
      case "metis-goerli":
        if (isNativeToken) {
          onChainBalance = await ethers.getNativeTokenBalance({
            address,
            network,
          });
        } else {
          onChainBalance = await ethers.getERC20TokenBalance({
            address,
            network,
            contractAddress,
          });
        }
        break;
      default:
        return {
          status: false,
          message: "This network is not supported yet",
        };
    }

    await Wallet.update(
      {
        platformBalance,
        totalRecieved,
        totalSpent,
        onChainBalance,
      },
      { where: { id: walletId } }
    );

    return { status: true, message: `Wallet ${type}ed` };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to update wallet balance",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Log wallet transactions
 * @param {api.utils.LogWalletTransactions} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const logWalletTransactions = async (
  params: api.utils.LogWalletTransactions
): Promise<others.Response> => {
  try {
    const { walletId, transaction } = params;

    const {
      token: { network, symbol },
      address,
      app: { id: appId },
    }: WalletSchema = await Wallet.findByPk(walletId);
    let normalizedTransaction: NormalizedTransaction;

    switch (network) {
      case "zksync-goerli":
        normalizedTransaction = await zksync.v2.normalizeTransaction(
          transaction,
          address,
          network
        );
        break;
      case "altlayer-devnet":
        normalizedTransaction = await altlayer.normalizeTransaction(
          transaction,
          address,
          network
        );
        break;
      default:
        return {
          status: false,
          message: "This network is not supported yet",
        };
    }
    if (normalizedTransaction.type !== "credit")
      return { status: false, message: "Can't log non-credit transaction" };

    if (normalizedTransaction.token.toLowerCase() !== symbol.toLowerCase())
      return { status: false, message: "Can't log transaction" };

    const log = await Transaction.findOne({
      where: {
        "metadata.transaction.hash": normalizedTransaction.transaction.hash,
        [Op.or]: [{ "wallet.id": walletId }, { "wallet.app.id": appId }],
      },
    });

    if (log) {
      return {
        status: false,
        message: "Transaction already exists",
      };
    }

    await updateWalletBalance({ ...normalizedTransaction, walletId });

    return {
      code: 201,
      payload: { status: true, message: "Transaction logged" },
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to log wallet transactions",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get BTC balance
 * @param {api.utils.UpdateWalletTransactions} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const updateWalletTransactions = async (
  params: api.utils.UpdateWalletTransactions
): Promise<others.Response> => {
  try {
    const { address } = params;

    const wallets: Array<WalletSchema> = await Wallet.findAll({
      where: { address },
    });

    for (let index = 0; index < wallets.length; index += 1) {
      const {
        token: { network },
        id: walletId,
      } = wallets[index];
      let transactions: any;

      switch (network) {
        case "zksync-goerli":
          transactions = await zksync.v2.getAllTransactions({
            address,
            network,
          });
          break;
        case "altlayer-devnet":
          transactions = await altlayer.getAllTransactions({
            address,
            network,
          });
          break;
        default:
          return {
            status: false,
            message: "This network is not supported yet",
          };
      }

      for (let index2 = 0; index2 < transactions.length; index2 += 1) {
        const transaction = transactions[index2];
        /* eslint-disable no-await-in-loop */
        await logWalletTransactions({ transaction, walletId });
      }
    }

    return { status: true, message: "Wallet transaction updated" };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to update wallet transactions",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Update wallet balance
 * @param {api.utils.DrainWallet} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const drainWalletOnChain = async (
  params: api.utils.DrainWallet
): Promise<others.Response> => {
  try {
    const { walletId } = params;

    const {
      address,
      token: {
        minimumDrainAmount,
        decimals,
        network,
        isNativeToken,
        contractAddress: tokenAddress,
        blockchain,
      },
      app: { id: appId },
      index: walletIndex,
    }: WalletSchema = await Wallet.findByPk(walletId);

    if (blockchain === "ethereum") {
      switch (network) {
        case "altlayer-devnet": {
          const contractAddress = await WALLET_FACTORY_ADDRESS();
          const walletFactory = ethers.getFactory({
            contractAddress,
            network,
            privateKey: spenderPrivateKey,
          });

          const { secretKey }: AppSchema = await App.findByPk(appId);
          const salt = SALT({ walletIndex, secretKey });

          const balance = isNativeToken
            ? await ethers.getNativeTokenBalance({
                address,
                network,
              })
            : await ethers.getERC20TokenBalance({
                address,
                network,
                contractAddress: tokenAddress,
              });

          const min = new BigNumber(minimumDrainAmount).multipliedBy(
            10 ** decimals
          );

          if (min.gt(new BigNumber(balance)))
            return { status: false, message: "Amount too small" };

          const created = await walletFactory.isCreated(salt);

          if (!created)
            await ethers.createWalletWithFactory({ salt, walletFactory });

          if (isNativeToken)
            await ethers.drainEtherWithFactory({ salt, walletFactory });
          else
            await ethers.drainERC20WithFactory({
              salt,
              walletFactory,
              tokenAddress,
            });
          break;
        }

        default:
          return { status: false, message: "Network not supported" };
      }
    }

    return { status: true, message: "Crypta asset drained" };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to drain wallet",
        error,
      },
      code: 500,
    };
  }
};
