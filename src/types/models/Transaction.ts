import { Model } from "sequelize/types";
import { Wallet } from "./Wallet";

interface Transaction {
  id?: string;
  wallet?: Wallet;
  amount?: string;
  type?: string;
  metadata?: any;
  confirmed?: boolean;
  isDeleted?: boolean;
  shouldAggregate?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionSchema extends Model<Transaction>, Transaction {}
