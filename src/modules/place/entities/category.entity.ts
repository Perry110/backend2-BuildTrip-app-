import { Column, DataType, HasMany, Index, Model, Table } from 'sequelize-typescript';
import { Place } from './place.entity';

@Table({
  tableName: 'categories',
  underscored: true,
  timestamps: true,
})
export class Category extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Index({ unique: true })
  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @HasMany(() => Place, { foreignKey: 'categoryId', as: 'places' })
  declare places?: Place[];
}
