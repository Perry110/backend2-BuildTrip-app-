import {
  CatalogQueryPort,
  PlaceCatalogItemDto,
  SearchNearestInput,
} from '../ports/catalog-query.port';

export class SearchNearestHandler {
  constructor(private readonly catalogQuery: CatalogQueryPort) {}

  async handle(input: SearchNearestInput): Promise<PlaceCatalogItemDto[]> {
    return this.catalogQuery.searchNearest(input);
  }
}
