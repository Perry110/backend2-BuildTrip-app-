import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PlaceActorContext } from '../../domain/aggregates/place/place.root';
import { CategoryVo } from '../../domain/value-objects/category.vo';
import type { PlaceManagementEventBusPort } from '../ports/place-management-event-bus.port';
import {
  PLACE_MANAGEMENT_EVENT_BUS,
  PLACE_MANAGEMENT_REPOSITORY,
} from '../management.di-tokens';
import type { PlaceRepositoryPort } from '../ports/place-repository.port';

export interface UpdatePlaceCommand {
  id: string;
  actor?: PlaceActorContext;
  name?: string;
  description?: string;
  address?: string;
  category?: string;
  tags?: string[];
  thumbnailUrl?: string;
  imageUrl?: string;
}

@Injectable()
export class UpdatePlaceUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly placeRepository: PlaceRepositoryPort,
    @Inject(PLACE_MANAGEMENT_EVENT_BUS)
    private readonly eventBus: PlaceManagementEventBusPort,
  ) {}

  async execute(command: UpdatePlaceCommand): Promise<void> {
    const place = command.actor
      ? await this.placeRepository.findByIdForOwner(command.id, command.actor.userId)
      : await this.placeRepository.findByIdForAdmin(command.id);

    if (!place) {
      throw new NotFoundException(`Place ${command.id} not found`);
    }

    place.update({
      name: command.name,
      description: command.description,
      address: command.address,
      category: command.category ? new CategoryVo(command.category) : undefined,
      tags: command.tags,
      thumbnailUrl: command.thumbnailUrl,
      imageUrl: command.imageUrl,
    });

    await this.placeRepository.save(place);
    await this.eventBus.publish(place.pullDomainEvents());
  }
}
