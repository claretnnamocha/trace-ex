import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { DataTypes, UUIDV4 } from "sequelize";
import { db } from "../configs/db";
import { totpWindow } from "../configs/env";
import { UserSchema } from "../types/models";

const ExchangeUser = db.define(
  "ExchangeUser",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    firstName: { type: DataTypes.STRING },
    app: { type: DataTypes.JSONB, allowNull: false },
    lastName: { type: DataTypes.STRING },
    avatar: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    index: { type: DataTypes.INTEGER },
    password: {
      type: DataTypes.STRING,
      set(value: string) {
        const salt = bcrypt.genSaltSync();
        this.setDataValue("password", bcrypt.hashSync(value, salt));
      },
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    verifiedEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    verifiedPhone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    totp: { type: DataTypes.TEXT },
    loginValidFrom: {
      type: DataTypes.STRING,
      defaultValue: Date.now(),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "exchangeUser",
    hooks: {
      async afterCreate(attributes) {
        const instance: UserSchema = attributes;
        const totp = authenticator.generateSecret();
        await instance.update({ totp });
      },
      async afterBulkCreate(instances) {
        for (let index = 0; index < instances.length; index += 1) {
          const instance: UserSchema = instances[index];
          const totp = authenticator.generateSecret();

          await instance.update({ totp });
        }
      },
    },
  }
);

ExchangeUser.prototype.toJSON = function toJSON() {
  const data = this.dataValues;

  delete data.totp;
  delete data.password;
  delete data.token;
  delete data.loginValidFrom;
  delete data.role;
  delete data.permissions;
  delete data.active;
  delete data.isDeleted;
  delete data.id;
  delete data.app;
  return data;
};

ExchangeUser.prototype.validatePassword = function validatePassword(
  val: string
) {
  return bcrypt.compareSync(val, this.getDataValue("password"));
};

ExchangeUser.prototype.validateTotp = function validateTotp(
  token: string,
  digits: number = 6,
  window: number = totpWindow
) {
  authenticator.options = { digits, step: window * 60 };
  return authenticator.check(token, this.getDataValue("totp"));
};

ExchangeUser.prototype.generateTotp = function generateTotp(
  digits: number = 6,
  window: number = totpWindow
) {
  authenticator.options = { digits, step: window * 60 };
  return authenticator.generate(this.getDataValue("totp"));
};

ExchangeUser.prototype.regenerateOtpSecret =
  async function regenerateOtpSecret() {
    const user = await ExchangeUser.findByPk(this.id);
    user.update({ totp: authenticator.generateSecret() });
  };

export { ExchangeUser };
