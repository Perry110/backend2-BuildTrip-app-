import { PlaceDomainError } from '../place.errors';

export class Coordinates {
  private constructor(
    readonly lat: number,
    readonly lng: number,
  ) {}

  static tryCreate(lat: number | null | undefined, lng: number | null | undefined): Coordinates | null {
    if (lat == null && lng == null) return null;
    if (lat == null || lng == null) {
      throw new PlaceDomainError('lat và lng phải cùng có hoặc cùng không.', 'INVALID_COORDINATES');
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new PlaceDomainError('lat/lng không hợp lệ.', 'INVALID_COORDINATES');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new PlaceDomainError('lat/lng nằm ngoài phạm vi cho phép.', 'INVALID_COORDINATES');
    }
    return new Coordinates(lat, lng);
  }
}
