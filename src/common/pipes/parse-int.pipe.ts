import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ResponseCommon } from '../dto/response.dto';

type ParseIntPipeOptions = {
  fieldName?: string;
  min?: number;
  max?: number;
};

@Injectable()
export class ParseIntPipe implements PipeTransform {
  constructor(private readonly options: ParseIntPipeOptions = {}) {}

  transform(value: unknown): number {
    const field = this.options.fieldName ?? 'value';
    const parsed =
      typeof value === 'number' ? value : Number.parseInt(String(value), 10);

    if (Number.isNaN(parsed)) {
      throw new BadRequestException(
        new ResponseCommon(400, false, `${field} must be an integer`, null),
      );
    }
    if (
      this.options.min !== undefined &&
      parsed < this.options.min
    ) {
      throw new BadRequestException(
        new ResponseCommon(
          400,
          false,
          `${field} must be >= ${this.options.min}`,
          null,
        ),
      );
    }
    if (
      this.options.max !== undefined &&
      parsed > this.options.max
    ) {
      throw new BadRequestException(
        new ResponseCommon(
          400,
          false,
          `${field} must be <= ${this.options.max}`,
          null,
        ),
      );
    }
    return parsed;
  }
}
