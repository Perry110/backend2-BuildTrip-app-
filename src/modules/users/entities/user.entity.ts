import {
  Table,
  Column,
  Model,
  DataType,
  Index,
} from 'sequelize-typescript';

/** ORM entity — bảng `users` (Sequelize). */
@Table({
  tableName: 'users',
  underscored: true,
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Index({ unique: true })
  @Column({ type: DataType.STRING(50), allowNull: false })
  declare username: string;

  @Index({ unique: true })
  @Column({ type: DataType.STRING(100), allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'hashed_password' })
  declare hashedPassword: string;

  @Column({
    type: DataType.ENUM('user', 'member', 'admin'),
    allowNull: false,
    defaultValue: 'user',
  })
  declare role: 'user' | 'member' | 'admin';

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare phone: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare city: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare country: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare bio: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'avatar_url' })
  declare avatarUrl: string | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' })
  declare isActive: boolean;

  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: {}, field: 'tag_preferences' })
  declare tagPreferences: Record<string, unknown>;
}
