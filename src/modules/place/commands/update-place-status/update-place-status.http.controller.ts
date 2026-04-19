import { Body, Controller, HttpStatus, Logger, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { handlePlaceRouteError } from '../../place.error-handler';
import { UpdatePlaceStatusCommand } from './update-place-status.command';
import { UpdatePlaceStatusRequestDto } from './update-place-status.request.dto';
import { UpdatePlaceStatusService } from './update-place-status.service';

@Controller('admin/places')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UpdatePlaceStatusHttpController {
  private readonly logger = new Logger(UpdatePlaceStatusHttpController.name);

  constructor(private readonly service: UpdatePlaceStatusService) {}

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlaceStatusRequestDto,
  ) {
    try {
      const result = await this.service.execute(
        new UpdatePlaceStatusCommand({ placeId: id, status: dto.status }),
      );
      return new ResponseCommon(HttpStatus.OK, true, 'Cập nhật trạng thái thành công.', result);
    } catch (e) {
      handlePlaceRouteError(this.logger, 'Lỗi cập nhật trạng thái địa điểm', e);
    }
  }
}
