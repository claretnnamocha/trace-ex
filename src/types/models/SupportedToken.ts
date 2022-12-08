import { Model } from "sequelize/types";
import { Network } from "./Network";

export interface SupportedToken {
  id?: string;
  decimals?: number;
  minimumDrainAmount?: number;
  contractAddress?: string;
  symbol?: string;
  network?: Network;
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
