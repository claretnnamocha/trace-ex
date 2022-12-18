import { DataTypes, UUIDV4 } from "sequelize";
import { Column, IsUUID, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Wallet } from ".";

@Table({ tableName: "transaction" })
export class Transaction extends Model {
  @IsUUID("4")
  @PrimaryKey
  @Column({
    defaultValue: UUIDV4,
    type: DataTypes.STRING,
  })
  public id: string;

  @Column({ type: DataTypes.JSONB })
  public wallet: Wallet;

  @Column({ type: DataTypes.STRING, defaultValue: null })
  public amount: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    values: ["debit", "credit"],
  })
  public type: string;

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
