import { Column, DataType, ForeignKey, HasMany, Model, Table } from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';
import { TripPlace } from './trip-place.entity';

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

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare destination: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'start_date' })
  declare startDate: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'end_date' })
  declare endDate: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_public' })
  declare isPublic: boolean;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  declare userId: string;

  @HasMany(() => TripPlace, { foreignKey: 'tripId', as: 'tripPlaces' })
  declare tripPlaces?: TripPlace[];
}
