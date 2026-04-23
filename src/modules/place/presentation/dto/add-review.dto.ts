import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class AddReviewDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
