import { DataTypes, UUIDV4 } from "sequelize";
import { Column, IsUUID, Model, PrimaryKey, Table } from "sequelize-typescript";

@Table({ tableName: "network" })
export class Network extends Model {
  @IsUUID("4")
  @PrimaryKey
  @Column({
    defaultValue: UUIDV4,
    type: DataTypes.STRING,
  })
  public id: string;

  @Column({ type: DataTypes.JSONB })
  public parentNetwork: this;

  @Column({ type: DataTypes.INTEGER })
  public chainId: number;

  @Column({ type: DataTypes.STRING })
  public rpc: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
  })
  public name: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
  })
  public blockchain: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
  })
  public explorer: string;

  @Column({ type: DataTypes.STRING })
  public walletFactory: string;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  })
  public isDeleted: boolean;

  toJSON() {
    const data = this.dataValues;

    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.isDeleted;
    return data;
  }
}
