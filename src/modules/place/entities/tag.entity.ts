import { BelongsToMany, Column, DataType, Index, Model, Table } from 'sequelize-typescript';
import { Place } from './place.entity';

@Table({
  tableName: 'tags',
  underscored: true,
  timestamps: true,
})
export class Tag extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Index({ unique: true })
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @BelongsToMany(() => Place, {
    through: 'place_tags',
    foreignKey: 'tag_id',
    otherKey: 'place_id',
    as: 'places',
  })
  declare places?: Place[];
}
