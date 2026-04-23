import { BasePlaceManagementEvent, DomainEvent } from './domain-event';

export type { DomainEvent };

export class PlaceSubmittedEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
  ) {
    super('PlaceSubmittedEvent', placeId);
  }
}

export class PlaceApprovedEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
  ) {
    super('PlaceApprovedEvent', placeId);
  }
}

export class PlaceRejectedEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
    public readonly reason: string,
  ) {
    super('PlaceRejectedEvent', placeId);
  }
}

export class PlaceDeletedByOwnerEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
  ) {
    super('PlaceDeletedByOwnerEvent', placeId);
  }
}

export class PlaceDeletedByAdminEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
    public readonly reason: string,
  ) {
    super('PlaceDeletedByAdminEvent', placeId);
  }
}

export class PlaceRestoredByOwnerEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
  ) {
    super('PlaceRestoredByOwnerEvent', placeId);
  }
}

export class PlaceRestoredByAdminEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly actorUserId: string,
    public readonly partnerId: string,
  ) {
    super('PlaceRestoredByAdminEvent', placeId);
  }
}

export class ReviewAddedEvent extends BasePlaceManagementEvent {
  constructor(
    public readonly placeId: string,
    public readonly reviewId: string,
    public readonly actorUserId: string,
  ) {
    super('ReviewAddedEvent', placeId);
  }
}
