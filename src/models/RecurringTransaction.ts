import { DataTypes, UUIDV4 } from "sequelize";
import { Column, IsUUID, Model, PrimaryKey, Table } from "sequelize-typescript";
import { RecurringPayee } from "./RecurringPayee";
import { SupportedToken } from "./SupportedToken";

@Table({ tableName: "recurringTransaction" })
export class RecurringTransaction extends Model {
  @IsUUID("4")
  @PrimaryKey
  @Column({
    defaultValue: UUIDV4,
    type: DataTypes.STRING,
  })
  public id: string;

  @Column({ type: DataTypes.JSONB })
  public payee: RecurringPayee;

  @Column({ type: DataTypes.JSONB })
  public token: SupportedToken;

  @Column({ type: DataTypes.STRING, allowNull: false })
  public amount: string;

  @Column({ type: DataTypes.STRING, allowNull: false })
  public payoutAddress: string;

  @Column({ type: DataTypes.JSONB })
  public metadata: any;

  @Column({ type: DataTypes.BOOLEAN, defaultValue: true })
  public shouldAggregate: boolean;

  @Column({ type: DataTypes.BOOLEAN, defaultValue: false })
  public confirmed: boolean;

  @Column({ type: DataTypes.BOOLEAN, defaultValue: false })
  public isDeleted: boolean;

  toJSON() {
    const data = this.dataValues;

    delete data.isDeleted;
    return data;
  }
}
