require('dotenv').config();
const { DataSource } = require('typeorm');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '15432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_DATABASE || 'buildtrip',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  entities: ['dist/**/*.orm-entity.js'],
  migrations: ['dist/core/database/migrations/*.js'],
});
