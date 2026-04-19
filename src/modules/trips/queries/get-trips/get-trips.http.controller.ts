import { Controller, Get, HttpStatus, Logger, Query, UseGuards } from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { CurrentUser } from '../../../auth/decorators';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../../auth/services/jwt-token.service';
import { handleTripRouteError } from '../../trips.error-handler';
import { GetTripsQuery, GetTripsQueryHandler } from './get-trips.query-handler';
import { GetTripsRequestDto } from './get-trips.request.dto';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class GetTripsHttpController {
  private readonly logger = new Logger(GetTripsHttpController.name);

  constructor(private readonly handler: GetTripsQueryHandler) {}

  @Get()
  async getTrips(
    @CurrentUser() user: JwtUserPayload,
    @Query() q: GetTripsRequestDto,
  ) {
    try {
      const result = await this.handler.execute(
        new GetTripsQuery({
          userId: user.id,
          page: q.page ?? 1,
          pageSize: q.pageSize ?? 10,
          isPublic: q.isPublic,
        }),
      );
      return new ResponseCommon(HttpStatus.OK, true, 'Trips fetched', result);
    } catch (e) {
      handleTripRouteError(this.logger, 'Lỗi khi lấy danh sách chuyến đi', e);
    }
  }
}
