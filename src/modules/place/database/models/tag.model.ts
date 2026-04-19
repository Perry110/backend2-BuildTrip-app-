import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'tags', underscored: true, timestamps: true })
export class Tag extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare name: string;
}
