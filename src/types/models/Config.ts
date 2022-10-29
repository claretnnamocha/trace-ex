import { Model } from "sequelize/types";

export interface Config {
  id?: string;
  key?: string;
  value?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConfigSchema extends Model<Config>, Config {}
