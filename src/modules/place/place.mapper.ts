import { Injectable } from '@nestjs/common';
import { PlaceEntity } from './domain/place.entity';
import { Place } from './database/models/place.model';

type PlaceRecord = {
  id: string;
  name: string;
  address: string;
  description: string;
  lat: number | null;
  lng: number | null;
  categoryId: string;
  tagIds: string[];
  status: 'pending' | 'published' | 'rejected';
  averageRating: number;
  reviewCount: number;
};

/**
 * PlaceMapper — converts between:
 *  toPersistence : PlaceEntity → plain record    (used by repository.save)
 *  toDomain      : Place ORM row → PlaceEntity   (used by repository finds)
 */
@Injectable()
export class PlaceMapper {
  toPersistence(entity: PlaceEntity): PlaceRecord {
    const p = entity.getProps();
    return {
      id: p.id,
      name: p.name,
      address: p.address,
      description: p.description,
      lat: p.lat,
      lng: p.lng,
      categoryId: p.categoryId,
      tagIds: [...p.tagIds],
      status: p.status,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
    };
  }

  toDomain(row: Place, tagIds: string[]): PlaceEntity {
    return PlaceEntity.reconstitute({
      id: row.id,
      name: row.name,
      address: row.address ?? '',
      description: row.description ?? '',
      lat: row.lat,
      lng: row.lng,
      categoryId: row.categoryId ?? '',
      tagIds,
      status: row.status,
      averageRating: row.averageRating,
      reviewCount: row.reviewCount,
    });
  }
}
