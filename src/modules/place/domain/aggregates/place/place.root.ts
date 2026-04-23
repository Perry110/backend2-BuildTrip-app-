import {
  DomainEvent,
  PlaceApprovedEvent,
  PlaceDeletedByAdminEvent,
  PlaceDeletedByOwnerEvent,
  PlaceRejectedEvent,
  PlaceRestoredByAdminEvent,
  PlaceRestoredByOwnerEvent,
  PlaceSubmittedEvent,
} from '../../events/core/place-management.events';
import { CategoryVo } from '../../value-objects/category.vo';
import { LocationVo } from '../../value-objects/location.vo';
import { PlaceStatus } from '../../value-objects/place-status.vo';
import {
  InvalidWorkflowException,
  PlaceDeletedException,
  PlaceNotDeletedException,
  PlaceOwnershipException,
} from '../../exceptions/invalid-workflow.exception';

export interface PlaceActorContext {
  userId: string;
  partnerId?: string | null;
}

export interface CreatePlaceProps {
  id: string;
  name: string;
  description?: string;
  address: string;
  location: LocationVo;
  category: CategoryVo;
  tags: string[];
  ownerId: string;
  thumbnailUrl: string;
  imageUrl: string;
}

export interface UpdatePlaceProps {
  name?: string;
  description?: string;
  address?: string;
  category?: CategoryVo;
  tags?: string[];
  thumbnailUrl?: string;
  imageUrl?: string;
}

export interface PlaceSnapshot {
  id: string;
  name: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  tags: string[];
  ownerId: string;
  status: PlaceStatus;
  thumbnailUrl: string;
  imageUrl: string;
  deletedAt: Date | null;
  deletedReason: string | null;
}

export class PlaceRoot {
  private pendingEvents: DomainEvent[] = [];
  private constructor(private readonly snapshot: PlaceSnapshot) {}

  get id(): string {
    return this.snapshot.id;
  }

  static create(props: CreatePlaceProps): PlaceRoot {
    const place = new PlaceRoot({
      id: props.id,
      name: props.name,
      description: props.description,
      address: props.address,
      lat: props.location.lat,
      lng: props.location.lng,
      category: props.category.value,
      tags: props.tags,
      ownerId: props.ownerId,
      status: PlaceStatus.PENDING,
      thumbnailUrl: props.thumbnailUrl,
      imageUrl: props.imageUrl,
      deletedAt: null,
      deletedReason: null,
    });
    return place;
  }

  static reconstitute(snapshot: PlaceSnapshot): PlaceRoot {
    return new PlaceRoot(snapshot);
  }

  update(props: UpdatePlaceProps): void {
    this.ensureNotDeleted();
    if (
      this.snapshot.status !== PlaceStatus.PENDING &&
      this.snapshot.status !== PlaceStatus.REJECTED
    ) {
      throw new InvalidWorkflowException('place_can_only_update_in_pending_or_rejected');
    }

    if (props.name !== undefined) {
      this.snapshot.name = props.name;
    }

    if (props.description !== undefined) {
      this.snapshot.description = props.description;
    }

    if (props.address !== undefined) {
      this.snapshot.address = props.address;
    }

    if (props.category !== undefined) {
      this.snapshot.category = props.category.value;
    }

    if (props.tags !== undefined) {
      this.snapshot.tags = props.tags;
    }

    if (props.thumbnailUrl !== undefined) {
      this.snapshot.thumbnailUrl = props.thumbnailUrl;
    }

    if (props.imageUrl !== undefined) {
      this.snapshot.imageUrl = props.imageUrl;
    }
  }

  submitPlace(actor: PlaceActorContext): void {
    this.ensureNotDeleted();
    this.ensurePartnerOwnership(actor);
    if (this.snapshot.status !== PlaceStatus.REJECTED) {
      throw new InvalidWorkflowException('place_can_only_submit_from_rejected');
    }
    this.snapshot.status = PlaceStatus.PENDING;
    this.pendingEvents.push(
      new PlaceSubmittedEvent(this.snapshot.id, actor.userId, this.snapshot.ownerId),
    );
  }

  approve(actor: PlaceActorContext): void {
    this.ensureNotDeleted();
    if (this.snapshot.status !== PlaceStatus.PENDING) {
      throw new InvalidWorkflowException('place_can_only_approve_from_pending_review');
    }
    this.snapshot.status = PlaceStatus.PUBLISHED;
    this.pendingEvents.push(
      new PlaceApprovedEvent(this.snapshot.id, actor.userId, this.snapshot.ownerId),
    );
  }

  reject(actor: PlaceActorContext, reason: string): void {
    this.ensureNotDeleted();
    if (this.snapshot.status !== PlaceStatus.PENDING) {
      throw new InvalidWorkflowException('place_can_only_reject_from_pending_review');
    }
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new InvalidWorkflowException('place_reject_reason_required');
    }
    this.snapshot.status = PlaceStatus.REJECTED;
    this.pendingEvents.push(
      new PlaceRejectedEvent(
        this.snapshot.id,
        actor.userId,
        this.snapshot.ownerId,
        trimmedReason,
      ),
    );
  }

  deleteByOwner(actor: PlaceActorContext): void {
    this.ensureNotDeleted();
    this.ensurePartnerOwnership(actor);
    this.snapshot.deletedAt = new Date();
    this.snapshot.deletedReason = 'owner_requested_delete';
    this.pendingEvents.push(
      new PlaceDeletedByOwnerEvent(this.snapshot.id, actor.userId, this.snapshot.ownerId),
    );
  }

  deleteByAdmin(actor: PlaceActorContext, reason: string): void {
    this.ensureNotDeleted();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new InvalidWorkflowException('place_delete_reason_required');
    }
    this.snapshot.deletedAt = new Date();
    this.snapshot.deletedReason = trimmedReason;
    this.pendingEvents.push(
      new PlaceDeletedByAdminEvent(
        this.snapshot.id,
        actor.userId,
        this.snapshot.ownerId,
        trimmedReason,
      ),
    );
  }

  restoreByOwner(actor: PlaceActorContext): void {
    this.ensureDeleted();
    this.ensurePartnerOwnership(actor);
    this.snapshot.deletedAt = null;
    this.snapshot.deletedReason = null;
    this.pendingEvents.push(
      new PlaceRestoredByOwnerEvent(this.snapshot.id, actor.userId, this.snapshot.ownerId),
    );
  }

  restoreByAdmin(actor: PlaceActorContext): void {
    this.ensureDeleted();
    this.snapshot.deletedAt = null;
    this.snapshot.deletedReason = null;
    this.pendingEvents.push(
      new PlaceRestoredByAdminEvent(this.snapshot.id, actor.userId, this.snapshot.ownerId),
    );
  }

  toSnapshot(): PlaceSnapshot {
    return {
      ...this.snapshot,
      tags: [...this.snapshot.tags],
    };
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.pendingEvents];
    this.pendingEvents = [];
    return events;
  }

  private ensurePartnerOwnership(actor: PlaceActorContext): void {
    // Ownership is determined by the user who originally created the place.
    if (actor.userId !== this.snapshot.ownerId) {
      throw new PlaceOwnershipException('place_partner_ownership_required');
    }
  }

  private ensureNotDeleted(): void {
    if (this.snapshot.deletedAt) {
      throw new PlaceDeletedException();
    }
  }

  private ensureDeleted(): void {
    if (!this.snapshot.deletedAt) {
      throw new PlaceNotDeletedException();
    }
  }
}
