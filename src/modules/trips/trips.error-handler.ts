import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { TripDomainError } from './domain/trip.errors';

function mapTripDomainToHttp(err: TripDomainError): HttpException {
  const mapping: Record<string, HttpStatus> = {
    TRIP_NOT_FOUND: HttpStatus.NOT_FOUND,
    TRIP_PLACE_NOT_FOUND: HttpStatus.NOT_FOUND,
    INVALID_DATE_RANGE: HttpStatus.BAD_REQUEST,
    PLACE_NOT_FOUND: HttpStatus.NOT_FOUND,
  };
  const status = mapping[err.code] ?? HttpStatus.UNPROCESSABLE_ENTITY;
  return new HttpException({ message: err.message, code: err.code }, status);
}

export function handleTripRouteError(
  logger: Logger,
  contextLabel: string,
  error: unknown,
): never {
  if (error instanceof TripDomainError) {
    throw mapTripDomainToHttp(error);
  }
  if (error instanceof HttpException) {
    throw error;
  }
  logger.error(contextLabel, error instanceof Error ? error.stack : String(error));
  throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
}
