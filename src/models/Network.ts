import Sequelize, { DataTypes } from "sequelize";
import { db } from "../configs/db";

const Network = db.define(
  "Network",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    parentNetwork: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rpc: {
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
    explorer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    tableName: "network",
  }
);

Network.prototype.toJSON = function toJSON() {
  const data = this.dataValues;

  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.isDeleted;
  return data;
};

export { Network };
