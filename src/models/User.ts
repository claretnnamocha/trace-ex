import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { DataTypes, UUIDV4 } from "sequelize";
import { Column, IsUUID, Model, PrimaryKey, Table } from "sequelize-typescript";
import { totpWindow } from "../configs/env";

@Table({
  tableName: "user",
  hooks: {
    async afterCreate(attributes) {
      const instance = attributes;
      const totp = authenticator.generateSecret();
      await instance.update({ totp });
    },
    async afterBulkCreate(instances) {
      for (let index = 0; index < instances.length; index += 1) {
        const instance = instances[index];
        const totp = authenticator.generateSecret();

        await instance.update({ totp });
      }
    },
  },
})
export class User extends Model {
  @IsUUID("4")
  @PrimaryKey
  @Column({
    defaultValue: UUIDV4,
    type: DataTypes.STRING,
  })
  public id: string;

  @Column({ type: DataTypes.STRING, allowNull: false, unique: true })
  public email: string;

  @Column({ type: DataTypes.STRING })
  public firstName: string;

  @Column({ type: DataTypes.STRING })
  public lastName: string;

  @Column({ type: DataTypes.STRING })
  public avatar: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "user",
    values: ["user", "admin"],
  })
  public role: string;

  @Column({ type: DataTypes.STRING })
  public phone: string;

  @Column({
    type: DataTypes.STRING,
    set(value: string) {
      const salt = bcrypt.genSaltSync();
      this.setDataValue("password", bcrypt.hashSync(value, salt));
    },
  })
  public password: string;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  public isDeleted: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  })
  public verifiedEmail: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  public verifiedPhone: boolean;

  @Column({
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  })
  public active: boolean;

  @Column({ type: DataTypes.TEXT })
  public totp: string;

  @Column({
    type: DataTypes.STRING,
    defaultValue: Date.now(),
    allowNull: false,
  })
  public loginValidFrom: string;

  toJSON() {
    const data = this.dataValues;

    delete data.totp;
    delete data.password;
    delete data.loginValidFrom;
    delete data.role;
    delete data.permissions;
    delete data.active;
    delete data.isDeleted;
    delete data.id;
    return data;
  }

  validatePassword(val: string) {
    return bcrypt.compareSync(val, this.getDataValue("password"));
  }

  validateTotp(token: string, digits: number = 6, window: number = totpWindow) {
    authenticator.options = { digits, step: window * 60 };
    return authenticator.check(token, this.getDataValue("totp"));
  }

  generateTotp(digits: number = 6, window: number = totpWindow) {
    authenticator.options = { digits, step: window * 60 };
    return authenticator.generate(this.getDataValue("totp"));
  }

  async regenerateOtpSecret() {
    const user = await User.findByPk(this.id);
    user.update({ totp: authenticator.generateSecret() });
  }
}
