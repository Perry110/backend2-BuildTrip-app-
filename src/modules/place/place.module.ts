import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddReviewUseCase } from './application/use-cases/add-review.use-case';
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
  PLACE_MANAGEMENT_EVENT_BUS,
  PLACE_MANAGEMENT_REPOSITORY,
} from './application/management.di-tokens';
import { REVIEW_REPOSITORY } from './application/ports/review-repository.port';
import { GetPlaceDetailsHandler } from './application/queries/get-place-details.handler';
import { SearchNearestHandler } from './application/queries/search-nearest.handler';
import { NestEventBusAdapter } from './infrastructure/events/nest-event-bus.adapter';
import { PlaceMapper } from './infrastructure/persistence/mappers/place.mapper';
import { PartnerOrmEntity } from './infrastructure/persistence/typeorm/partner.orm-entity';
import { PlaceCategoryOrmEntity } from './infrastructure/persistence/typeorm/place-category.orm-entity';
import { PlaceOrmEntity } from './infrastructure/persistence/typeorm/place.orm-entity';
import { PostgisCatalogRepository } from './infrastructure/persistence/typeorm/repositories/postgis-catalog.repository';
import { PlaceManagementRepository } from './infrastructure/persistence/typeorm/repositories/management.repository';
import { PostgresReviewRepository } from './infrastructure/persistence/typeorm/repositories/postgres-review.repository';
import { CatalogController } from './presentation/controllers/catalog.controller';
import {
  AdminPlaceController,
  PartnerPlaceController,
} from './presentation/controllers/management.controller';
import { ReviewController } from './presentation/controllers/review.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlaceOrmEntity, PartnerOrmEntity, PlaceCategoryOrmEntity])],
  controllers: [
    AdminPlaceController,
    PartnerPlaceController,
    CatalogController,
    ReviewController,
  ],
  providers: [
    PlaceMapper,
    PlaceManagementRepository,
    PostgresReviewRepository,
    PostgisCatalogRepository,
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
      provide: REVIEW_REPOSITORY,
      useExisting: PostgresReviewRepository,
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
    AddReviewUseCase,
    {
      provide: SearchNearestHandler,
      useFactory: (catalogRepo: PostgisCatalogRepository) => new SearchNearestHandler(catalogRepo),
      inject: [PostgisCatalogRepository],
    },
    {
      provide: GetPlaceDetailsHandler,
      useFactory: (catalogRepo: PostgisCatalogRepository) => new GetPlaceDetailsHandler(catalogRepo),
      inject: [PostgisCatalogRepository],
    },
  ],
  exports: [PLACE_MANAGEMENT_REPOSITORY],
})
export class PlaceManagementModule {}
