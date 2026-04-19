import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateTripPlaceRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  visitOrder?: number;

  @IsOptional()
  @IsDateString()
  visitTime?: string;
}
