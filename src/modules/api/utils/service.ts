import { BigNumber } from "bignumber.js";
import ejs from "ejs";
import path from "path";
import sequelize, { Op } from "sequelize";
import { v4 as uuid } from "uuid";
import { SALT } from "../../../configs/constants";
import { isTestnet, spenderPrivateKey } from "../../../configs/env";
import { blockstream } from "../../../helpers/crypto/bitcoin";
import {
  blockscout,
  covalent,
  ethers,
  zksync,
} from "../../../helpers/crypto/ethereum";
import { NormalizedTransaction } from "../../../helpers/crypto/ethereum/ethers";
import { sendEmail, sendWebhook } from "../../../jobs";
import { App, SupportedToken, Transaction, Wallet } from "../../../models";

import { api, others } from "../../../types/services";

const { FRONTEND_BASEURL } = process.env;

/**
 * Get balance
 * @param {api.utils.GetTokenBalance} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getBalance = async (
  params: api.utils.GetTokenBalance
): Promise<others.Response> => {
  try {
    const { network, address, token: symbol, blockchain } = params;

    const token = await SupportedToken.findOne({
      where: { symbol, "network.name": network },
    });

    if (!token) {
      return {
        code: 404,
        payload: { message: "Token not found", status: false },
      };
    }
    const { decimals, contractAddress, isNativeToken } = token;

    let balance: number;

    if (blockchain === "ethereum") {
      switch (network) {
        case "altlayer-devnet":
        case "trust-testnet":
        case "metis-goerli":
        case "goerli":
        case "bsc-testnet":
          if (isNativeToken) {
            balance = await ethers.getNativeTokenBalance({ address, network });
          } else {
            balance = await ethers.getERC20TokenBalance({
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
    } else if (blockchain === "bitcoin") {
      balance = await blockstream.getBalance({ testnet: isTestnet, address });
    }

    const amount = new BigNumber(balance).div(10 ** decimals).toFixed();

    return {
      status: true,
      message: "Crypto Balance",
      data: {
        amount,
        network,
        blockchain,
        token: symbol.toUpperCase(),
        address,
      },
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

    let wallet: Wallet | any;

    if (walletId) wallet = await Wallet.findByPk(walletId);
    else if (appId) {
      const app = await App.findByPk(appId);
      wallet = { app };
    }

    const { id: transactionId } = await Transaction.create({
      wallet,
      metadata: { transaction },
      type,
      amount,
      confirmed,
    });

    let [{ amount: totalRecieved }] = await Transaction.findAll({
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

    let [{ amount: totalSpent }] = await Transaction.findAll({
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
      token: {
        network: { name: network },
        isNativeToken,
        contractAddress,
      },
    } = wallet;

    switch (network) {
      case "bitcoin-testnet":
        onChainBalance = await blockstream.getBalance({
          testnet: isTestnet,
          address,
        });
        break;
      case "zksync-goerli":
      case "altlayer-devnet":
      case "trust-testnet":
      case "goerli":
      case "bsc-testnet":
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

    return {
      status: true,
      message: `Wallet ${type}ed`,
      data: { transactionId },
    };
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
      token: {
        network: { name: network, blockchain },
        symbol,
        decimals,
      },
      address,
      app: { id: appId, webhookUrl, displayName, supportEmail },
      id: walletReference,
      contact,
    } = await Wallet.findByPk(walletId);
    let normalizedTransaction: NormalizedTransaction;

    switch (network) {
      case "goerli":
      case "bsc-testnet":
        normalizedTransaction = await covalent.normalizeTransaction(
          transaction,
          address,
          network
        );
        break;
      case "bitcoin-testnet":
        normalizedTransaction = blockstream.normalizeTransaction({
          address,
          transaction,
        });
        break;
      case "zksync-goerli":
        normalizedTransaction = await zksync.v2.normalizeTransaction(
          transaction,
          address,
          network
        );
        break;
      case "metis-goerli":
      case "trust-testnet":
      case "altlayer-devnet":
        normalizedTransaction = await blockscout.normalizeTransaction(
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

    if (new BigNumber(normalizedTransaction.amount).lte(0))
      return {
        status: false,
        message: "Can't log transaction less or equal to 0",
      };

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

    const updated: any = await updateWalletBalance({
      ...normalizedTransaction,
      walletId,
    });

    if (!updated.status) return updated;

    if (webhookUrl) {
      const body = {
        reference: updated.data.transactionId,
        status: "PAYMENT_RECIEVED",
        testMode: isTestnet,
        token: symbol.toUpperCase(),
        amount: new BigNumber(normalizedTransaction.amount)
          .div(10 ** decimals)
          .toFixed(),
        blockchain,
        network,
        walletReference,
        timestamp: Date.now(),
      };
      sendWebhook({ appId, body });
    }

    const html = await ejs.renderFile(
      path.resolve(
        __dirname,
        "..",
        "..",
        "..",
        "configs",
        "mail-templates",
        "auth",
        "welcome.html"
      ),
      {
        displayName,
        amount: new BigNumber(normalizedTransaction.amount)
          .div(10 ** decimals)
          .toFixed(),
        uuid: uuid(),
        symbol,
        supportEmail,
        FRONTEND_BASEURL,
        date: new Date().toJSON(),
        currentYear: new Date().getFullYear(),
      }
    );

    if (contact.email) {
      sendEmail({
        to: contact.email,
        subject: "Welcome",
        text: "",
        html,
      });
    }

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

    const wallets = await Wallet.findAll({
      where: { address },
    });

    for (let index = 0; index < wallets.length; index += 1) {
      const {
        token: {
          network: { name: network },
        },
        id: walletId,
      } = wallets[index];
      let transactions: any;

      switch (network) {
        case "goerli":
        case "bsc-testnet":
          transactions = await covalent.getAllTransactions({
            address,
            network,
          });
          break;
        case "bitcoin-testnet":
          transactions = await blockstream.getAllTransactions({
            address,
            testnet: isTestnet,
          });
          break;
        case "zksync-goerli":
          transactions = await zksync.v2.getAllTransactions({
            address,
            network,
          });
          break;
        case "metis-goerli":
        case "trust-testnet":
        case "altlayer-devnet":
          transactions = await blockscout.getAllTransactions({
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
        network: {
          name: network,
          blockchain,
          walletFactory: walletFactoryAddress,
        },
        isNativeToken,
        contractAddress: tokenAddress,
      },
      app: { id: appId },
      index: walletIndex,
    } = await Wallet.findByPk(walletId);

    if (blockchain === "ethereum") {
      switch (network) {
        case "altlayer-devnet":
        case "metis-goerli":
        case "goerli":
        case "bsc-testnet":
        case "trust-testnet": {
          const contractAddress = walletFactoryAddress;
          const walletFactory = ethers.getFactory({
            contractAddress,
            network,
            privateKey: spenderPrivateKey,
          });

          const { secretKey } = await App.findByPk(appId);
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
