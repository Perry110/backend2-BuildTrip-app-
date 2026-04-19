import { Inject, Injectable } from '@nestjs/common';
import { PlaceEntity } from '../../domain/place.entity';
import { PlaceStatus } from '../../domain/value-objects/place-status.vo';
import { PLACE_REPOSITORY } from '../../place.di-tokens';
import type { PlaceRepositoryPort } from '../../database/place.repository.port';
import type { UpdatePlaceStatusCommand } from './update-place-status.command';

@Injectable()
export class UpdatePlaceStatusService {
  constructor(
    @Inject(PLACE_REPOSITORY)
    private readonly repo: PlaceRepositoryPort,
  ) {}

  async execute(cmd: UpdatePlaceStatusCommand): Promise<{ id: string; status: string }> {
    const next = PlaceStatus.from(cmd.status);

    const entity = await this.repo.findById(cmd.placeId);
    PlaceEntity.assertFound(entity);

    entity.changeStatus(next);
    await this.repo.save(entity);

    // Events có thể dispatch tại đây khi có event bus
    // const events = entity.pullEvents();

    return { id: cmd.placeId, status: entity.getProps().status };
  }
}
