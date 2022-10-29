import Sequelize, { DataTypes } from "sequelize";
import { db } from "../configs/db";

const Transaction = db.define(
  "Transaction",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    wallet: { type: DataTypes.JSONB },
    amount: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      values: ["debit", "credit"],
    },
    metadata: { type: DataTypes.JSONB },
    shouldAggregate: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    confirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { timestamps: true, tableName: "transaction" }
);

Transaction.prototype.toJSON = function () {
  const data = this.dataValues;

  delete data.isDeleted;
  return data;
};

export { Transaction };
