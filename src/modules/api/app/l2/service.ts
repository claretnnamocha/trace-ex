import { Op } from "sequelize";
import { zksync } from "../../../../helpers/crypto/ethereum";
import { Wallet } from "../../../../models";
import { api, others } from "../../../../types/services";

/**
 * Send tokens from L1 to L2
 * @param {api.app.SendCrypto} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const deposit = async (
  params: api.app.SendCrypto
): Promise<others.Response> => {
  try {
    const { amount, token: symbol, to, network, appId, privateKey } = params;

    const wallet = await Wallet.findOne({
      where: {
        "token.symbol": symbol,
        "token.network.name": network,
        "token.network.parentNetwork": { [Op.ne]: null },
        "app.id": appId,
      },
    });

    if (!wallet) {
      return {
        code: 404,
        payload: { message: "Token not found", status: false },
      };
    }

    const {
      token: { decimals, contractAddress },
    } = wallet;

    await zksync.v1.deposit({
      reciever: to,
      amount,
      privateKey,
      decimals,
      // @ts-ignore
      network,
      token: contractAddress,
    });

    return { status: true, message: "Token(s) sent" };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to send token from L1 to L2",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Send tokens from L2 to L1
 * @param {api.app.SendCrypto} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const withdraw = async (
  params: api.app.SendCrypto
): Promise<others.Response> => {
  try {
    const { amount, token: symbol, to, network, appId, privateKey } = params;

    const wallet = await Wallet.findOne({
      where: {
        "token.symbol": symbol,
        "token.network.name": network,
        "app.id": appId,
      },
    });

    if (!wallet) {
      return {
        code: 404,
        payload: { message: "Token not found", status: false },
      };
    }

    const {
      token: { decimals, contractAddress },
    } = wallet;

    await zksync.v1.withdraw({
      recievers: [to],
      amounts: [amount],
      privateKey,
      decimals,
      // @ts-ignore
      network,
      token: contractAddress,
    });

    return { status: true, message: "Token(s) sent" };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to send token from L2 to L1",
        error,
      },
      code: 500,
    };
  }
};
