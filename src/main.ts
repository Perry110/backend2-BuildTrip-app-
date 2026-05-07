import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppErrorExceptionFilter } from './core/filters/app-error-exception.filter';
import {
  LoggingInterceptor,
  TimeoutInterceptor,
  TransformInterceptor,
} from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalFilters(new AppErrorExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(15000),
    new TransformInterceptor(),
  );

  const port = process.env.PORT ?? 5002;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap();
