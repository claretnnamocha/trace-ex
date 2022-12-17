import { SyncOptions } from "sequelize";
import { Sequelize, SequelizeOptions } from "sequelize-typescript";
import * as models from "../../models";
import { clearDb, dbSecure, dbURL } from "../env";
import { seed } from "./seed";

const dbOptions: SequelizeOptions = {
  dialectOptions: {
    ssl: dbSecure && {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
  models: Object.values(models),
};

export const db: Sequelize = new Sequelize(dbURL, dbOptions);

export const authenticate = async () => {
  try {
    const syncOptions: SyncOptions = { force: clearDb, alter: true };
    await db.sync(syncOptions);

    if (clearDb) await seed();

    console.log("Database Migrated");
  } catch (error) {
    console.error(`Unable to connect to the database: ${error.message}`);
  }
};
