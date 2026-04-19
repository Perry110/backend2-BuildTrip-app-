import { Inject, Injectable } from '@nestjs/common';
import { PlaceEntity } from '../../domain/place.entity';
import { PLACE_REPOSITORY } from '../../place.di-tokens';
import type { PlaceRepositoryPort } from '../../database/place.repository.port';
import type { CreatePlaceCommand } from './create-place.command';

@Injectable()
export class CreatePlaceService {
  constructor(
    @Inject(PLACE_REPOSITORY)
    private readonly repo: PlaceRepositoryPort,
  ) {}

  async execute(cmd: CreatePlaceCommand): Promise<unknown> {
    const entity = PlaceEntity.create(cmd);

    await this.repo.runTransaction(async (tx) => {
      const exists = await this.repo.categoryExists(entity.getProps().categoryId, tx);
      PlaceEntity.assertCategoryExists(exists);

      const { tagIds } = entity.getProps();
      if (tagIds.length) {
        const foundIds = await this.repo.findExistingTagIds(tagIds, tx);
        entity.assertTagsExist(foundIds);
      }

      await this.repo.save(entity, tx);
    });

    return this.repo.loadPlaceDetails(entity.getProps().id);
  }
}
