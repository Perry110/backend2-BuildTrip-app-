import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Trip } from '../../trips/entities/trip.entity';
import { TripPlace } from '../../trips/entities/trip-place.entity';
import type { IUserTripContextPort, UserTripContextDto } from '../ports/user-trip-context.port';
import { Category } from '../database/models/category.model';
import { Place } from '../database/models/place.model';

@Injectable()
export class UserTripContextSequelizeAdapter implements IUserTripContextPort {
  constructor(
    @InjectModel(TripPlace)
    private readonly tripPlaceModel: typeof TripPlace,
  ) {}

  async getContext(userId: string): Promise<UserTripContextDto> {
    try {
      const rows = await this.tripPlaceModel.findAll({
        include: [
          { model: Trip, as: 'trip', where: { userId }, attributes: [], required: true },
          {
            model: Place,
            as: 'place',
            attributes: ['id'],
            include: [{ model: Category, as: 'category', attributes: ['name'] }],
          },
        ],
        attributes: ['placeId'],
      });

      const placeIds = [...new Set(rows.map((r) => r.placeId).filter(Boolean))] as string[];
      const categories = [
        ...new Set(
          rows
            .map((r) => r.place?.category?.name)
            .filter(Boolean)
            .map((name) => String(name).toLowerCase()),
        ),
      ];

      return { placeIds, categories };
    } catch {
      return { placeIds: [], categories: [] };
    }
  }
}
