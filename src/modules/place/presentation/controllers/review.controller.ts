import { Body, Controller, Param, Post } from '@nestjs/common';
import { AddReviewUseCase } from '../../application/use-cases/add-review.use-case';
import { AddReviewDto } from '../dto/add-review.dto';

@Controller('places/:placeId/reviews')
export class ReviewController {
  constructor(private readonly addReviewUseCase: AddReviewUseCase) {}

  @Post()
  async create(
    @Param('placeId') placeId: string,
    @Body() body: AddReviewDto,
  ): Promise<{ success: boolean }> {
    await this.addReviewUseCase.execute({
      ...body,
      placeId,
    });
    return { success: true };
  }
}
