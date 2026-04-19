import { IsIn, IsString } from 'class-validator';

export class UpdatePlaceStatusRequestDto {
  @IsString()
  @IsIn(['pending', 'published', 'rejected'])
  status: 'pending' | 'published' | 'rejected';
}
