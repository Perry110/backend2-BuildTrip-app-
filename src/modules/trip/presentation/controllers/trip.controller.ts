import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../../../auth/decorators';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../../auth/services/jwt-token.service';
import { AddTripDayHandler } from '../../application/commands/handles/add-trip-day.handler';
import { AddTripItemHandler } from '../../application/commands/handles/add-trip-item.handler';
import { CreateDraftTripHandler } from '../../application/commands/handles/create-draft-trip.handler';
import { RemoveTripDayHandler } from '../../application/commands/handles/remove-trip-day.handler';
import { RemoveTripItemHandler } from '../../application/commands/handles/remove-trip-item.handler';
import { RescheduleTripItemHandler } from '../../application/commands/handles/reschedule-trip-item.handler';
import { UpdateTripDayHandler } from '../../application/commands/handles/update-trip-day.handler';
import { UpdateTripItemHandler } from '../../application/commands/handles/update-trip-item.handler';
import { GetTripDetailHandler } from '../../application/queries/handles/get-trip-detail.handler';
import { ListMyTripsHandler } from '../../application/queries/handles/list-my-trips.handler';
import type { TripAggregateSnapshot } from '../../domain/aggregates/trip.aggregate';
import { AddTripDayDto } from '../dtos/add-trip-day.dto';
import { AddTripItemDto } from '../dtos/add-trip-item.dto';
import { CreateTripDto } from '../dtos/create-trip.dto';
import { RescheduleTripItemDto } from '../dtos/reschedule-trip-item.dto';
import { TripResponseDto } from '../dtos/trip-response.dto';
import { UpdateTripDayDto } from '../dtos/update-trip-day.dto';
import { UpdateTripItemDto } from '../dtos/update-trip-item.dto';

