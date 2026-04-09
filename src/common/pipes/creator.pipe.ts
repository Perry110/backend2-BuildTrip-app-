import { Injectable, PipeTransform } from '@nestjs/common';

/**
 * Pipe helper để gắn metadata creator vào payload create.
 * Dùng kiểu: `@Body(new CreatorPipe(user.id)) dto`.
 */
@Injectable()
export class CreatorPipe implements PipeTransform {
  constructor(private readonly creatorId: string) {}

  transform(value: unknown) {
    if (!value || typeof value !== 'object') {
      return value;
    }
    return {
      ...(value as Record<string, unknown>),
      createdBy: this.creatorId,
    };
  }
}
