import { Controller, Get, HttpStatus, Logger, Query, UseGuards } from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { handlePlaceRouteError } from '../../place.error-handler';
import { ListPendingPlacesQuery, ListPendingPlacesQueryHandler } from './list-pending-places.query-handler';
import { ListPendingPlacesRequestDto } from './list-pending-places.request.dto';

@Controller('admin/places')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ListPendingPlacesHttpController {
  private readonly logger = new Logger(ListPendingPlacesHttpController.name);

  constructor(private readonly handler: ListPendingPlacesQueryHandler) {}

  @Get('pending')
  async listPending(@Query() q: ListPendingPlacesRequestDto) {
    try {
      const result = await this.handler.execute(
        new ListPendingPlacesQuery({ page: q.page ?? 1, limit: q.limit ?? 20 }),
      );
      return new ResponseCommon(HttpStatus.OK, true, 'Danh sách địa điểm chờ duyệt', result);
    } catch (e) {
      handlePlaceRouteError(this.logger, 'Lỗi khi lấy danh sách chờ duyệt', e);
    }
  }
}
