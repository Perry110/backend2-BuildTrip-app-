import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class UpdatePlaceDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  address?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  category?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
