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

    //     const query = `
    //     SELECT DISTINCT
    //       symbol,
    //       "name"
    //     FROM
    //       "supportedToken"
    // `;

    //   const [data] = await db.query(query, {});
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

/**
 * Networks
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const supportedNetworks = async ({
  token: symbol,
}: {
  token: string;
}): Promise<others.Response> => {
  try {
    let where = {};

    if (symbol) where = { symbol, ...where };

    const data = await SupportedToken.findAll({
      where,
      attributes: ["network"],
      group: ["network"],
    });

    return { status: true, data, message: "Networks" };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to supported networks",
        error,
      },
      code: 500,
    };
  }
};