@ApiTags('Trips')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripController {
  constructor(
    private readonly createDraftTripHandler: CreateDraftTripHandler,
    private readonly listMyTripsHandler: ListMyTripsHandler,
    private readonly getTripDetailHandler: GetTripDetailHandler,
    private readonly addTripDayHandler: AddTripDayHandler,
    private readonly updateTripDayHandler: UpdateTripDayHandler,
    private readonly removeTripDayHandler: RemoveTripDayHandler,
    private readonly addTripItemHandler: AddTripItemHandler,
    private readonly updateTripItemHandler: UpdateTripItemHandler,
    private readonly rescheduleTripItemHandler: RescheduleTripItemHandler,
    private readonly removeTripItemHandler: RemoveTripItemHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create draft trip from client-confirmed payload' })
  @ApiCreatedResponse({ type: TripResponseDto })
  async createTrip(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateTripDto): Promise<TripResponseDto> {
    const created = await this.createDraftTripHandler.execute({
      userId: user.id,
      title: dto.title,
      startDate: dto.startDate,
      endDate: dto.endDate,
      days: dto.days,
    });

    const detail = await this.getTripDetailHandler.execute({
      tripId: created.id,
      userId: user.id,
    });

    return this.toTripResponse(detail);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List current user trips (paginated)' })
  @ApiOkResponse({ type: [TripResponseDto] })
  async listTrips(
    @CurrentUser() user: JwtUserPayload,
    @Query() query: PaginationDto,
  ): Promise<TripResponseDto[]> {
    const trips = await this.listMyTripsHandler.execute({
      userId: user.id,
      page: query.page,
      limit: query.limit,
    });

    return trips.map((trip) => this.toTripResponse(trip.toSnapshot()));
  }

  @Get(':tripId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trip detail by id' })
  @ApiParam({ name: 'tripId', format: 'uuid' })
  @ApiOkResponse({ type: TripResponseDto })
  async getTrip(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
  ): Promise<TripResponseDto> {
    const trip = await this.getTripDetailHandler.execute({
      tripId,
      userId: user.id,
    });

    return this.toTripResponse(trip);
  }

  @Post(':tripId/days')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add day to trip' })
  @ApiParam({ name: 'tripId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Trip day added' })
  async addDay(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Body() dto: AddTripDayDto,
  ): Promise<void> {
    await this.addTripDayHandler.execute({
      userId: user.id,
      tripId,
      dayIndex: dto.dayIndex,
      date: dto.date,
    });
  }

  @Patch(':tripId/days/:dayId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update trip day metadata' })
  @ApiParam({ name: 'tripId', format: 'uuid' })
  @ApiParam({ name: 'dayId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Trip day updated' })
  async updateDay(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Param('dayId', new ParseUUIDPipe()) dayId: string,
    @Body() dto: UpdateTripDayDto,
  ): Promise<void> {
    await this.updateTripDayHandler.execute({
      userId: user.id,
      tripId,
      dayId,
      dayIndex: dto.dayIndex,
      date: dto.date,
    });
  }

  @Delete(':tripId/days/:dayId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove day from trip (requires empty day)' })
  @ApiParam({ name: 'tripId', format: 'uuid' })
  @ApiParam({ name: 'dayId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Trip day removed' })
  async removeDay(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Param('dayId', new ParseUUIDPipe()) dayId: string,
  ): Promise<void> {
    await this.removeTripDayHandler.execute({
      userId: user.id,
      tripId,
      dayId,
    });
  }

  @Post(':tripId/days/:dayId/items')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Add item to trip day' })
  @ApiParam({ name: 'tripId', format: 'uuid' })
  @ApiParam({ name: 'dayId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Trip item added' })
  async addItem(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Param('dayId', new ParseUUIDPipe()) dayId: string,
    @Body() dto: AddTripItemDto,
  ): Promise<void> {
    await this.addTripItemHandler.execute({
      userId: user.id,
      tripId,
      dayId,
      placeId: dto.placeId,
      type: dto.type,
      startTime: dto.startTime,
      endTime: dto.endTime,
      note: dto.note,
      sortOrder: dto.sortOrder,
    });
  }

  @Patch(':tripId/days/:dayId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update trip item metadata' })
  @ApiParam({ name: 'tripId', format: 'uuid' })
  @ApiParam({ name: 'dayId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Trip item updated' })
  async updateItem(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Param('dayId', new ParseUUIDPipe()) dayId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateTripItemDto,
  ): Promise<void> {
    await this.updateTripItemHandler.execute({
      userId: user.id,
      tripId,
      dayId,
      itemId,
      placeId: dto.placeId,
      type: dto.type,
      note: dto.note,
      sortOrder: dto.sortOrder,
    });
  }

  @Patch(':tripId/days/:dayId/items/:itemId/time')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reschedule a trip item time slot' })
  @ApiParam({ name: 'tripId', format: 'uuid' })
  @ApiParam({ name: 'dayId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Trip item rescheduled' })
  async rescheduleItem(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Param('dayId', new ParseUUIDPipe()) dayId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: RescheduleTripItemDto,
  ): Promise<void> {
    await this.rescheduleTripItemHandler.execute({
      userId: user.id,
      tripId,
      dayId,
      itemId,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });
  }

  @Delete(':tripId/days/:dayId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from trip day' })
  @ApiParam({ name: 'tripId', format: 'uuid' })
  @ApiParam({ name: 'dayId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Trip item removed' })
  async removeItem(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Param('dayId', new ParseUUIDPipe()) dayId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<void> {
    await this.removeTripItemHandler.execute({
      userId: user.id,
      tripId,
      dayId,
      itemId,
    });
  }

  private toTripResponse(snapshot: TripAggregateSnapshot): TripResponseDto {
    return {
      id: snapshot.id,
      title: snapshot.title,
      status: snapshot.status,
      startDate: snapshot.dateRange.startDate.toISOString().slice(0, 10),
      endDate: snapshot.dateRange.endDate.toISOString().slice(0, 10),
      version: snapshot.version,
      days: snapshot.days.map((day) => {
        const daySnapshot = day.toSnapshot();
        return {
          id: daySnapshot.id,
          dayIndex: daySnapshot.dayIndex,
          date: daySnapshot.date,
          items: daySnapshot.items.map((item) => {
            const itemSnapshot = item.toSnapshot();
            return {
              id: itemSnapshot.id,
              placeId: itemSnapshot.placeId,
              type: itemSnapshot.type,
              startTime: itemSnapshot.timeSlot.startTime,
              endTime: itemSnapshot.timeSlot.endTime,
              note: itemSnapshot.note ?? null,
              sortOrder: itemSnapshot.sortOrder,
            };
          }),
        };
      }),
    };
  }
}
