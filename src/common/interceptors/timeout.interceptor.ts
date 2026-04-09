import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { ResponseCommon } from '../dto/response.dto';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly timeoutMs = 10000) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((err) => {
        if (err?.name === 'TimeoutError') {
          return throwError(
            () =>
              new RequestTimeoutException(
                new ResponseCommon(408, false, 'Request timeout', null),
              ),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
