import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { TRIP_ITEM_TYPES } from '../../trip-item-type.constants';

const TRIP_ITEM_TYPE_LIST = [...TRIP_ITEM_TYPES] as string[];

export class UpdateTripItemDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  placeId?: string;

  @ApiPropertyOptional({ enum: TRIP_ITEM_TYPES })
  @IsOptional()
  @IsString()
  @IsIn(TRIP_ITEM_TYPE_LIST)
  @MaxLength(64)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sortOrder?: number;
}
