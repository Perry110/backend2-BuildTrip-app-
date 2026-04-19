import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Place } from '../../../place/entities/place.entity';
import { Trip } from './trip.model';

@Table({ tableName: 'trip_places', underscored: true, timestamps: true })
export class TripPlace extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @ForeignKey(() => Trip)
  @Column({ type: DataType.UUID, allowNull: false, field: 'trip_id' })
  declare tripId: string;

  @ForeignKey(() => Place)
  @Column({ type: DataType.UUID, allowNull: false, field: 'place_id' })
  declare placeId: string;

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'visit_order' })
  declare visitOrder: number | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'visit_time' })
  declare visitTime: Date | null;

  @BelongsTo(() => Trip, { foreignKey: 'tripId', as: 'trip' })
  declare trip?: Trip;

  @BelongsTo(() => Place, { foreignKey: 'placeId', as: 'place' })
  declare place?: Place;
}
