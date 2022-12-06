import bcrypt from "bcryptjs";
import BigNumber from "bignumber.js";
import ejs from "ejs";
import { authenticator } from "otplib";
import path from "path";
import { Op } from "sequelize";
import { v4 as uuid } from "uuid";
import { displayName } from "../../../package.json";
import { WALLET_FACTORY_ADDRESS } from "../../configs/constants";
import { db } from "../../configs/db";
import { spenderPrivateKey } from "../../configs/env";
import { jwt, sms } from "../../helpers";
import { currentPrices } from "../../helpers/crypto/coingecko";
import { ethers } from "../../helpers/crypto/ethereum";
import { sendEmail } from "../../jobs";
import {
  App,
  ExchangeUser,
  SupportedToken,
  Transaction,
  Wallet,
} from "../../models";
import {
  AppSchema,
  ExchangeUserSchema,
  SupportedTokenSchema,
  WalletSchema,
} from "../../types/models";
import { exchange, others } from "../../types/services";
import { generateWallet } from "../api/app/service";
import { updateWalletBalance } from "../api/utils/service";

const { FRONTEND_BASEURL } = process.env;

/**
 * Creates user account
 * @param {auth.SignUpRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const signUp = async (
  params: exchange.SignUpRequest
): Promise<others.Response> => {
  try {
    const { email, appId } = params;

    const fields = ["email", "phone"];
    for (let i = 0; i < fields.length; i += 1) {
      const param = fields[i];
      if (params[param]) {
        const where: any = { [param]: params[param], "app.id": appId };

        /* eslint-disable-next-line no-await-in-loop */
        const duplicate: ExchangeUserSchema = await ExchangeUser.findOne({
          where,
        });
        if (duplicate) {
          return {
            payload: {
              status: false,
              message: `This ${param} has been used to open an account on this platform`,
            },
            code: 409,
          };
        }
      }
    }

    const app: AppSchema = await App.findByPk(appId);

    const tokens: Array<SupportedTokenSchema> = await SupportedToken.findAll({
      where: { verified: true },
    });

    let walletIndex: number = await Wallet.max("index");
    walletIndex = walletIndex === null ? 0 : walletIndex + 1;

    for (let index = 0; index < tokens.length; index += 1) {
      const { blockchain, network, symbol } = tokens[index];
      await generateWallet({
        appId,
        blockchain,
        contactEmail: email,
        network,
        symbol,
        index: walletIndex,
      });
    }

    const user: ExchangeUserSchema = await ExchangeUser.create({
      ...params,
      app,
      index: walletIndex,
    });

    const token: string = user.generateTotp();

    const html = await ejs.renderFile(
      path.resolve(
        __dirname,
        "..",
        "..",
        "configs",
        "mail-templates",
        "auth",
        "welcome.html"
      ),
      {
        link: `${FRONTEND_BASEURL}/auth/verify?token=${token}&email=${email}`,
        username: email,
        displayName: email,
        email,
        uuid: uuid(),
        FRONTEND_BASEURL,
      }
    );

    sendEmail({
      to: email,
      subject: "Welcome",
      text: "",
      html,
    });

    return {
      payload: { status: true, message: "Registration Successful" },
      code: 201,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to create account",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Login
 * @param {auth.SignInRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const signIn = async (
  params: exchange.SignInRequest
): Promise<others.Response> => {
  try {
    const { user: identifier, password, appId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { phone: identifier }],
        "app.id": appId,
      },
    });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return {
        payload: { status: false, message: "Invalid username or password" },
        code: 401,
      };
    }

    if (!user.active) {
      return {
        payload: { status: false, message: "Account is banned contact admin" },
        code: 403,
      };
    }

    if (!user.verifiedEmail) {
      const token: string = user.generateTotp();

      const html = await ejs.renderFile(
        path.resolve(
          __dirname,
          "..",
          "..",
          "configs",
          "mail-templates",
          "auth",
          "verify.html"
        ),
        {
          token,
          link: `${FRONTEND_BASEURL}/auth/verify?token=${token}&email=${user.email}`,
          username: user.email,
          email: user.email,
          displayName: user.email,
          uuid: uuid(),
          FRONTEND_BASEURL,
        }
      );

      sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: "",
        html,
      });

      return {
        payload: { status: false, message: "Please verify your email" },
        code: 499,
      };
    }

    const { id, loginValidFrom } = user;
    const data: any = user.toJSON();

    data.token = jwt.generate({
      payload: {
        payload: id,
        loginValidFrom,
      },
    });

    return { status: true, message: "Login successful", data };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to login",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Verify user account
 * @param {auth.VerifyRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const verifyAccount = async (
  params: exchange.VerifyRequest
): Promise<others.Response> => {
  try {
    const { token, email, resend, appId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findOne({
      where: { email, "app.id": appId },
    });

    if (!user) {
      return {
        payload: { status: false, message: "ExchangeUser not found" },
        code: 404,
      };
    }

    if (user.verifiedEmail) {
      return {
        payload: { status: false, message: "Profile is already verified" },
        code: 400,
      };
    }

    if (resend) {
      const generatedToken: string = user.generateTotp();

      const html = await ejs.renderFile(
        path.resolve(
          __dirname,
          "..",
          "..",
          "configs",
          "mail-templates",
          "auth",
          "verify.html"
        ),
        {
          token: generatedToken,
          link: `${FRONTEND_BASEURL}/auth/verify?token=${token}&email=${user.email}`,
          username: user.email,
          email: user.email,
          uuid: uuid(),
          FRONTEND_BASEURL,
        }
      );

      sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: "",
        html,
      });

      return { status: true, message: "Check your email" };
    }

    if (!user.validateTotp(token)) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    await user.update({ verifiedEmail: true });

    return {
      payload: { status: true, message: "Account verified" },
      code: 202,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to verify account",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Reset user account password
 * @param {auth.InitiateResetRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const initiateReset = async (
  params: exchange.InitiateResetRequest
): Promise<others.Response> => {
  try {
    const { email, appId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findOne({
      where: { email, isDeleted: false, "app.id": appId },
    });

    if (!user) {
      return {
        status: true,
        message:
          "If we found an account associated with that email, we've sent password reset instructions to that email address on the account",
      };
    }

    const token = user.generateTotp(4, 5);

    const html = await ejs.renderFile(
      path.resolve(
        __dirname,
        "..",
        "..",
        "configs",
        "mail-templates",
        "auth",
        "reset.html"
      ),
      {
        token,
        username: email,
        displayName: email,
        link: `${FRONTEND_BASEURL}/auth/verify-reset?token=${token}&email=${email}`,
        uuid: uuid(),
      }
    );

    sendEmail({
      to: user.email,
      subject: "Reset Password",
      text: "",
      html,
    });

    return {
      status: true,
      message:
        "If we found an account associated with that email, we've sent password reset instructions to that email address on the account",
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to initiate reset",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Verify user reset token
 * @param {auth.VerifyRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const verifyReset = async (
  params: exchange.VerifyRequest
): Promise<others.Response> => {
  try {
    const { token, email, appId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findOne({
      where: { email, "app.id": appId },
    });

    if (!user || !user.validateTotp(token, 4, 5)) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    const data: string = user.generateTotp();

    return {
      payload: { status: true, message: "Valid token", data },
      code: 202,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to login",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Reset user password
 * @param {auth.ResetPasswordRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const resetPassword = async (
  params: exchange.ResetPasswordRequest
): Promise<others.Response> => {
  try {
    const { token, password, logOtherDevicesOut, email, appId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findOne({
      where: { email, "app.id": appId },
    });

    if (!user) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    if (!user.validateTotp(token)) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    const update: any = { password };
    if (logOtherDevicesOut) update.loginValidFrom = Date.now();

    await user.update(update);

    return {
      payload: { status: true, message: "Password updated" },
      code: 202,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to reset password",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get user profile
 * @param {others.LoggedIn} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getProfile = async (
  params: others.LoggedIn
): Promise<others.Response> => {
  try {
    const { userId } = params;

    const data: ExchangeUserSchema = await ExchangeUser.findByPk(userId);

    if (!data) {
      return {
        payload: { status: false, message: "Profile does not exist" },
        code: 404,
      };
    }

    return { status: true, message: "Profile", data };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get profile",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Verify user phone
 * @param {exchange.VerifyRequest} params  Request Body
 *
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const verifyPhone = async (
  params: exchange.VerifyRequest
): Promise<others.Response> => {
  try {
    const { token, userId, appId } = params;

    let user: ExchangeUserSchema = await ExchangeUser.findByPk(userId);

    if (!token) {
      const generatedToken: string = user.generateTotp();

      const status = await sms.africastalking.send({
        to: user.phone,
        body: `Dear ${user.username}, Your ${displayName} verification code is ${generatedToken}`,
      });

      if (status) await user.update({ verifiedPhone: true });

      return {
        status,
        message: status ? "OTP sent" : "Could not send, try again later",
        code: status ? 200 : 502,
      };
    }

    user = await ExchangeUser.findOne({
      where: {
        token: { [Op.like]: `${token}_verify_%` },
        id: userId,
        "app.id": appId,
      },
    });

    if (!user) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    if (!user.validateTotp(token)) {
      return {
        payload: { status: false, message: "Invalid token" },
        code: 498,
      };
    }

    await user.update({ verifiedPhone: true });

    return {
      payload: { status: true, message: "Account verified" },
      code: 202,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to verify account",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Update user profile
 * @param {exchange.UpdateRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const updateProfile = async (
  params: exchange.UpdateRequest
): Promise<others.Response> => {
  try {
    const { userId, appId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findOne({
      where: { id: userId, isDeleted: false, "app.id": appId },
    });

    await user.update(params);

    return {
      status: true,
      message: "Profile updated",
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to update profile",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Update user password
 * @param {exchange.UpdatePasswordRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const updatePassword = async (
  params: exchange.UpdatePasswordRequest
): Promise<others.Response> => {
  try {
    const { userId, newPassword, password, logOtherDevicesOut, appId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findOne({
      where: { id: userId, isDeleted: false, "app.id": appId },
    });

    if (!user.validatePassword(password))
      return { status: false, message: "Old password is Invalid" };

    const update: any = { password: newPassword };
    if (logOtherDevicesOut) update.loginValidFrom = Date.now();

    await user.update(update);

    return {
      status: true,
      message: "Password updated",
      data: logOtherDevicesOut
        ? jwt.generate({
            payload: {
              payload: user.id,
              loginValidFrom: user.loginValidFrom,
            },
          })
        : null,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to updating password",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Log other devices out
 * @param {others.LoggedIn} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const logOtherDevicesOut = async (
  params: others.LoggedIn
): Promise<others.Response> => {
  try {
    const { userId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findByPk(userId);
    await user.update({ loginValidFrom: Date.now().toString() });

    const data: any = jwt.generate({
      payload: { payload: user.id, loginValidFrom: user.loginValidFrom },
    });

    return {
      status: true,
      message: "Other Devices have been logged out",
      data,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to log other devices out",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Log out
 * @param {others.LoggedIn} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const signOut = async (
  params: others.LoggedIn
): Promise<others.Response> => {
  try {
    const { userId } = params;

    await ExchangeUser.update(
      { loginValidFrom: Date.now().toString() },
      { where: { id: userId } }
    );

    return { status: true, message: "Signed out" };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to sign out",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get all users' profile
 * @param {exchange.GetAll} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getAllUsers = async (
  params: exchange.GetAll
): Promise<others.Response> => {
  try {
    const {
      name,
      email,
      verifiedEmail,
      verifiedPhone,
      active,
      isDeleted,
      gender,
      dob,
      phone,
      permissions,
      role,
      page,
      pageSize,
      appId,
    } = params;

    let where: any = { "app.id": appId };

    if (name) where = { ...where, name: { [Op.like]: `%${name}%` } };
    if (email) where = { ...where, email: { [Op.like]: `%${email}%` } };

    if (phone) where = { ...where, phone: { [Op.like]: `%${phone}%` } };

    if (gender) where = { ...where, gender };
    if (role) where = { ...where, role };
    if (dob) where = { ...where, dob };

    if (permissions)
      where = { ...where, permissions: { [Op.in]: permissions } };

    if ("verifiedEmail" in params) where = { ...where, verifiedEmail };
    if ("verifiedPhone" in params) where = { ...where, verifiedPhone };
    if ("active" in params) where = { ...where, active };
    if ("isDeleted" in params) where = { ...where, isDeleted };

    const data: Array<ExchangeUserSchema> = await ExchangeUser.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset: pageSize * (page - 1),
    });

    const total: number = await ExchangeUser.count({ where });

    return {
      status: true,
      message: "Users",
      data,
      metadata: { page, pageSize, total },
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get all users",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get user TOTP QRCode
 * @param {exchange.UpdateRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getTotpQrCode = async (
  params: exchange.UpdateRequest
): Promise<others.Response> => {
  try {
    const { userId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findByPk(userId);

    const data = authenticator.keyuri(user.email, displayName, user.totp);

    return {
      status: true,
      message: "TOTP",
      data,
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get totp qr code",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Validate user totp
 * @param {exchange.ValidateTotp} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const validateTotp = async (
  params: exchange.ValidateTotp
): Promise<others.Response> => {
  try {
    const { userId, token, appId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findOne({
      where: { id: userId, isDeleted: false, "app.id": appId },
    });

    if (!user.validateTotp(token)) {
      return {
        payload: {
          status: false,
          message: "Invalid TOTP",
        },
        code: 401,
      };
    }

    return {
      status: true,
      message: "Valid TOTP",
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to validate totp",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get user TOTP QRCode
 * @param {exchange.UpdateRequest} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const regenerateTotpSecret = async (
  params: exchange.UpdateRequest
): Promise<others.Response> => {
  try {
    const { userId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findByPk(userId);

    await user.regenerateOtpSecret();

    return {
      status: true,
      message: "TOTP Secret regenerated",
    };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to regenerate totp secret",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get user wallets
 * @param {others.LoggedIn} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getWallets = async (
  params: others.LoggedIn
): Promise<others.Response> => {
  try {
    const { userId } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findByPk(userId);

    if (!user) {
      return {
        payload: { status: false, message: "Profile does not exist" },
        code: 404,
      };
    }

    const query = `
        SELECT
          "token" ->> 'symbol' AS "symbol",
          "token" ->> 'coinGeckoId' AS "coinGeckoId",
          "address",
          SUM(CAST(wallet. "platformBalance" AS DECIMAL) / pow(10, CAST(token ->> 'decimals' AS INTEGER))) AS "balance"
        FROM
          wallet
        WHERE
          "index" = :index
        GROUP BY
          "token" ->> 'symbol',
          "token" ->> 'coinGeckoId',
          "address"
    `;

    const [wallets]: any = await db.query(query, {
      replacements: { index: user.index },
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

    return { status: true, message: "Wallets", data };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get wallets",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Get user wallet
 * @param {exchange.GetWallet} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getWallet = async (
  params: exchange.GetWallet
): Promise<others.Response> => {
  try {
    const { userId, token, network } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findByPk(userId);

    if (!user) {
      return {
        payload: { status: false, message: "Profile does not exist" },
        code: 404,
      };
    }

    const query = `
      SELECT
        "token" ->> 'coinGeckoId' AS "coinGeckoId",
        "token" ->> 'symbol' AS "symbol",
        "address",
        SUM(CAST(wallet. "platformBalance" AS DECIMAL) / pow(10, CAST(token ->> 'decimals' AS INTEGER))) AS "balance"
      FROM
        wallet
      WHERE
        "index" = :index
      AND 
        "token" ->> 'symbol' = :token
        ${network ? "AND \"token\" ->> 'network' = :network" : ""}
      GROUP BY
        "token" ->> 'symbol',
        "token" ->> 'coinGeckoId',
        "address"
    `;

    const [[data]]: any = await db.query(query, {
      replacements: { index: user.index, token, network },
    });

    if (!data) {
      return {
        payload: { status: false, message: "Wallet does not exist" },
        code: 404,
      };
    }

    const [usdPrice] = await currentPrices({
      tokens: [data?.coinGeckoId],
    });

    data.usdValue = parseFloat((usdPrice * data.balance).toFixed(2));

    return { status: true, message: "Wallet", data };
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
 * Get user wallet
 * @param {exchange.GetWallet} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const getTransactions = async (
  params: exchange.GetWallet
): Promise<others.Response> => {
  try {
    const { userId, token, network } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findByPk(userId);

    if (!user) {
      return {
        payload: { status: false, message: "Profile does not exist" },
        code: 404,
      };
    }
    let where: any = { "wallet.index": user.index };

    if (token) where = { ...where, "wallet.token.symbol": token };
    if (network) where = { ...where, "wallet.token.network": network };

    const data = await Transaction.findAll({ where });

    return { status: true, message: "Transactions", data };
  } catch (error) {
    return {
      payload: {
        status: false,
        message: "Error trying to get transactions",
        error,
      },
      code: 500,
    };
  }
};

/**
 * Send crypto
 * @param {exchange.GetWallet} params  Request Body
 * @returns {others.Response} Contains status, message and data if any of the operation
 */
export const sendCrypto = async (
  params: exchange.SendCrypto
): Promise<others.Response> => {
  try {
    const { userId, token: symbol, network, amount, to, blockchain } = params;

    const user: ExchangeUserSchema = await ExchangeUser.findByPk(userId);

    if (!user) {
      return {
        payload: { status: false, message: "Profile does not exist" },
        code: 404,
      };
    }

    const wallet: WalletSchema = await Wallet.findOne({
      where: {
        index: user.index,
        "token.symbol": symbol,
        "token.network": network,
        "token.blockchain": blockchain,
      },
    });

    const {
      data: { balance },
    }: any = await getWallet({ token: symbol, userId });

    const realAmount = new BigNumber(amount)
      .multipliedBy(10 ** wallet.token.decimals)
      .toNumber();

    if (new BigNumber(amount).gte(balance))
      return { status: false, message: "Insufficient balance" };

    if (!wallet) {
      return {
        payload: { status: false, message: "Wallet does not exist" },
        code: 404,
      };
    }

    if (blockchain === "ethereum") {
      switch (network) {
        case "trust-testnet":
        case "metis-goerli":
        case "altlayer-devnet": {
          const contractAddress = await WALLET_FACTORY_ADDRESS(network);
          const walletFactory = ethers.getFactory({
            contractAddress,
            network,
            privateKey: spenderPrivateKey,
          });

          if (wallet.token.isNativeToken) {
            await ethers.transferEtherFromFactory({
              amount,
              reciever: to,
              walletFactory,
            });
          } else {
            await ethers.transferERC20FromFactory({
              amount,
              reciever: to,
              tokenAddress: wallet.token.contractAddress,
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
      transaction: { token: wallet.token, to },
      type: "debit",
      amount: realAmount.toFixed(),
      confirmed: true,
      walletId: wallet.id,
    });

    return {
      status: true,
      message: "Crypto sent",
      data: {
        amount,
        network,
        token: symbol.toUpperCase(),
        reciever: to,
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
