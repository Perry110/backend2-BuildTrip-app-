import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { PlaceRepositoryPort } from '../../../../application/ports/place-repository.port';
import { PlaceRoot } from '../../../../domain/aggregates/place/place.root';
import { PlaceMapper } from '../../mappers/place.mapper';
import { PartnerOrmEntity } from '../partner.orm-entity';
import { PlaceOrmEntity } from '../place.orm-entity';

type PgError = QueryFailedError & { code?: string; constraint?: string };

@Injectable()
export class PlaceManagementRepository implements PlaceRepositoryPort {
  constructor(
    @InjectRepository(PlaceOrmEntity)
    private readonly repository: Repository<PlaceOrmEntity>,
    @InjectRepository(PartnerOrmEntity)
    private readonly partnerRepository: Repository<PartnerOrmEntity>,
    private readonly mapper: PlaceMapper,
  ) {}

  async findByIdForAdmin(id: string): Promise<PlaceRoot | null> {
    const found = await this.repository.findOne({ where: { id } });
    if (!found) {
      return null;
    }
    const ownership = await this.resolvePrimaryOwnership(id);
    return this.mapper.toDomain(found, ownership?.userId ?? '');
  }

  async findByIdForAdminIncludingDeleted(id: string): Promise<PlaceRoot | null> {
    const found = await this.repository.findOne({ where: { id }, withDeleted: true });
    if (!found) {
      return null;
    }
    const ownership = await this.resolvePrimaryOwnership(id);
    return this.mapper.toDomain(found, ownership?.userId ?? '');
  }

  async findByIdForOwner(id: string, ownerId: string): Promise<PlaceRoot | null> {
    const found = await this.repository.findOne({ where: { id } });
    if (!found) {
      return null;
    }
    const ownership = await this.resolvePrimaryOwnership(id);
    if (!ownership || ownership.userId !== ownerId) {
      return null;
    }
    return this.mapper.toDomain(found, ownership.userId);
  }

  async findByIdForOwnerIncludingDeleted(id: string, ownerId: string): Promise<PlaceRoot | null> {
    const found = await this.repository.findOne({ where: { id }, withDeleted: true });
    if (!found) {
      return null;
    }
    const ownership = await this.resolvePrimaryOwnership(id);
    if (!ownership || ownership.userId !== ownerId) {
      return null;
    }
    return this.mapper.toDomain(found, ownership.userId);
  }

  async findAllForAdmin(status?: string): Promise<PlaceRoot[]> {
    const places = await this.repository.find({
      where: status ? { status } : undefined,
      order: { createdAt: 'DESC' },
    });
    return this.mapManyToDomain(places);
  }

  async findAllPendingForAdmin(): Promise<PlaceRoot[]> {
    const places = await this.repository.find({
      where: { status: 'pending' },
      order: { createdAt: 'DESC' },
    });
    return this.mapManyToDomain(places);
  }

  async findAllForOwner(ownerId: string): Promise<PlaceRoot[]> {
    const ownerships = await this.partnerRepository.find({
      where: { userId: ownerId },
      order: { id: 'DESC' },
    });
    const placeIds = ownerships.map((ownership) => ownership.placeId);
    if (!placeIds.length) {
      return [];
    }
    const places = await this.repository.find({
      where: { id: In(placeIds) },
      order: { createdAt: 'DESC' },
    });
    return places.map((entity) => this.mapper.toDomain(entity, ownerId));
  }

  async save(place: PlaceRoot): Promise<void> {
    const snapshot = place.toSnapshot();
    const existing = await this.repository.findOne({
      where: { id: snapshot.id },
      withDeleted: true,
    });
    const entity = this.mapper.toPersistence(place, existing ?? undefined);

    try {
      await this.repository.save(entity);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        const pg = err as PgError;
        if (pg.code === '23503') {
          if (pg.constraint === 'places_category_id_fkey') {
            throw new BadRequestException(`category_id "${snapshot.category}" does not exist`);
          }
          throw new BadRequestException(`foreign_key_violation: ${pg.constraint ?? 'unknown'}`);
        }
        if (pg.code === '23505') {
          throw new BadRequestException(`duplicate_place_id: ${snapshot.id}`);
        }
      }
      throw err;
    }

    const existingOwnership = await this.partnerRepository.findOne({
      where: { placeId: snapshot.id, userId: snapshot.ownerId },
    });
    if (!existingOwnership) {
      await this.partnerRepository.save(
        this.partnerRepository.create({
          placeId: snapshot.id,
          userId: snapshot.ownerId,
        }),
      );
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete({ id });
  }

  async restore(id: string): Promise<void> {
    await this.repository.restore({ id });
  }

  private async resolvePrimaryOwnership(placeId: string): Promise<PartnerOrmEntity | null> {
    return this.partnerRepository.findOne({
      where: { placeId },
      order: { id: 'ASC' },
    });
  }

  private async mapManyToDomain(places: PlaceOrmEntity[]): Promise<PlaceRoot[]> {
    if (!places.length) {
      return [];
    }
    const placeIds = places.map((place) => place.id);
    const ownershipRows = await this.partnerRepository.find({
      where: { placeId: In(placeIds) },
      order: { id: 'ASC' },
    });
    const ownershipMap = new Map<string, string>();
    for (const row of ownershipRows) {
      if (!ownershipMap.has(row.placeId)) {
        ownershipMap.set(row.placeId, row.userId);
      }
    }
    return places.map((place) => this.mapper.toDomain(place, ownershipMap.get(place.id) ?? ''));
  }
}

