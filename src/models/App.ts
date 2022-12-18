import generateApiKey from "generate-api-key";
import { DataTypes, UUIDV4 } from "sequelize";
import { Column, IsUUID, Model, PrimaryKey, Table } from "sequelize-typescript";
import { SupportedToken, User, Wallet } from ".";
import { generateWallet } from "../modules/api/app/service";

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

@Table({
  tableName: "app",
  hooks: {
    async afterCreate(attributes) {
      const { id: appId } = attributes;
      await attributes.update(generateDevelopmentKeys(appId));

      const tokens = await SupportedToken.findAll({
        where: { verified: true },
      });

      for (let index = 0; index < tokens.length; index += 1) {
        const {
          network: { name: network, blockchain },
          symbol,
        } = tokens[index];

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
        const { id: appId } = instance;

        await instance.update(generateDevelopmentKeys(appId));

        const tokens = await SupportedToken.findAll({
          where: { verified: true },
        });

        for (let index2 = 0; index2 < tokens.length; index2 += 1) {
          const {
            network: { name: network, blockchain },
            symbol,
          } = tokens[index2];
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
      const apps = await this.findAll({ where });

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
})
export class App extends Model {
  @IsUUID("4")
  @PrimaryKey
  @Column({
    defaultValue: UUIDV4,
    type: DataTypes.STRING,
  })
  public id: string;

  @Column({
    type: DataTypes.STRING,
    defaultValue: null,
  })
  public name: string;

  @Column({ type: DataTypes.JSONB })
  public user: User;

  @Column({
    type: DataTypes.STRING,
    defaultValue: null,
  })
  public webhookUrl: string;

  @Column({ type: DataTypes.STRING })
  public displayName: string;

  @Column({ type: DataTypes.STRING })
  public supportEmail: string;

  @Column({ type: DataTypes.STRING })
  public apiKey: string;

  @Column({ type: DataTypes.STRING })
  public secretKey: string;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  })
  public active: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  })
  public instantSettlement: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  })
  public isDeleted: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  })
  public isVerified: boolean;

  toJSON() {
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
  }
}
