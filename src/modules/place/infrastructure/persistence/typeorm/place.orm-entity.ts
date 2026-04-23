import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('places')
export class PlaceOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 500 })
  address!: string;

  @Column({ type: 'numeric', precision: 10, scale: 7 })
  lat!: string;

  @Column({ type: 'numeric', precision: 10, scale: 7 })
  lng!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 100, name: 'category_id' })
  category!: string;

  @Column({ type: 'jsonb', name: 'tag_scores', nullable: true, default: () => "'{}'" })
  tagScores!: Record<string, number> | null;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ type: 'text', name: 'thumbnail', nullable: true })
  thumbnail!: string | null;

  @Column({ type: 'jsonb', name: 'image_urls', nullable: true, default: () => "'[]'" })
  imageUrls!: string[] | null;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @Column({ type: 'text', name: 'deleted_reason', nullable: true })
  deletedReason!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
