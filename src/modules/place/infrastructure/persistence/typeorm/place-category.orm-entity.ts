import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class PlaceCategoryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;
}
