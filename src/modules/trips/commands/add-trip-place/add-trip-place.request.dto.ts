import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddTripPlaceRequestDto {
  @IsUUID()
  placeId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  visitOrder?: number;

  @IsOptional()
  @IsDateString()
  visitTime?: string;
}
