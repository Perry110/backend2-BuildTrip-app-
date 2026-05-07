import { PartialType } from '@nestjs/swagger';
import { CreateReviewDto } from './review-create.dto';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
