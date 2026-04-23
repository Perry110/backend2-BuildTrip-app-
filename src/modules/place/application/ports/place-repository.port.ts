import { PlaceRoot } from '../../domain/aggregates/place/place.root';

export interface PlaceRepositoryPort {
  findByIdForAdmin(id: string): Promise<PlaceRoot | null>;
  findByIdForAdminIncludingDeleted(id: string): Promise<PlaceRoot | null>;
  findByIdForOwner(id: string, ownerId: string): Promise<PlaceRoot | null>;
  findByIdForOwnerIncludingDeleted(id: string, ownerId: string): Promise<PlaceRoot | null>;
  findAllForAdmin(status?: string): Promise<PlaceRoot[]>;
  findAllPendingForAdmin(): Promise<PlaceRoot[]>;
  findAllForOwner(ownerId: string): Promise<PlaceRoot[]>;
  save(place: PlaceRoot): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
