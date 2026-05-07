import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type {
  NewPlaceReviewData,
  PlaceReviewDraft,
  PlaceReviewRepositoryPort,
  PlaceReviewRow,
  PublishedPlaceReviewContext,
} from '../../../../application/ports/place-review-repository.port';
import { PlaceStatus } from '../../../../domain/value-objects/place-status.vo';
import { PartnerOrmEntity } from '../partner.orm-entity';
import { PlaceOrmEntity } from '../place.orm-entity';
import { PlaceReviewOrmEntity } from '../review.orm-entity';

@Injectable()
export class PlaceReviewRepository implements PlaceReviewRepositoryPort {
  constructor(
    @InjectRepository(PlaceReviewOrmEntity)
    private readonly reviewRepository: Repository<PlaceReviewOrmEntity>,
    @InjectRepository(PlaceOrmEntity)
    private readonly placeRepository: Repository<PlaceOrmEntity>,
    @InjectRepository(PartnerOrmEntity)
    private readonly partnerRepository: Repository<PartnerOrmEntity>,
  ) {}

  async findVisiblePlaceById(placeId: string): Promise<{ id: string } | null> {
    return this.placeRepository.findOne({
      where: {
        id: placeId,
        status: PlaceStatus.PUBLISHED,
        deletedAt: IsNull(),
      },
      select: { id: true },
    });
  }

  async findPublishedPlaceReviewContext(
    placeId: string,
  ): Promise<PublishedPlaceReviewContext | null> {
    const place = await this.placeRepository.findOne({
      where: {
        id: placeId,
        status: PlaceStatus.PUBLISHED,
        deletedAt: IsNull(),
      },
      select: { id: true, name: true },
    });
    if (!place) {
      return null;
    }
    const partner = await this.partnerRepository.findOne({
      where: { placeId },
      order: { id: 'ASC' },
      select: { userId: true },
    });
    if (!partner) {
      return null;
    }
    return {
      id: place.id,
      name: place.name,
      ownerUserId: partner.userId,
    };
  }

  async findById(reviewId: string, withDeleted = false): Promise<PlaceReviewRow | null> {
    const row = await this.reviewRepository.findOne({
      where: { id: reviewId },
      withDeleted,
    });
    return row;
  }

  async findByUserAndPlace(userId: string, placeId: string): Promise<PlaceReviewRow | null> {
    return this.reviewRepository.findOne({
      where: { userId, placeId },
    });
  }

  async findByUserAndPlaceWithDeleted(
    userId: string,
    placeId: string,
  ): Promise<PlaceReviewRow | null> {
    return this.reviewRepository.findOne({
      where: { userId, placeId },
      withDeleted: true,
    });
  }

  async findByPlaceId(
    placeId: string,
    page: number,
    limit: number,
  ): Promise<{ items: PlaceReviewRow[]; total: number }> {
    const [items, total] = await this.reviewRepository.findAndCount({
      where: { placeId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total };
  }

  create(data: NewPlaceReviewData): PlaceReviewDraft {
    return this.reviewRepository.create(data);
  }

  async save(review: PlaceReviewDraft | PlaceReviewRow): Promise<PlaceReviewRow> {
    return this.reviewRepository.save(review as PlaceReviewOrmEntity);
  }

  async restore(reviewId: string): Promise<void> {
    await this.reviewRepository.restore(reviewId);
  }

  async softDelete(reviewId: string): Promise<void> {
    await this.reviewRepository.softDelete(reviewId);
  }
}

