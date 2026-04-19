import { Body, Controller, HttpCode, HttpStatus, Logger, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ResponseCommon } from '../../../../common/dto/response.dto';
import { CurrentUser } from '../../../auth/decorators';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../../auth/services/jwt-token.service';
import { handlePlaceRouteError } from '../../place.error-handler';
import { AddPlaceCommentCommand } from './add-place-comment.command';
import { AddPlaceCommentRequestDto } from './add-place-comment.request.dto';
import { AddPlaceCommentService } from './add-place-comment.service';

@Controller('places')
@UseGuards(JwtAuthGuard)
export class AddPlaceCommentHttpController {
  private readonly logger = new Logger(AddPlaceCommentHttpController.name);

  constructor(private readonly service: AddPlaceCommentService) {}

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Param('id', ParseUUIDPipe) placeId: string,
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: AddPlaceCommentRequestDto,
  ) {
    try {
      const result = await this.service.execute(
        new AddPlaceCommentCommand({
          placeId,
          userId: user.id,
          username: (user as { username?: string }).username ?? '',
          rating: dto.rating,
          content: dto.content,
        }),
      );
      return new ResponseCommon(HttpStatus.CREATED, true, 'Cảm ơn bạn đã đánh giá!', result);
    } catch (e) {
      handlePlaceRouteError(this.logger, 'Lỗi khi thêm bình luận', e);
    }
  }
}
