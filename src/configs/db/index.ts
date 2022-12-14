import { Sequelize } from "sequelize";
import { dbSecure, dbURL } from "../env";
import { seed } from "./seed";

export const db = new Sequelize(dbURL, {
  dialectOptions: !dbSecure
    ? {}
    : { ssl: { require: true, rejectUnauthorized: false } },
  logging: false,
});

export const authenticate = async ({ clear = false }) => {
  try {
    await db.authenticate();
    console.log("Connection to Database has been established successfully.");

    const models = await import("../../models");
    const opts = clear ? { force: true } : { alter: true };

    const modelSync = [];
    const keys = Object.keys(models);
    for (let i = 0; i < keys.length; i += 1) {
      const schema = keys[i];
      modelSync.push(models[schema].sync(opts));
    }
    await Promise.all(modelSync);

    if (clear) await seed();

    console.log("Database Migrated");
  } catch (error) {
    console.error(`Unable to connect to the database: ${error.message}`);
  }
};
