import { Controller, Get, HttpStatus, Logger, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { handlePlaceRouteError } from '../../place.error-handler';
import { GetPlaceCommentsQuery, GetPlaceCommentsQueryHandler } from './get-place-comments.query-handler';
import { GetPlaceCommentsRequestDto } from './get-place-comments.request.dto';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class GetPlaceCommentsHttpController {
  private readonly logger = new Logger(GetPlaceCommentsHttpController.name);

  constructor(private readonly handler: GetPlaceCommentsQueryHandler) {}

  @Get(':id/comments')
  async getComments(
    @Param('id', ParseUUIDPipe) placeId: string,
    @Query() q: GetPlaceCommentsRequestDto,
  ) {
    try {
      const result = await this.handler.execute(
        new GetPlaceCommentsQuery({ placeId, page: q.page ?? 1, limit: q.limit ?? 10 }),
      );
      return new ResponseCommon(HttpStatus.OK, true, 'Comments fetched', result);
    } catch (e) {
      handlePlaceRouteError(this.logger, 'Lỗi lấy danh sách bình luận', e);
    }
  }
}
