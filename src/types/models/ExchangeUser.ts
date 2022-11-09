import { Model } from "sequelize/types";
import { App } from "./App";

export interface ExchangeUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  app?: App;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  index?: number;
  isDeleted?: boolean;
  verifiedEmail?: boolean;
  verifiedPhone?: boolean;
  active?: boolean;
  totp?: string;
  loginValidFrom?: string;
  validatePassword?: (password: string) => boolean;
  regenerateOtpSecret?: () => Promise<void>;
  generateTotp?: (digits?: number, window?: number) => string;
  validateTotp?: (token: string, digits?: number, window?: number) => string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExchangeUserSchema extends Model<ExchangeUser>, ExchangeUser {}
