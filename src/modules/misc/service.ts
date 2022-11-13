import { SupportedToken } from "../../models";
import { others } from "../../types/services";

/**
 * Ping server
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const ping = (): others.Response => ({
  status: true,
  message: "TraceEx to the moon!",
});

/**
 * Tokens
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const supportedTokens = async (): Promise<others.Response> => {
  try {
    const data = await SupportedToken.findAll({});

    return { status: true, data, message: "Tokens" };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to supported tokens",
        error,
      },
      code: 500,
    };
  }
};
