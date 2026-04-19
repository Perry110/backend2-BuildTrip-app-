import { Controller, Get, HttpStatus, Logger, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { handlePlaceRouteError } from '../../place.error-handler';
import { GetPlaceByIdQuery, GetPlaceByIdQueryHandler } from './get-place-by-id.query-handler';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class GetPlaceByIdHttpController {
  private readonly logger = new Logger(GetPlaceByIdHttpController.name);

  constructor(private readonly handler: GetPlaceByIdQueryHandler) {}

  @Get(':id')
  async getPlaceById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const result = await this.handler.execute(new GetPlaceByIdQuery({ placeId: id }));
      return new ResponseCommon(HttpStatus.OK, true, 'Place fetched', result);
    } catch (e) {
      handlePlaceRouteError(this.logger, 'Lỗi khi lấy chi tiết địa điểm', e);
    }
  }
}
