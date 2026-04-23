import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PlaceRoot } from '../../domain/aggregates/place/place.root';
import { CategoryVo } from '../../domain/value-objects/category.vo';
import { LocationVo } from '../../domain/value-objects/location.vo';
import type { PlaceManagementEventBusPort } from '../ports/place-management-event-bus.port';
import {
  PLACE_MANAGEMENT_EVENT_BUS,
  PLACE_MANAGEMENT_REPOSITORY,
} from '../management.di-tokens';
import type { PlaceRepositoryPort } from '../ports/place-repository.port';

export interface CreatePlaceCommand {
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  tags: string[];
  ownerId: string;
  thumbnailUrl?: string;
  imageUrl?: string;
}

@Injectable()
export class CreatePlaceUseCase {
  constructor(
    @Inject(PLACE_MANAGEMENT_REPOSITORY)
    private readonly placeRepository: PlaceRepositoryPort,
    @Inject(PLACE_MANAGEMENT_EVENT_BUS)
    private readonly eventBus: PlaceManagementEventBusPort,
  ) {}

  async execute(command: CreatePlaceCommand): Promise<void> {
    const place = PlaceRoot.create({
      id: randomUUID(),
      name: command.name,
      description: command.description,
      address: command.address,
      location: new LocationVo(command.lat, command.lng),
      category: new CategoryVo(command.category),
      tags: command.tags,
      ownerId: command.ownerId,
      thumbnailUrl: command.thumbnailUrl ?? '',
      imageUrl: command.imageUrl ?? '',
    });
    await this.placeRepository.save(place);
    await this.eventBus.publish(place.pullDomainEvents());
  }
}
