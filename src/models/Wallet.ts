import { DataTypes, UUIDV4 } from "sequelize";
import { Column, IsUUID, Model, PrimaryKey, Table } from "sequelize-typescript";
import { App, SupportedToken, Transaction } from ".";

@Table({
  tableName: "wallet",
  hooks: {
    async afterBulkUpdate({ where }) {
      const wallets = await this.findAll({ where });

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
})
export class Wallet extends Model {
  @IsUUID("4")
  @PrimaryKey
  @Column({
    defaultValue: UUIDV4,
    type: DataTypes.STRING,
  })
  public id: string;

  @Column({ type: DataTypes.JSONB })
  public app: App;

  @Column({ type: DataTypes.JSONB })
  public token: SupportedToken;

  @Column({ type: DataTypes.JSONB })
  public contact: { name?: string; phone?: string; email: string };

  @Column({ type: DataTypes.INTEGER, allowNull: false })
  public index: number;

  @Column({ type: DataTypes.STRING, allowNull: false })
  public address: string;

  @Column({ type: DataTypes.STRING })
  public targetAmount: string;

  @Column({ type: DataTypes.STRING, defaultValue: "0" })
  public platformBalance: string;

  @Column({ type: DataTypes.STRING, defaultValue: "0" })
  public onChainBalance: string;

  @Column({ type: DataTypes.STRING, defaultValue: "0" })
  public totalRecieved: string;

  @Column({ type: DataTypes.STRING, defaultValue: "0" })
  public totalSpent: string;

  @Column({ type: DataTypes.BOOLEAN, defaultValue: true })
  public active: boolean;

  @Column({ type: DataTypes.BOOLEAN, defaultValue: false })
  public isDeleted: boolean;

  @Column({ type: DataTypes.STRING })
  public expiresAt: string;

  toJSON() {
    const data = this.dataValues;

    delete data.active;
    delete data.isDeleted;
    return data;
  }
}
