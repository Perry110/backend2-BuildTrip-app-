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
import { DeleteTripCommand } from './delete-trip.command';
import { DeleteTripService } from './delete-trip.service';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class DeleteTripHttpController {
  private readonly logger = new Logger(DeleteTripHttpController.name);

  constructor(private readonly service: DeleteTripService) {}

  @Delete(':id')
  async deleteTrip(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    try {
      await this.service.execute(new DeleteTripCommand({ userId: user.id, tripId: id }));
      return new ResponseCommon(HttpStatus.OK, true, 'Trip deleted', null);
    } catch (e) {
      handleTripRouteError(this.logger, 'Lỗi khi xoá chuyến đi', e);
    }
  }
}
