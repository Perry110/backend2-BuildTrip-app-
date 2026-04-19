import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { CurrentUser } from '../../../auth/decorators';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../../auth/services/jwt-token.service';
import { handleTripRouteError } from '../../trips.error-handler';
import { CreateTripCommand } from './create-trip.command';
import { CreateTripRequestDto } from './create-trip.request.dto';
import { CreateTripService } from './create-trip.service';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class CreateTripHttpController {
  private readonly logger = new Logger(CreateTripHttpController.name);

  constructor(private readonly service: CreateTripService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTrip(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateTripRequestDto,
  ) {
    try {
      const result = await this.service.execute(
        new CreateTripCommand({
          userId: user.id,
          name: dto.name,
          destination: dto.destination,
          description: dto.description,
          startDate: dto.startDate,
          endDate: dto.endDate,
          isPublic: dto.isPublic,
        }),
      );
      return new ResponseCommon(HttpStatus.CREATED, true, 'Trip created', result);
    } catch (e) {
      handleTripRouteError(this.logger, 'Lỗi khi tạo chuyến đi', e);
    }
  }
}
