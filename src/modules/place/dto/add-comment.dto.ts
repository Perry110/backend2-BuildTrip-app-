import { Transform, Type } from 'class-transformer';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class AddCommentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  content: string;
}
