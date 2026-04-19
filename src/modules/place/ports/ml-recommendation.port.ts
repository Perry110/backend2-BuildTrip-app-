export type MlRecommendRequest = {
  candidate_ids?: string[];
  trip_place_ids: string[];
  trip_categories: string[];
  user_lat: number | null;
  user_lng: number | null;
  exclude_ids?: string[];
  category_filter?: string | null;
  limit: number;
  offset: number;
};

export type MlRecommendResponse = {
  items?: Array<{ place_id: string; score: number }>;
  total?: number;
};

export interface IMlRecommendationPort {
  recommend(payload: MlRecommendRequest): Promise<MlRecommendResponse>;
}
