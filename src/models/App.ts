import generateApiKey from "generate-api-key";
import Sequelize, { DataTypes } from "sequelize";
import { db } from "../configs/db";
import { generateWallet } from "../modules/api/app/service";
import { AppSchema, SupportedTokenSchema } from "../types/models";
import { SupportedToken } from "./SupportedToken";
import { Wallet } from "./Wallet";

const generateDevelopmentKeys = (id: string) => {
  const testApiKey = generateApiKey({
    method: "base32",
    dashes: false,
    prefix: "TEX_TEST_KEY",
  });

  const apiKey = generateApiKey({
    method: "base32",
    dashes: false,
    prefix: "TEX_KEY",
  });

  const secretKey = generateApiKey({
    method: "uuidv5",
    name: id,
    namespace: id,
    prefix: "TEX-SECRET",
  });

  return { testApiKey, apiKey, secretKey };
};

const App = db.define(
  "App",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    user: { type: DataTypes.JSONB },
    webhookUrl: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
    displayName: { type: DataTypes.STRING },
    supportEmail: { type: DataTypes.STRING },
    apiKey: { type: DataTypes.STRING },
    secretKey: { type: DataTypes.STRING },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    instantSettlement: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    tableName: "app",
    hooks: {
      async afterCreate(attributes) {
        const { id: appId }: AppSchema = attributes;
        await attributes.update(generateDevelopmentKeys(appId));

        const tokens: Array<SupportedTokenSchema> =
          await SupportedToken.findAll({
            where: { verified: true },
          });

        for (let index = 0; index < tokens.length; index += 1) {
          const { blockchain, network, symbol } = tokens[index];
          console.log({ blockchain, network, symbol });

          await generateWallet({
            appId,
            blockchain,
            contactEmail: undefined,
            network,
            symbol,
          });
        }
      },
      async afterBulkCreate(instances) {
        for (let index = 0; index < instances.length; index += 1) {
          const instance = instances[index];
          const { id: appId }: AppSchema = instance;

          await instance.update(generateDevelopmentKeys(appId));

          const tokens: Array<SupportedTokenSchema> =
            await SupportedToken.findAll({
              where: { verified: true },
            });

          for (let index2 = 0; index2 < tokens.length; index2 += 1) {
            const { blockchain, network, symbol } = tokens[index2];
            /* eslint-disable no-await-in-loop */
            await generateWallet({
              appId,
              blockchain,
              contactEmail: undefined,
              network,
              symbol,
            });
          }
        }
      },
      async afterBulkUpdate({ where }) {
        const apps = await App.findAll({ where });

        for (let index = 0; index < apps.length; index += 1) {
          const app: any = apps[index].toJSON();

          await Wallet.update({ app }, { where: { "app.id": app.id } });
        }
      },
      async afterUpdate(instance) {
        const app: any = instance.toJSON();
        await Wallet.update({ app }, { where: { "app.id": app.id } });
      },
    },
  }
);

App.prototype.toJSON = function toJSON() {
  const {
    name,
    testWebhookUrl,
    webhookUrl,
    user,
    instantSettlement,
    id,
    displayName,
    supportEmail,
  } = this.dataValues;
  return {
    name,
    testWebhookUrl,
    webhookUrl,
    user,
    instantSettlement,
    id,
    displayName,
    supportEmail,
  };
};

export { App };
