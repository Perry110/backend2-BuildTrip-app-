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
import { UpdateTripCommand } from './update-trip.command';
import { UpdateTripRequestDto } from './update-trip.request.dto';
import { UpdateTripService } from './update-trip.service';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class UpdateTripHttpController {
  private readonly logger = new Logger(UpdateTripHttpController.name);

  constructor(private readonly service: UpdateTripService) {}

  @Patch(':id')
  async updateTrip(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripRequestDto,
  ) {
    try {
      const result = await this.service.execute(
        new UpdateTripCommand({ userId: user.id, tripId: id, ...dto }),
      );
      return new ResponseCommon(HttpStatus.OK, true, 'Trip updated', result);
    } catch (e) {
      handleTripRouteError(this.logger, 'Lỗi khi cập nhật chuyến đi', e);
    }
  }
}
