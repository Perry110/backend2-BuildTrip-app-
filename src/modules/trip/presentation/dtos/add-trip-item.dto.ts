import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { TRIP_ITEM_TYPES } from '../../trip-item-type.constants';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TRIP_ITEM_TYPE_LIST = [...TRIP_ITEM_TYPES] as string[];

export class AddTripItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  placeId!: string;

  @ApiProperty({ enum: TRIP_ITEM_TYPES })
  @IsString()
  @IsIn(TRIP_ITEM_TYPE_LIST)
  @MaxLength(64)
  type!: string;

  @ApiProperty({ example: '09:00' })
  @Matches(TIME_PATTERN)
  startTime!: string;

  @ApiProperty({ example: '11:00' })
  @Matches(TIME_PATTERN)
  endTime!: string;

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
