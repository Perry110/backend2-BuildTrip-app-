import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { handlePlaceRouteError } from '../../place.error-handler';
import { CreatePlaceCommand } from './create-place.command';
import { CreatePlaceRequestDto } from './create-place.request.dto';
import { CreatePlaceService } from './create-place.service';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class CreatePlaceHttpController {
  private readonly logger = new Logger(CreatePlaceHttpController.name);

  constructor(private readonly service: CreatePlaceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPlace(@Body() dto: CreatePlaceRequestDto) {
    try {
      const result = await this.service.execute(
        new CreatePlaceCommand({
          name: dto.name,
          address: dto.address,
          description: dto.description,
          lat: dto.lat ?? null,
          lng: dto.lng ?? null,
          categoryId: dto.categoryId,
          tagIds: dto.tags?.length ? [...dto.tags] : [],
        }),
      );
      return new ResponseCommon(HttpStatus.CREATED, true, 'Đã gửi địa điểm. Trạng thái: chờ admin duyệt (pending).', result);
    } catch (e) {
      handlePlaceRouteError(this.logger, 'Lỗi khi tạo địa điểm', e);
    }
  }
}
