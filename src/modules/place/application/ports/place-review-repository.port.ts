export interface PlaceReviewDraft {
  id?: string;
  placeId: string;
  userId: string;
  rating: number;
  comment?: string | null;
  imageUrls?: string[] | null;
  deletedAt?: Date | null;
}

export interface PlaceReviewRow extends PlaceReviewDraft {
  id: string;
}

export type NewPlaceReviewData = Pick<PlaceReviewDraft, 'placeId' | 'userId' | 'rating'> & {
  comment: string | null;
  imageUrls: string[] | null;
};

/** Published place + primary partner (owner) for notifications. */
export interface PublishedPlaceReviewContext {
  id: string;
  name: string;
  ownerUserId: string;
}

export interface PlaceReviewRepositoryPort {
  findVisiblePlaceById(placeId: string): Promise<Pick<{ id: string }, 'id'> | null>;
  findPublishedPlaceReviewContext(
    placeId: string,
  ): Promise<PublishedPlaceReviewContext | null>;
  findById(reviewId: string, withDeleted?: boolean): Promise<PlaceReviewRow | null>;
  findByUserAndPlace(userId: string, placeId: string): Promise<PlaceReviewRow | null>;
  findByUserAndPlaceWithDeleted(userId: string, placeId: string): Promise<PlaceReviewRow | null>;
  findByPlaceId(
    placeId: string,
    page: number,
    limit: number,
  ): Promise<{ items: PlaceReviewRow[]; total: number }>;
  create(data: NewPlaceReviewData): PlaceReviewDraft;
  save(review: PlaceReviewDraft | PlaceReviewRow): Promise<PlaceReviewRow>;
  restore(reviewId: string): Promise<void>;
  softDelete(reviewId: string): Promise<void>;
}
