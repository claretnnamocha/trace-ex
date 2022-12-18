import { DataTypes, UUIDV4 } from "sequelize";
import { Column, IsUUID, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Network, Wallet } from ".";

@Table({
  tableName: "supportedToken",
  hooks: {
    async afterBulkUpdate({ where }) {
      const tokens = await this.findAll({ where });

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
})
export class SupportedToken extends Model {
  @IsUUID("4")
  @PrimaryKey
  @Column({
    defaultValue: UUIDV4,
    type: DataTypes.STRING,
  })
  public id: string;

  @Column({
    type: DataTypes.INTEGER,
    allowNull: false,
  })
  public decimals: number;

  @Column({
    type: DataTypes.REAL,
    allowNull: false,
  })
  public minimumDrainAmount: number;

  @Column({ type: DataTypes.STRING })
  public contractAddress: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
  })
  public symbol: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
  })
  public name: string;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
  })
  public network: Network;

  @Column({ type: DataTypes.STRING })
  public coinGeckoId: string;

  @Column({
    type: DataTypes.BOOLEAN,
    allowNull: false,
  })
  public isNativeToken: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    allowNull: false,
  })
  public isStableToken: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  public verified: boolean;

  toJSON() {
    const data = this.dataValues;

    delete data.active;
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.isDeleted;
    return data;
  }
}
