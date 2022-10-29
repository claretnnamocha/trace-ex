import Sequelize, { DataTypes } from "sequelize";
import { db } from "../configs/db";
import { Wallet } from "./Wallet";

const SupportedToken = db.define(
  "SupportedToken",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    decimals: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    contractAddress: {
      type: DataTypes.STRING,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    blockchain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    network: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    coinGeckoId: {
      type: DataTypes.STRING,
    },
    isNativeToken: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isStableToken: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    tableName: "supportedToken",
    hooks: {
      async afterBulkUpdate({ where }) {
        const tokens = await SupportedToken.findAll({ where });

        for (let index = 0; index < tokens.length; index += 1) {
          let token: any = tokens[index];
          token = token.toJSON();

          await Wallet.update({ token }, { where: { "token.id": token.id } });
        }
      },
      async afterUpdate(instance) {
        const token: any = instance.toJSON();
        await Wallet.update({ token }, { where: { "token.id": token.id } });
      },
    },
  }
);

SupportedToken.prototype.toJSON = function () {
  const data = this.dataValues;

  delete data.active;
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.isDeleted;
  return data;
};

export { SupportedToken };
