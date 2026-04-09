import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, Public } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../auth/services/jwt-token.service';
import { AddCommentDto } from './dto/add-comment.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { QueryCommentsDto } from './dto/query-comments.dto';
import { QueryPlacesDto } from './dto/query-places.dto';
import { QueryRecommendationsDto } from './dto/query-recommendations.dto';
import { PlaceService } from './place.service';

/**
 * Giữ tương thích endpoint backend cũ:
 * - GET /api/places
 * - GET /api/places/recommendations
 * - GET /api/places/:id
 * - POST /api/places
 * - GET /api/places/:placeId/comments
 * - POST /api/places/:placeId/comments
 */
@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Get()
  getPlaces(
    @CurrentUser() user: JwtUserPayload,
    @Query() query: QueryPlacesDto,
  ) {
    return this.placeService.getPlaces(user.id, query);
  }

  @Get('recommendations')
  getRecommendations(
    @CurrentUser() user: JwtUserPayload,
    @Query() query: QueryRecommendationsDto,
  ) {
    return this.placeService.getRecommendations(user.id, query);
  }

  @Get(':id')
  getPlaceById(@Param('id', ParseUUIDPipe) id: string) {
    return this.placeService.getPlaceById(id);
  }

  @Post()
  @HttpCode(201)
  createPlace(@Body() dto: CreatePlaceDto) {
    return this.placeService.createPlace(dto);
  }

  @Public()
  @Get(':placeId/comments')
  getCommentsByPlace(
    @Param('placeId', ParseUUIDPipe) placeId: string,
    @Query() query: QueryCommentsDto,
  ) {
    return this.placeService.getCommentsByPlace(placeId, query);
  }

  @Post(':placeId/comments')
  @HttpCode(201)
  addComment(
    @Param('placeId', ParseUUIDPipe) placeId: string,
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: AddCommentDto,
  ) {
    return this.placeService.addComment(placeId, user, dto);
  }
}
