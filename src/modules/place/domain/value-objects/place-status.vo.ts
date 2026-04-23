export enum PlaceStatus {
  PENDING = 'pending',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
}

export class PlaceStatusVo {
  constructor(public readonly value: PlaceStatus) {}

  static from(value: string): PlaceStatusVo {
    const normalized = value.trim().toLowerCase();
    if (!Object.values(PlaceStatus).includes(normalized as PlaceStatus)) {
      throw new Error(`Invalid place status: ${value}`);
    }
    return new PlaceStatusVo(normalized as PlaceStatus);
  }
}
