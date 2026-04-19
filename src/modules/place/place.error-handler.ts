import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ResponseCommon } from '../../common/dto/response.dto';
import { PlaceDomainError } from './domain/place.errors';

function mapPlaceDomainToHttp(err: PlaceDomainError): HttpException {
  const mapping: Record<string, HttpStatus> = {
    CATEGORY_NOT_FOUND: HttpStatus.NOT_FOUND,
    TAGS_NOT_ALL_RESOLVED: HttpStatus.BAD_REQUEST,
    PLACE_NOT_FOUND: HttpStatus.NOT_FOUND,
    INVALID_COORDINATES: HttpStatus.BAD_REQUEST,
    PLACE_NOT_PUBLISHED: HttpStatus.FORBIDDEN,
  };
  const status = mapping[err.code] ?? HttpStatus.BAD_REQUEST;
  return new HttpException(
    new ResponseCommon(status, false, err.message, null),
    status,
  );
}

export function handlePlaceRouteError(
  logger: Logger,
  contextLabel: string,
  error: unknown,
): never {
  if (error instanceof PlaceDomainError) throw mapPlaceDomainToHttp(error);
  if (error instanceof HttpException) throw error;
  logger.error(`${contextLabel}: ${String(error)}`);
  throw new HttpException(
    new ResponseCommon(HttpStatus.INTERNAL_SERVER_ERROR, false, 'Lỗi server.', null),
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
