import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'trip_places',
  underscored: true,
  timestamps: true,
})
export class TripPlace extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;
}
