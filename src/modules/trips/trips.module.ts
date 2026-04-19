import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Place } from '../place/entities/place.entity';
import { AuthModule } from '../auth/auth.module';

// ── Domain & infrastructure ────────────────────────────────────────────────
import { Trip } from './database/models/trip.model';
import { TripPlace } from './database/models/trip-place.model';
import { TripRepository } from './database/trip.repository';
import { TripMapper } from './trips.mapper';
import { TRIP_REPOSITORY } from './trips.di-tokens';

// ── Commands ───────────────────────────────────────────────────────────────
import { CreateTripService } from './commands/create-trip/create-trip.service';
import { CreateTripHttpController } from './commands/create-trip/create-trip.http.controller';
import { UpdateTripService } from './commands/update-trip/update-trip.service';
import { UpdateTripHttpController } from './commands/update-trip/update-trip.http.controller';
import { DeleteTripService } from './commands/delete-trip/delete-trip.service';
import { DeleteTripHttpController } from './commands/delete-trip/delete-trip.http.controller';
import { AddTripPlaceService } from './commands/add-trip-place/add-trip-place.service';
import { AddTripPlaceHttpController } from './commands/add-trip-place/add-trip-place.http.controller';
import { UpdateTripPlaceService } from './commands/update-trip-place/update-trip-place.service';
import { UpdateTripPlaceHttpController } from './commands/update-trip-place/update-trip-place.http.controller';
import { RemoveTripPlaceService } from './commands/remove-trip-place/remove-trip-place.service';
import { RemoveTripPlaceHttpController } from './commands/remove-trip-place/remove-trip-place.http.controller';

// ── Queries ────────────────────────────────────────────────────────────────
import { GetTripsQueryHandler } from './queries/get-trips/get-trips.query-handler';
import { GetTripsHttpController } from './queries/get-trips/get-trips.http.controller';
import { GetTripByIdQueryHandler } from './queries/get-trip-by-id/get-trip-by-id.query-handler';
import { GetTripByIdHttpController } from './queries/get-trip-by-id/get-trip-by-id.http.controller';
import { GetTripPlacesQueryHandler } from './queries/get-trip-places/get-trip-places.query-handler';
import { GetTripPlacesHttpController } from './queries/get-trip-places/get-trip-places.http.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([Trip, TripPlace, Place]),
    AuthModule,
  ],
  controllers: [
    // Commands
    CreateTripHttpController,
    UpdateTripHttpController,
    DeleteTripHttpController,
    AddTripPlaceHttpController,
    UpdateTripPlaceHttpController,
    RemoveTripPlaceHttpController,
    // Queries
    GetTripsHttpController,
    GetTripByIdHttpController,
    GetTripPlacesHttpController,
  ],
  providers: [
    // Infrastructure
    TripMapper,
    TripRepository,
    { provide: TRIP_REPOSITORY, useExisting: TripRepository },

    // Command services
    CreateTripService,
    UpdateTripService,
    DeleteTripService,
    AddTripPlaceService,
    UpdateTripPlaceService,
    RemoveTripPlaceService,

    // Query handlers
    GetTripsQueryHandler,
    GetTripByIdQueryHandler,
    GetTripPlacesQueryHandler,
  ],
  exports: [
    TRIP_REPOSITORY,
    SequelizeModule,
  ],
})
export class TripsModule {}
