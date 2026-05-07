import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from '../notification/notification.module';
import { PlaceReviewService } from './application/place-review.service';
import { ApprovePlaceUseCase } from './application/use-cases/approve-place.use-case';
import { CreatePlaceUseCase } from './application/use-cases/create-place.use-case';
import { DeleteOwnPlaceUseCase } from './application/use-cases/delete-own-place.use-case';
import { DeletePlaceByAdminUseCase } from './application/use-cases/delete-place-by-admin.use-case';
import { GetAdminPendingPlacesUseCase } from './application/use-cases/get-admin-pending-places.use-case';
import { GetAdminPlaceUseCase } from './application/use-cases/get-admin-place.use-case';
import { GetAdminPlacesUseCase } from './application/use-cases/get-admin-places.use-case';
import { GetMyPlaceByIdUseCase } from './application/use-cases/get-my-place-by-id.use-case';
import { GetMyPlacesUseCase } from './application/use-cases/get-my-places.use-case';
import { RejectPlaceUseCase } from './application/use-cases/reject-place.use-case';
import { RestoreOwnPlaceUseCase } from './application/use-cases/restore-own-place.use-case';
import { RestorePlaceByAdminUseCase } from './application/use-cases/restore-place-by-admin.use-case';
import { SubmitPlaceUseCase } from './application/use-cases/submit-place.use-case';
import { UpdatePlaceUseCase } from './application/use-cases/update-place.use-case';
import {
  PLACE_CATALOG_REPOSITORY,
  PLACE_MANAGEMENT_EVENT_BUS,
  PLACE_MANAGEMENT_REPOSITORY,
} from './application/management.di-tokens';
import { PLACE_REVIEW_EVENT_PUBLISHER, PLACE_REVIEW_REPOSITORY } from './application/review.di-token';
import { PlaceCatalogService } from './application/queries/place-catalog.queries';
import { PlaceRatingSnapshotService } from './application/queries/place-rating-snapshot.queries';
import { BullPlaceReviewEventPublisher } from './infrastructure/events/bull-place-review-event.publisher';
import { NestEventBusAdapter } from './infrastructure/events/nest-event-bus.adapter';
import {
  PLACE_RATING_SNAPSHOT_QUEUE,
  PlaceRatingSnapshotConsumer,
} from './infrastructure/events/place-rating-snapshot.event';
import { PlaceMapper } from './infrastructure/persistence/mappers/place.mapper';
import { PartnerOrmEntity } from './infrastructure/persistence/typeorm/partner.orm-entity';
import { PlaceCategoryOrmEntity } from './infrastructure/persistence/typeorm/place-category.orm-entity';
import { PlaceOrmEntity } from './infrastructure/persistence/typeorm/place.orm-entity';
import { PlaceRatingSnapshotEventOrmEntity } from './infrastructure/persistence/typeorm/place-rating-snapshot-event.orm';
import { PlaceReviewOrmEntity } from './infrastructure/persistence/typeorm/review.orm-entity';
import { PlaceCatalogRepository } from './infrastructure/persistence/typeorm/repositories/place-catalog.repository';
import { PlaceManagementRepository } from './infrastructure/persistence/typeorm/repositories/management.repository';
import { PlaceReviewRepository } from './infrastructure/persistence/typeorm/repositories/review.repository';
import { CatalogController } from './presentation/controllers/catalog.controller';
import {
  AdminPlaceController,
  PartnerPlaceController,
} from './presentation/controllers/management.controller';
import { PlaceReviewController } from './presentation/controllers/review.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    NotificationModule,
    TypeOrmModule.forFeature([
      User,
      PlaceOrmEntity,
      PartnerOrmEntity,
      PlaceCategoryOrmEntity,
      PlaceRatingSnapshotEventOrmEntity,
      PlaceReviewOrmEntity,
    ]),
    BullModule.registerQueue({
      name: PLACE_RATING_SNAPSHOT_QUEUE,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      },
    }),
  ],
  controllers: [
    AdminPlaceController,
    PartnerPlaceController,
    CatalogController,
    PlaceReviewController,
  ],
  providers: [
    PlaceMapper,
    PlaceManagementRepository,
    PlaceReviewService,
    PlaceCatalogRepository,
    BullPlaceReviewEventPublisher,
    PlaceRatingSnapshotConsumer,
    NestEventBusAdapter,
    {
      provide: PLACE_MANAGEMENT_REPOSITORY,
      useClass: PlaceManagementRepository,
    },
    {
      provide: PLACE_MANAGEMENT_EVENT_BUS,
      useClass: NestEventBusAdapter,
    },
    {
      provide: PLACE_CATALOG_REPOSITORY,
      useClass: PlaceCatalogRepository,
    },
    {
      provide: PLACE_REVIEW_REPOSITORY,
      useClass: PlaceReviewRepository,
    },
    {
      provide: PLACE_REVIEW_EVENT_PUBLISHER,
      useClass: BullPlaceReviewEventPublisher,
    },
    CreatePlaceUseCase,
    UpdatePlaceUseCase,
    SubmitPlaceUseCase,
    ApprovePlaceUseCase,
    RejectPlaceUseCase,
    DeletePlaceByAdminUseCase,
    DeleteOwnPlaceUseCase,
    GetAdminPlaceUseCase,
    GetAdminPlacesUseCase,
    GetAdminPendingPlacesUseCase,
    GetMyPlaceByIdUseCase,
    GetMyPlacesUseCase,
    RestorePlaceByAdminUseCase,
    RestoreOwnPlaceUseCase,
    PlaceCatalogService,
    PlaceRatingSnapshotService,
  ],
  exports: [PLACE_MANAGEMENT_REPOSITORY, PLACE_REVIEW_REPOSITORY, PLACE_REVIEW_EVENT_PUBLISHER, BullModule],
})
export class PlaceManagementModule {}
