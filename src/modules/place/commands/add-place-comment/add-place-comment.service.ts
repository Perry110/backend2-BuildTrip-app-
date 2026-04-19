import { Inject, Injectable } from '@nestjs/common';
import { PlaceEntity } from '../../domain/place.entity';
import { PLACE_REPOSITORY } from '../../place.di-tokens';
import type { PlaceRepositoryPort } from '../../database/place.repository.port';
import type { AddPlaceCommentCommand } from './add-place-comment.command';

@Injectable()
export class AddPlaceCommentService {
  constructor(
    @Inject(PLACE_REPOSITORY)
    private readonly repo: PlaceRepositoryPort,
  ) {}

  async execute(cmd: AddPlaceCommentCommand): Promise<{
    comment: unknown;
    placeNewStats: { averageRating: number; reviewCount: number };
  }> {
    let comment: unknown;
    let placeNewStats!: { averageRating: number; reviewCount: number };

    await this.repo.runTransaction(async (tx) => {
      const entity = await this.repo.findById(cmd.placeId, tx);
      PlaceEntity.assertFound(entity);

      entity.applyComment(cmd.rating);

      const { averageRating, reviewCount } = entity.getProps();
      placeNewStats = { averageRating, reviewCount };

      await this.repo.save(entity, tx);

      comment = await this.repo.addCommentRow(
        { placeId: cmd.placeId, userId: cmd.userId, username: cmd.username, rating: cmd.rating, content: cmd.content },
        tx,
      );
    });

    return { comment, placeNewStats };
  }
}
