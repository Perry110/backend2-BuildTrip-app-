import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PlaceActorContext } from '../../domain/aggregates/place/place.root';
import type { PlaceManagementEventBusPort } from '../ports/place-management-event-bus.port';
import {
  PLACE_MANAGEMENT_EVENT_BUS,
  PLACE_MANAGEMENT_REPOSITORY,
} from '../management.di-tokens';
import type { PlaceRepositoryPort } from '../ports/place-repository.port';

export interface RestoreOwnPlaceCommand {
  placeId: string;
  actor: PlaceActorContext;
}

@Injectable()
export class RestoreOwnPlaceUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly placeRepository: PlaceRepositoryPort,
    @Inject(PLACE_MANAGEMENT_EVENT_BUS)
    private readonly eventBus: PlaceManagementEventBusPort,
  ) {}

  async execute(command: RestoreOwnPlaceCommand): Promise<void> {
    const place = await this.placeRepository.findByIdForOwnerIncludingDeleted(
      command.placeId,
      command.actor.userId,
    );
    if (!place) {
      throw new NotFoundException(`Place ${command.placeId} not found`);
    }

    place.restoreByOwner(command.actor);
    await this.placeRepository.save(place);
    await this.eventBus.publish(place.pullDomainEvents());
  }
}
