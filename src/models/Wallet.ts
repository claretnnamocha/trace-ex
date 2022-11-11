import Sequelize, { DataTypes } from "sequelize";
import { db } from "../configs/db";
import { Transaction } from "./Transaction";

const Wallet = db.define(
  "Wallet",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    app: { type: DataTypes.JSONB },
    token: { type: DataTypes.JSONB },
    contact: { type: DataTypes.JSONB },
    index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetAmount: { type: DataTypes.STRING },
    platformBalance: {
      type: DataTypes.STRING,
      defaultValue: "0",
    },
    onChainBalance: {
      type: DataTypes.STRING,
      defaultValue: "0",
    },
    totalRecieved: {
      type: DataTypes.STRING,
      defaultValue: "0",
    },
    totalSpent: {
      type: DataTypes.STRING,
      defaultValue: "0",
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expiresAt: { type: DataTypes.STRING },
  },
  {
    timestamps: true,
    tableName: "wallet",
    hooks: {
      async afterBulkUpdate({ where }) {
        const wallets = await Wallet.findAll({ where });

        for (let index = 0; index < wallets.length; index += 1) {
          let wallet: any = wallets[index];
          wallet = wallet.toJSON();

          await Transaction.update(
            { wallet },
            { where: { "wallet.id": wallet.id } }
          );
        }
      },
      async afterUpdate(instance) {
        const wallet: any = instance.toJSON();
        await Transaction.update(
          { wallet },
          { where: { "wallet.id": wallet.id } }
        );
      },
    },
  }
);

Wallet.prototype.toJSON = function toJSON() {
  const data = this.dataValues;

  delete data.active;
  delete data.isDeleted;
  return data;
};
export { Wallet };
