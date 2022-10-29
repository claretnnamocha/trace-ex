import { DataTypes, UUIDV4 } from "sequelize";
import { db } from "../configs/db";

const Config = db.define(
  "Config",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },
    key: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.STRING, allowNull: false },
  },
  {
    timestamps: true,
    tableName: "config",
  }
);

export { Config };
