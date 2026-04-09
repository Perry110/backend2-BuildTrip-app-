import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseCommon } from '../dto/response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseCommon<T | unknown>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseCommon<T | unknown>> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'code' in (data as Record<string, unknown>) &&
          'success' in (data as Record<string, unknown>) &&
          'message' in (data as Record<string, unknown>)
        ) {
          return data as unknown as ResponseCommon<T>;
        }

        const response = context.switchToHttp().getResponse();
        const statusCode = response?.statusCode ?? HttpStatus.OK;
        return new ResponseCommon(statusCode, true, 'Success', data ?? null);
      }),
    );
  }
}
