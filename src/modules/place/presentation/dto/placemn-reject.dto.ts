import { IsNotEmpty, IsString } from 'class-validator';

export class RejectPlaceDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
