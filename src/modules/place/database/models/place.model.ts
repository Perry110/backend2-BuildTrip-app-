import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Category } from './category.model';
import { Tag } from './tag.model';

@Table({ tableName: 'places', underscored: true, timestamps: true })
export class Place extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare address: string | null;

  @Column({ type: DataType.DOUBLE, allowNull: true })
  declare lat: number | null;

  @Column({ type: DataType.DOUBLE, allowNull: true })
  declare lng: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.STRING, allowNull: true, field: 'google_place_id' })
  declare googlePlaceId: string | null;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0, field: 'average_rating' })
  declare averageRating: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, field: 'review_count' })
  declare reviewCount: number;

  @ForeignKey(() => Category)
  @Column({ type: DataType.UUID, allowNull: true, field: 'category_id' })
  declare categoryId: string | null;

  @Column({
    type: DataType.ENUM('pending', 'published', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  })
  declare status: 'pending' | 'published' | 'rejected';

  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: [], field: 'image_urls' })
  declare imageUrls: unknown;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare thumbnail: string | null;

  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: {}, field: 'tag_scores' })
  declare tagScores: Record<string, number> | null;

  @BelongsTo(() => Category, { foreignKey: 'categoryId', as: 'category' })
  declare category?: Category;

  @BelongsToMany(() => Tag, { through: 'place_tags', foreignKey: 'place_id', otherKey: 'tag_id' })
  declare tags?: Tag[];
}
