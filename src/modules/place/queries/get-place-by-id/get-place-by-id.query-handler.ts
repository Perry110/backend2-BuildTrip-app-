import { Inject, Injectable } from '@nestjs/common';
import { PlaceDomainError } from '../../domain/place.errors';
import { PLACE_REPOSITORY } from '../../place.di-tokens';
import type { PlaceRepositoryPort } from '../../database/place.repository.port';

export class GetPlaceByIdQuery {
  readonly placeId: string;
  constructor(props: GetPlaceByIdQuery) { Object.assign(this, props); }
}

@Injectable()
export class GetPlaceByIdQueryHandler {
  constructor(
    @Inject(PLACE_REPOSITORY)
    private readonly repo: PlaceRepositoryPort,
  ) {}

  async execute(query: GetPlaceByIdQuery): Promise<unknown> {
    const place = await this.repo.findPublishedPlaceByPk(query.placeId);
    if (!place) throw new PlaceDomainError('Không tìm thấy địa điểm.', 'PLACE_NOT_FOUND');
    return place;
  }
}
