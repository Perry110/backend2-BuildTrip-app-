import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Trip } from './entities/trip.entity';
import { TripPlace } from './entities/trip-place.entity';

@Module({
  imports: [SequelizeModule.forFeature([Trip, TripPlace])],
  exports: [SequelizeModule],
})
export class TripsModule {}
