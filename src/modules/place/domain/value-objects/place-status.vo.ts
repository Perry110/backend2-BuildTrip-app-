export type PlaceStatusValue = 'pending' | 'published' | 'rejected';

export class PlaceStatus {
  private constructor(readonly value: PlaceStatusValue) {}

  static published(): PlaceStatus {
    return new PlaceStatus('published');
  }

  static from(value: string): PlaceStatus {
    if (value === 'pending' || value === 'published' || value === 'rejected') {
      return new PlaceStatus(value as PlaceStatusValue);
    }
    throw new Error(`Trạng thái địa điểm không hợp lệ: ${value}`);
  }

  equals(other: PlaceStatus): boolean {
    return this.value === other.value;
  }
}
