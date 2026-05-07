export interface UpsertReviewInput {
  rating: number;
  comment?: string;
  imageUrls?: string[];
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
  imageUrls?: string[];
}
