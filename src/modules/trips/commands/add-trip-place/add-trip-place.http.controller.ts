import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { CurrentUser } from '../../../auth/decorators';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../../auth/services/jwt-token.service';
import { handleTripRouteError } from '../../trips.error-handler';
import { AddTripPlaceCommand } from './add-trip-place.command';
import { AddTripPlaceRequestDto } from './add-trip-place.request.dto';
import { AddTripPlaceService } from './add-trip-place.service';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class AddTripPlaceHttpController {
  private readonly logger = new Logger(AddTripPlaceHttpController.name);

  constructor(private readonly service: AddTripPlaceService) {}

  @Post(':tripId/places')
  @HttpCode(HttpStatus.CREATED)
  async addTripPlace(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: AddTripPlaceRequestDto,
  ) {
    try {
      const result = await this.service.execute(
        new AddTripPlaceCommand({
          userId: user.id,
          tripId,
          placeId: dto.placeId,
          visitOrder: dto.visitOrder,
          visitTime: dto.visitTime,
        }),
      );
      return new ResponseCommon(HttpStatus.CREATED, true, 'Place added to trip', result);
    } catch (e) {
      handleTripRouteError(this.logger, 'Lỗi khi thêm địa điểm vào chuyến đi', e);
    }
  }
}
