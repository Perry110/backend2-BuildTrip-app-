import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Cần PostgreSQL + Redis + biến môi trường hợp lệ để app khởi động.
 * Bỏ .skip khi đã cấu hình .env.test / CI.
 */
describe.skip('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('GET /api/unknown → 404', () => {
    return request(app.getHttpServer()).get('/api/unknown').expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
