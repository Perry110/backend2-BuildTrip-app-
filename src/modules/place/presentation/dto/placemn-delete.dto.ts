import { IsNotEmpty, IsString } from 'class-validator';

export class DeletePlaceDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
