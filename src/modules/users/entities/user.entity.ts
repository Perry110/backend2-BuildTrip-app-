import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'hashed_password' })
  hashedPassword!: string;

  @Column({
    type: 'enum',
    enum: ['user', 'member', 'admin'],
    default: 'user',
  })
  role!: 'user' | 'member' | 'admin';

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatarUrl!: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_email_verified' })
  isEmailVerified!: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'email_verified_at' })
  emailVerifiedAt!: Date | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'", name: 'tag_preferences' })
  tagPreferences!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
