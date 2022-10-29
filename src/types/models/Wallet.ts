import { Model } from "sequelize/types";
import { App } from "./App";
import { SupportedToken } from "./SupportedToken";

export interface Wallet {
  id?: string;
  app?: App;
  token?: SupportedToken;
  contact?: { name?: string; phone?: string; email: string };
  index?: number;
  address?: string;
  targetAmount?: string;
  platformBalance?: string;
  onChainBalance?: string;
  totalRecieved?: string;
  totalSpent?: string;
  active?: boolean;
  isDeleted?: boolean;
  expiresAt?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WalletSchema extends Model<Wallet>, Wallet {}
