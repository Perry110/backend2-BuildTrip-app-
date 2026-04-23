import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PlaceActorContext } from '../../domain/aggregates/place/place.root';
import type { PlaceManagementEventBusPort } from '../ports/place-management-event-bus.port';
import {
  PLACE_MANAGEMENT_EVENT_BUS,
  PLACE_MANAGEMENT_REPOSITORY,
} from '../management.di-tokens';
import type { PlaceRepositoryPort } from '../ports/place-repository.port';

export interface RejectPlaceCommand {
  placeId: string;
  reason: string;
  actor: PlaceActorContext;
}

@Injectable()
export class RejectPlaceUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly placeRepository: PlaceRepositoryPort,
    @Inject(PLACE_MANAGEMENT_EVENT_BUS)
    private readonly eventBus: PlaceManagementEventBusPort,
  ) {}

  async execute(command: RejectPlaceCommand): Promise<void> {
    const place = await this.placeRepository.findByIdForAdmin(command.placeId);
    if (!place) {
      throw new NotFoundException(`Place ${command.placeId} not found`);
    }

    place.reject(command.actor, command.reason);
    await this.placeRepository.save(place);
    await this.eventBus.publish(place.pullDomainEvents());
  }
}
