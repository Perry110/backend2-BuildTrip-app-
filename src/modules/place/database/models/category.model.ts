import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'categories', underscored: true, timestamps: true })
export class Category extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare name: string;
}
