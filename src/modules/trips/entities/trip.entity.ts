import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'trips',
  underscored: true,
  timestamps: true,
})
export class Trip extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
}
