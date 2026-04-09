import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { Comment } from '../comments/entities/comment.entity';
import { Trip } from '../trips/entities/trip.entity';
import { TripPlace } from '../trips/entities/trip-place.entity';
import { User } from '../users/entities/user.entity';
import { PlaceController } from './place.controller';
import { PlaceService } from './place.service';
import { Category } from './entities/category.entity';
import { Place } from './entities/place.entity';
import { Tag } from './entities/tag.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Place, Category, Tag, Trip, TripPlace, Comment]),
    AuthModule,
  ],
  controllers: [PlaceController],
  providers: [PlaceService],
  exports: [PlaceService],
})
export class PlaceModule {}
