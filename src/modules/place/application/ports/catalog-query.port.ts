export interface SearchNearestInput {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}

export interface PlaceCatalogItemDto {
  id: string;
  name: string;
  thumbnailUrl: string;
  distanceKm: number;
  category: string;
  status: string;
}

export interface PlaceDetailsDto {
  id: string;
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  tags: string[];
  ownerId: string;
  status: string;
  thumbnailUrl: string;
  imageUrl: string;
  averageRating: number;
}

export interface CatalogQueryPort {
  searchNearest(input: SearchNearestInput): Promise<PlaceCatalogItemDto[]>;
  getPlaceDetails(placeId: string): Promise<PlaceDetailsDto | null>;
}
