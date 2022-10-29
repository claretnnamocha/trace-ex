import { Model } from "sequelize/types";

export interface SupportedToken {
  id?: string;
  decimals?: number;
  contractAddress?: string;
  symbol?: string;
  blockchain?: string;
  network?: string;
  name?: string;
  coinGeckoId?: string;
  isNativeToken?: boolean;
  isStableToken?: boolean;
  verified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SupportedTokenSchema
  extends Model<SupportedToken>,
    SupportedToken {}
