import { Transform } from 'class-transformer';
import { IsInt, IsNumber, Max, Min } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    return Number(normalized);
  }
  return Number(value);
}

export class NearbyPlacesQueryDto {
  @ApiProperty({ example: 10.3484864 })
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 107.0761821 })
  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({
    example: 5000,
    default: 5000,
    minimum: 100,
    maximum: 20000,
    description: 'Search radius in meters.',
  })
  @Transform(({ value }) => toNumber(value ?? 5000))
  @IsInt()
  @Min(100)
  @Max(20000)
  radiusInMeters = 5000;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 30,
  })
  @Transform(({ value }) => toNumber(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(30)
  limit = 20;
}