import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitPlaceDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  partnerId?: string;
}
