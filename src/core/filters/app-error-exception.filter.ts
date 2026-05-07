import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../../common/errors/app.error';

@Catch(AppError)
export class AppErrorExceptionFilter implements ExceptionFilter {
  catch(exception: AppError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    res.status(exception.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: exception.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
      error: exception.error ?? 'Error',
      message: exception.message,
    });
  }
}
