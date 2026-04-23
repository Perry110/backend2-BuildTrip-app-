import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('partners')
export class PartnerOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('uq_partners_user_place', { unique: true })
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'place_id' })
  placeId!: string;
}
