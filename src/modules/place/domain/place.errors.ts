export class PlaceDomainError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'CATEGORY_NOT_FOUND'
      | 'TAGS_NOT_ALL_RESOLVED'
      | 'PLACE_NOT_FOUND'
      | 'INVALID_COORDINATES'
      | 'PLACE_NOT_PUBLISHED',
  ) {
    super(message);
    this.name = 'PlaceDomainError';
  }
}
