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
import { GetTripByIdQuery, GetTripByIdQueryHandler } from './get-trip-by-id.query-handler';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class GetTripByIdHttpController {
  private readonly logger = new Logger(GetTripByIdHttpController.name);

  constructor(private readonly handler: GetTripByIdQueryHandler) {}

  @Get(':id')
  async getTripById(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    try {
      const result = await this.handler.execute(
        new GetTripByIdQuery({ userId: user.id, tripId: id }),
      );
      return new ResponseCommon(HttpStatus.OK, true, 'Trip fetched', result);
    } catch (e) {
      handleTripRouteError(this.logger, 'Lỗi khi lấy chi tiết chuyến đi', e);
    }
  }
}
