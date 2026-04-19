import {
  Controller,
  Delete,
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
import { RemoveTripPlaceCommand } from './remove-trip-place.command';
import { RemoveTripPlaceService } from './remove-trip-place.service';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class RemoveTripPlaceHttpController {
  private readonly logger = new Logger(RemoveTripPlaceHttpController.name);

  constructor(private readonly service: RemoveTripPlaceService) {}

  @Delete(':tripId/places/:tripPlaceId')
  async removeTripPlace(
    @CurrentUser() user: JwtUserPayload,
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Param('tripPlaceId', ParseUUIDPipe) tripPlaceId: string,
  ) {
    try {
      await this.service.execute(
        new RemoveTripPlaceCommand({ userId: user.id, tripId, tripPlaceId }),
      );
      return new ResponseCommon(HttpStatus.OK, true, 'Place removed from trip', null);
    } catch (e) {
      handleTripRouteError(this.logger, 'Lỗi khi xoá địa điểm khỏi chuyến đi', e);
    }
  }
}
