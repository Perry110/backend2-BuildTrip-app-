import type { PlaceStatusValue } from '../value-objects/place-status.vo';

export class PlaceStatusChangedEvent {
  constructor(
    readonly placeId: string,
    readonly previousStatus: PlaceStatusValue,
    readonly newStatus: PlaceStatusValue,
    readonly occurredAt: Date,
  ) {}
}
