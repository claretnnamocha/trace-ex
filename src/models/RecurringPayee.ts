import { DataTypes, UUIDV4 } from "sequelize";
import { Column, IsUUID, Model, PrimaryKey, Table } from "sequelize-typescript";
import { App, SupportedToken } from ".";
import { RecurringTransaction } from "./RecurringTransaction";

@Table({
  tableName: "recurringPayee",
  hooks: {
    async afterBulkUpdate({ where }) {
      const payees = await this.findAll({ where });

      for (let index = 0; index < payees.length; index += 1) {
        const payee: any = payees[index].toJSON();

        await RecurringTransaction.update(
          { payee },
          { where: { "payee.id": payee.id } }
        );
      }
    },

    async afterUpdate(instance) {
      const payee: any = instance.toJSON();
      await RecurringTransaction.update(
        { payee },
        { where: { "payee.id": payee.id } }
      );
    },
  },
})
export class RecurringPayee extends Model {
  @IsUUID("4")
  @PrimaryKey
  @Column({
    defaultValue: UUIDV4,
    type: DataTypes.STRING,
  })
  public id: string;

  @Column({ type: DataTypes.STRING, allowNull: false, unique: true })
  public email: string;

  @Column({ type: DataTypes.JSONB, allowNull: false })
  public app: App;

  @Column({ type: DataTypes.STRING })
  public firstName: string;

  @Column({ type: DataTypes.STRING })
  public lastName: string;

  @Column({ type: DataTypes.STRING })
  public phone: string;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  })
  public isActive: boolean;

  @Column({ type: DataTypes.JSONB })
  public token: SupportedToken;

  @Column({ type: DataTypes.STRING, allowNull: false })
  public payoutAmount: string;

  @Column({ type: DataTypes.STRING, allowNull: false })
  public payoutAddress: string;

  @Column({ type: DataTypes.STRING, allowNull: false })
  public payoutFrequency: "weekly" | "bi-weekly" | "monthly";

  @Column({ type: DataTypes.STRING, allowNull: false })
  public nextPayoutDate: string;

  @Column({ type: DataTypes.STRING, allowNull: false })
  public lastPayoutDate: string;

  toJSON() {
    const data = this.dataValues;
    return data;
  }
}
