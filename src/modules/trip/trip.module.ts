import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AddTripDayHandler } from './application/commands/handles/add-trip-day.handler';
import { AddTripItemHandler } from './application/commands/handles/add-trip-item.handler';
import { CreateDraftTripHandler } from './application/commands/handles/create-draft-trip.handler';
import { RemoveTripDayHandler } from './application/commands/handles/remove-trip-day.handler';
import { RemoveTripItemHandler } from './application/commands/handles/remove-trip-item.handler';
import { RescheduleTripItemHandler } from './application/commands/handles/reschedule-trip-item.handler';
import { UpdateTripDayHandler } from './application/commands/handles/update-trip-day.handler';
import { UpdateTripItemHandler } from './application/commands/handles/update-trip-item.handler';
import { AddTripDayHandlerImpl } from './application/commands/impls/add-trip-day.handler.impl';
import { AddTripItemHandlerImpl } from './application/commands/impls/add-trip-item.handler.impl';
import { CreateDraftTripHandlerImpl } from './application/commands/impls/create-draft-trip.handler.impl';
import { RemoveTripDayHandlerImpl } from './application/commands/impls/remove-trip-day.handler.impl';
import { RemoveTripItemHandlerImpl } from './application/commands/impls/remove-trip-item.handler.impl';
import { RescheduleTripItemHandlerImpl } from './application/commands/impls/reschedule-trip-item.handler.impl';
import { UpdateTripDayHandlerImpl } from './application/commands/impls/update-trip-day.handler.impl';
import { UpdateTripItemHandlerImpl } from './application/commands/impls/update-trip-item.handler.impl';
import { GetTripDetailHandler } from './application/queries/handles/get-trip-detail.handler';
import { ListMyTripsHandler } from './application/queries/handles/list-my-trips.handler';
import { GetTripDetailHandlerImpl } from './application/queries/impls/get-trip-detail.handler.impl';
import { ListMyTripsHandlerImpl } from './application/queries/impls/list-my-trips.handler.impl';
import { TRIP_EVENT_BUS, TRIP_REPOSITORY } from './trip.di-tokens';
import { NoopTripEventBusAdapter } from './infrastructure/events/noop-trip-event-bus.adapter';
import { TripMapper } from './infrastructure/persistence/mappers/trip.mapper';
import { TypeormTripRepository } from './infrastructure/persistence/repositories/typeorm-trip.repository';
import { TripDayOrmEntity } from './infrastructure/persistence/typeorm/trip-day.orm-entity';
import { TripItemOrmEntity } from './infrastructure/persistence/typeorm/trip-item.orm-entity';
import { TripOrmEntity } from './infrastructure/persistence/typeorm/trip.orm-entity';
import { TripController } from './presentation/controllers/trip.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TripOrmEntity, TripDayOrmEntity, TripItemOrmEntity])],
  controllers: [TripController],
  providers: [
    TripMapper,
    {
      provide: CreateDraftTripHandler,
      useClass: CreateDraftTripHandlerImpl,
    },
    {
      provide: ListMyTripsHandler,
      useClass: ListMyTripsHandlerImpl,
    },
    {
      provide: GetTripDetailHandler,
      useClass: GetTripDetailHandlerImpl,
    },
    {
      provide: AddTripDayHandler,
      useClass: AddTripDayHandlerImpl,
    },
    {
      provide: UpdateTripDayHandler,
      useClass: UpdateTripDayHandlerImpl,
    },
    {
      provide: RemoveTripDayHandler,
      useClass: RemoveTripDayHandlerImpl,
    },
    {
      provide: AddTripItemHandler,
      useClass: AddTripItemHandlerImpl,
    },
    {
      provide: UpdateTripItemHandler,
      useClass: UpdateTripItemHandlerImpl,
    },
    {
      provide: RescheduleTripItemHandler,
      useClass: RescheduleTripItemHandlerImpl,
    },
    {
      provide: RemoveTripItemHandler,
      useClass: RemoveTripItemHandlerImpl,
    },
    {
      provide: TRIP_REPOSITORY,
      useClass: TypeormTripRepository,
    },
    {
      provide: TRIP_EVENT_BUS,
      useClass: NoopTripEventBusAdapter,
    },
  ],
  exports: [CreateDraftTripHandler, TRIP_REPOSITORY, TRIP_EVENT_BUS],
})
export class TripModule {}
