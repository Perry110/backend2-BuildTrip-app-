import { CatalogQueryPort, PlaceDetailsDto } from '../ports/catalog-query.port';

export class GetPlaceDetailsHandler {
  constructor(private readonly catalogQuery: CatalogQueryPort) {}

  async handle(placeId: string): Promise<PlaceDetailsDto | null> {
    return this.catalogQuery.getPlaceDetails(placeId);
  }
}
