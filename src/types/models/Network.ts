import { Model } from "sequelize/types";

export interface Network {
  id?: string;
  parentNetwork?: Network;
  chainId?: number;
  rpc?: string;
  name?: string;
  blockchain?: string;
  explorer?: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NetworkSchema extends Model<Network>, Network {}
