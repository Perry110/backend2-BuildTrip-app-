import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Place } from '../../place/entities/place.entity';
import { User } from '../../users/entities/user.entity';

@Table({
  tableName: 'comments',
  underscored: true,
  timestamps: true,
})
export class Comment extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, field: 'user_id' })
  declare userId: string;

  @ForeignKey(() => Place)
  @Column({ type: DataType.UUID, allowNull: false, field: 'place_id' })
  declare placeId: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare rating: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare content: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
    defaultValue: [],
    field: 'image_urls',
  })
  declare imageUrls: string[];

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_hidden' })
  declare isHidden: boolean;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' })
  declare user?: User;

  @BelongsTo(() => Place, { foreignKey: 'placeId', as: 'place' })
  declare place?: Place;
}
