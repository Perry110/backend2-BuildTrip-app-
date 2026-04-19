import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { Comment } from '../comments/entities/comment.entity';
import { Trip } from '../trips/entities/trip.entity';
import { TripPlace } from '../trips/entities/trip-place.entity';
import { User } from '../users/entities/user.entity';

// ── Domain & infrastructure ────────────────────────────────────────────────
import { Place } from './database/models/place.model';
import { Category } from './database/models/category.model';
import { Tag } from './database/models/tag.model';
import { PlaceRepository } from './database/place.repository';
import { PlaceMapper } from './place.mapper';
import { PLACE_REPOSITORY, ML_RECOMMENDATION_PORT, USER_TRIP_CONTEXT_PORT } from './place.di-tokens';

// ── Ports & adapters ───────────────────────────────────────────────────────
import { MlRecommendationClient } from './adapters/ml-recommendation.client';
import { UserTripContextSequelizeAdapter } from './adapters/user-trip-context.sequelize-adapter';

// ── Commands ───────────────────────────────────────────────────────────────
import { CreatePlaceService } from './commands/create-place/create-place.service';
import { CreatePlaceHttpController } from './commands/create-place/create-place.http.controller';
import { AddPlaceCommentService } from './commands/add-place-comment/add-place-comment.service';
import { AddPlaceCommentHttpController } from './commands/add-place-comment/add-place-comment.http.controller';
import { UpdatePlaceStatusService } from './commands/update-place-status/update-place-status.service';
import { UpdatePlaceStatusHttpController } from './commands/update-place-status/update-place-status.http.controller';

// ── Queries ────────────────────────────────────────────────────────────────
import { GetPlacesQueryHandler } from './queries/get-places/get-places.query-handler';
import { GetPlacesHttpController } from './queries/get-places/get-places.http.controller';
import { GetPlaceByIdQueryHandler } from './queries/get-place-by-id/get-place-by-id.query-handler';
import { GetPlaceByIdHttpController } from './queries/get-place-by-id/get-place-by-id.http.controller';
import { GetPlaceCommentsQueryHandler } from './queries/get-place-comments/get-place-comments.query-handler';
import { GetPlaceCommentsHttpController } from './queries/get-place-comments/get-place-comments.http.controller';
import { GetRecommendationsQueryHandler } from './queries/get-recommendations/get-recommendations.query-handler';
import { GetRecommendationsHttpController } from './queries/get-recommendations/get-recommendations.http.controller';
import { ListPendingPlacesQueryHandler } from './queries/list-pending-places/list-pending-places.query-handler';
import { ListPendingPlacesHttpController } from './queries/list-pending-places/list-pending-places.http.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Place, Category, Tag, Trip, TripPlace, Comment]),
    AuthModule,
  ],
  controllers: [
    // Commands
    CreatePlaceHttpController,
    AddPlaceCommentHttpController,
    UpdatePlaceStatusHttpController,
    // Queries
    GetPlacesHttpController,
    GetPlaceByIdHttpController,
    GetPlaceCommentsHttpController,
    GetRecommendationsHttpController,
    ListPendingPlacesHttpController,
  ],
  providers: [
    // Infrastructure
    PlaceMapper,
    PlaceRepository,
    { provide: PLACE_REPOSITORY, useExisting: PlaceRepository },

    // Adapters
    MlRecommendationClient,
    { provide: ML_RECOMMENDATION_PORT, useExisting: MlRecommendationClient },
    UserTripContextSequelizeAdapter,
    { provide: USER_TRIP_CONTEXT_PORT, useExisting: UserTripContextSequelizeAdapter },

    // Command services
    CreatePlaceService,
    AddPlaceCommentService,
    UpdatePlaceStatusService,

    // Query handlers
    GetPlacesQueryHandler,
    GetPlaceByIdQueryHandler,
    GetPlaceCommentsQueryHandler,
    GetRecommendationsQueryHandler,
    ListPendingPlacesQueryHandler,
  ],
  exports: [PLACE_REPOSITORY],
})
export class PlaceModule {}
