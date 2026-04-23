import {
  ArrayNotEmpty,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreatePlaceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tags!: string[];

  @IsString()
  @IsOptional()
  ownerId!: string;

  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
