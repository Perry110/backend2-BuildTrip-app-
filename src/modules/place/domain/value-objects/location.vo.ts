export class LocationVo {
  constructor(
    public readonly lat: number,
    public readonly lng: number,
  ) {
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90.');
    }

    if (lng < -180 || lng > 180) {
      throw new Error('Longitude must be between -180 and 180.');
    }
  }
}
