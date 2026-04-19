import {
  Body,
  Controller,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { CurrentUser } from '../../../auth/decorators';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../../auth/services/jwt-token.service';
import { handleTripRouteError } from '../../trips.error-handler';
import { UpdateTripPlaceCommand } from './update-trip-place.command';
import { UpdateTripPlaceRequestDto } from './update-trip-place.request.dto';
import { UpdateTripPlaceService } from './update-trip-place.service';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class UpdateTripPlaceHttpController {
  private readonly logger = new Logger(UpdateTripPlaceHttpController.name);

  constructor(private readonly service: UpdateTripPlaceService) {}

  @Patch(':tripId/places/:tripPlaceId')
  async updateTripPlace(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('tripPlaceId', ParseUUIDPipe) tripPlaceId: string,
    @Body() dto: UpdateTripPlaceRequestDto,
  ) {
    try {
      const result = await this.service.execute(
        new UpdateTripPlaceCommand({
          userId: user.id,
          tripId,
          tripPlaceId,
          visitOrder: dto.visitOrder,
          visitTime: dto.visitTime,
        }),
      );
      return new ResponseCommon(HttpStatus.OK, true, 'Trip place updated', result);
    } catch (e) {
      handleTripRouteError(this.logger, 'Lỗi khi cập nhật địa điểm trong chuyến đi', e);
    }
  }
}
