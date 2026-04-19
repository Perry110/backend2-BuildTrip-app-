import { Controller, Get, HttpStatus, Logger, Query, UseGuards } from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { CurrentUser } from '../../../auth/decorators';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../../auth/services/jwt-token.service';
import { handlePlaceRouteError } from '../../place.error-handler';
import { GetPlacesQuery, GetPlacesQueryHandler } from './get-places.query-handler';
import { GetPlacesRequestDto } from './get-places.request.dto';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class GetPlacesHttpController {
  private readonly logger = new Logger(GetPlacesHttpController.name);

  constructor(private readonly handler: GetPlacesQueryHandler) {}

  @Get()
  async getPlaces(@CurrentUser() user: JwtUserPayload, @Query() q: GetPlacesRequestDto) {
    try {
      const result = await this.handler.execute(
        new GetPlacesQuery({
          userId: user.id,
          page: q.page ?? 1,
          limit: q.limit ?? 10,
          search: q.search ?? '',
          category: q.category ?? '',
          lat: q.lat ?? null,
          lng: q.lng ?? null,
        }),
      );
      return new ResponseCommon(HttpStatus.OK, true, 'Places fetched', result);
    } catch (e) {
      handlePlaceRouteError(this.logger, 'Lỗi khi lấy danh sách địa điểm', e);
    }
  }
}
