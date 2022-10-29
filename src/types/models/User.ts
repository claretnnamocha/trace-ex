import { Model } from "sequelize/types";

export interface User {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  location?: string;
  deleted?: boolean;
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

export interface UserSchema extends Model<User>, User {}
