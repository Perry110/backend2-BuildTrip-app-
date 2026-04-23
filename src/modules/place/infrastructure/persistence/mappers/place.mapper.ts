import { Injectable } from '@nestjs/common';
import { PlaceRoot } from '../../../domain/aggregates/place/place.root';
import { PlaceStatus } from '../../../domain/value-objects/place-status.vo';
import { PlaceOrmEntity } from '../typeorm/place.orm-entity';

@Injectable()
export class PlaceMapper {
  toDomain(entity: PlaceOrmEntity, ownerId: string): PlaceRoot {
    return PlaceRoot.reconstitute({
      id: entity.id,
      name: entity.name,
      description: entity.description ?? undefined,
      address: entity.address,
      lat: Number(entity.lat),
      lng: Number(entity.lng),
      category: entity.category,
      tags: Object.keys(entity.tagScores ?? {}),
      ownerId,
      status: entity.status as PlaceStatus,
      thumbnailUrl: entity.thumbnail ?? '',
      imageUrl: entity.imageUrls?.[0] ?? '',
      deletedAt: entity.deletedAt ?? null,
      deletedReason: entity.deletedReason ?? null,
    });
  }

  toPersistence(aggregate: PlaceRoot, target?: PlaceOrmEntity): PlaceOrmEntity {
    const snapshot = aggregate.toSnapshot();
    const entity = target ?? new PlaceOrmEntity();

    entity.id = snapshot.id;
    entity.name = snapshot.name;
    entity.description = snapshot.description ?? null;
    entity.address = snapshot.address;
    entity.lat = String(snapshot.lat);
    entity.lng = String(snapshot.lng);
    entity.category = snapshot.category;
    entity.tagScores = snapshot.tags.reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = 1;
      return acc;
    }, {});
    entity.status = snapshot.status;
    entity.thumbnail = snapshot.thumbnailUrl;
    entity.imageUrls = snapshot.imageUrl ? [snapshot.imageUrl] : [];
    entity.deletedAt = snapshot.deletedAt;
    entity.deletedReason = snapshot.deletedReason;
    return entity;
  }
}
