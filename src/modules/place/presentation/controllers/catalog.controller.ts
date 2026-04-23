import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetPlaceDetailsHandler } from '../../application/queries/get-place-details.handler';
import { SearchNearestHandler } from '../../application/queries/search-nearest.handler';
import { SearchNearestDto } from '../dto/search-nearest.dto';

@Controller('places')
export class CatalogController {
  constructor(
    private readonly searchNearestHandler: SearchNearestHandler,
    private readonly getPlaceDetailsHandler: GetPlaceDetailsHandler,
  ) {}

  @Get('nearest')
  async searchNearest(@Query() query: SearchNearestDto) {
    return this.searchNearestHandler.handle(query);
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    return this.getPlaceDetailsHandler.handle(id);
  }
}
