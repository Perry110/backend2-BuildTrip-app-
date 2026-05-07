export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly error: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(message = 'resource_not_found') {
    super(message, 404, 'Not Found');
    this.name = 'ResourceNotFoundError';
  }
}
