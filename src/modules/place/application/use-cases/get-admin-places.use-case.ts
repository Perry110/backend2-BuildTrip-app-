import { Inject, Injectable } from '@nestjs/common';
import { PLACE_MANAGEMENT_REPOSITORY } from '../management.di-tokens';
import type { PlaceRepositoryPort } from '../ports/place-repository.port';

@Injectable()
export class GetAdminPlacesUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly placeRepository: PlaceRepositoryPort,
  ) {}

  async execute(status?: string) {
    const places = await this.placeRepository.findAllForAdmin(status);
    return places.map((place) => place.toSnapshot());
  }
}
