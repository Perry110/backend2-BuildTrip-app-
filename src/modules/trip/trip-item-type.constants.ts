/**
 * Allowed `trip_item.type` values — aligned with seeded place categories
 * (`dataset/categories_for_places.csv`).
 */
export const TRIP_ITEM_TYPES = [
  'restaurant',
  'cafe',
  'hotel',
  'tourist_attraction',
  'bar',
  'park',
] as const;

export type TripItemType = (typeof TRIP_ITEM_TYPES)[number];
