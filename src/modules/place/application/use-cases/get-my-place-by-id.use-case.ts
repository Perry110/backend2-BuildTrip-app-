import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PLACE_MANAGEMENT_REPOSITORY } from '../management.di-tokens';
import type { PlaceRepositoryPort } from '../ports/place-repository.port';

@Injectable()
export class GetMyPlaceByIdUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly placeRepository: PlaceRepositoryPort,
  ) {}

  async execute(placeId: string, ownerId: string) {
    const place = await this.placeRepository.findByIdForOwner(placeId, ownerId);
    if (!place) {
      throw new NotFoundException(`Place ${placeId} not found`);
    }
    return place.toSnapshot();
  }
}
