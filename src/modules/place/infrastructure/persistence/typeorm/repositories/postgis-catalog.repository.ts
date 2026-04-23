import {
  CatalogQueryPort,
  PlaceCatalogItemDto,
  PlaceDetailsDto,
  SearchNearestInput,
} from '../../../../application/ports/catalog-query.port';

export class PostgisCatalogRepository implements CatalogQueryPort {
  async searchNearest(_input: SearchNearestInput): Promise<PlaceCatalogItemDto[]> {
    // TODO: Query nearest places from PostGIS read model.
    return [];
  }

  async getPlaceDetails(_placeId: string): Promise<PlaceDetailsDto | null> {
    // TODO: Query place detail projection from PostGIS read model.
    return null;
  }
}
