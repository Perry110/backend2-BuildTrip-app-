import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteOwnPlaceDto {
  @IsString()
  @IsOptional()
  partnerId?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  reason?: string;
}
