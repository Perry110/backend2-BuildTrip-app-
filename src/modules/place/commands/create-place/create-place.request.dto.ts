import { Transform, Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsLatitude, IsLongitude, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreatePlaceRequestDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address: string;

  @IsString()
  @MinLength(20)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number | null;

  @IsUUID('4')
  categoryId: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tags?: string[];
}
