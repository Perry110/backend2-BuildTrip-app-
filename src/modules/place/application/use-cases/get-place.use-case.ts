import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PLACE_MANAGEMENT_REPOSITORY,
} from '../management.di-tokens';
import type { PlaceRepositoryPort } from '../ports/place-repository.port';

@Injectable()
export class GetPlaceUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly placeRepository: PlaceRepositoryPort,
  ) {}

  async execute(placeId: string) {
    const place = await this.placeRepository.findByIdForAdmin(placeId);
    if (!place) {
      throw new NotFoundException(`Place ${placeId} not found`);
    }
    return place.toSnapshot();
  }
}
