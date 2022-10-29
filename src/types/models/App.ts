import { Model } from "sequelize/types";
import { User } from "./User";

export interface App {
  id?: string;
  name?: string;
  user?: User;
  webhookUrl?: string;
  testWebhookUrl?: string;
  testApiKey?: string;
  displayName?: string;
  supportEmail?: string;
  apiKey?: string;
  secretKey?: string;
  active?: boolean;
  instantSettlement?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppSchema extends Model<App>, App {}
