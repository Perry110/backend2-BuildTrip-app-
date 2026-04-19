import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { CurrentUser } from '../../../auth/decorators';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../../auth/services/jwt-token.service';
import { handleTripRouteError } from '../../trips.error-handler';
import { GetTripPlacesQuery, GetTripPlacesQueryHandler } from './get-trip-places.query-handler';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class GetTripPlacesHttpController {
  private readonly logger = new Logger(GetTripPlacesHttpController.name);

  constructor(private readonly handler: GetTripPlacesQueryHandler) {}

  @Get(':tripId/places')
  async getTripPlaces(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', ParseUUIDPipe) tripId: string,
  ) {
    try {
      const result = await this.handler.execute(
        new GetTripPlacesQuery({ userId: user.id, tripId }),
      );
      return new ResponseCommon(HttpStatus.OK, true, 'Trip places fetched', result);
    } catch (e) {
      handleTripRouteError(this.logger, 'Lỗi khi lấy danh sách địa điểm trong chuyến đi', e);
    }
  }
}
