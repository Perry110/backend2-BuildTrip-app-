import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/decorators';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../../auth/services/jwt-token.service';
import { PlaceReviewService } from '../../application/place-review.service';
import { CreateReviewDto } from '../dto/review-create.dto';
import { PaginatedPlaceReviewsDto, PlaceReviewDto } from '../dto/review-response.dto';
import { UpdateReviewDto } from '../dto/review-update.dto';

@ApiTags('Place Reviews')
@Controller()
export class PlaceReviewController {
  constructor(private readonly placeReviewService: PlaceReviewService) {}

  @Get('places/:placeId/reviews')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List place reviews (paginated)' })
  @ApiParam({ name: 'placeId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: PaginatedPlaceReviewsDto })
  getPlaceReviews(
    @Param('placeId', new ParseUUIDPipe()) placeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.placeReviewService.getPlaceReviews(
      placeId,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Post('places/:placeId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update current user review for place (idempotent upsert)' })
  @ApiParam({ name: 'placeId', type: String, format: 'uuid' })
  @ApiBody({ type: CreateReviewDto })
  @ApiOkResponse({ type: PlaceReviewDto })
  upsertReview(
    @Param('placeId', new ParseUUIDPipe()) placeId: string,
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.placeReviewService.upsertReview(placeId, user.id, {
      rating: dto.rating,
      comment: dto.comment,
      imageUrls: dto.imageUrls,
    });
  }

  @Patch('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update own review by id' })
  @ApiParam({ name: 'reviewId', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateReviewDto })
  @ApiOkResponse({ type: PlaceReviewDto })
  updateReview(
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.placeReviewService.updateOwnReview(reviewId, user.id, {
      rating: dto.rating,
      comment: dto.comment,
      imageUrls: dto.imageUrls,
    });
  }

  @Delete('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete own review by id' })
  @ApiParam({ name: 'reviewId', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Deleted successfully' })
  async deleteReview(
    @Param('reviewId', new ParseUUIDPipe()) reviewId: string,
    @CurrentUser() user: JwtUserPayload,
  ): Promise<void> {
    await this.placeReviewService.deleteOwnReview(reviewId, user.id);
  }
}

