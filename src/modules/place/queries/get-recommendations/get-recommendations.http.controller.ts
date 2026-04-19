import { Controller, Get, HttpStatus, Logger, Query, UseGuards } from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { CurrentUser } from '../../../auth/decorators';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../../auth/services/jwt-token.service';
import { handlePlaceRouteError } from '../../place.error-handler';
import { GetRecommendationsQuery, GetRecommendationsQueryHandler } from './get-recommendations.query-handler';
import { GetRecommendationsRequestDto } from './get-recommendations.request.dto';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class GetRecommendationsHttpController {
  private readonly logger = new Logger(GetRecommendationsHttpController.name);

  constructor(private readonly handler: GetRecommendationsQueryHandler) {}

  @Get('recommendations')
  async getRecommendations(
    @CurrentUser() user: JwtUserPayload,
    @Query() q: GetRecommendationsRequestDto,
  ) {
    try {
      const result = await this.handler.execute(
        new GetRecommendationsQuery({
          userId: user.id,
          category: q.category ?? '',
          limit: q.limit ?? 8,
          page: q.page ?? 1,
          lat: q.lat ?? null,
          lng: q.lng ?? null,
        }),
      );
      return new ResponseCommon(HttpStatus.OK, true, 'Recommendations fetched', result);
    } catch (e) {
      handlePlaceRouteError(this.logger, 'Lỗi recommendations', e);
    }
  }
}
