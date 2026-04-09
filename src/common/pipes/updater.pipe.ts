import { Injectable, PipeTransform } from '@nestjs/common';

/**
 * Pipe helper để gắn metadata updater vào payload update.
 * Dùng kiểu: `@Body(new UpdaterPipe(user.id)) dto`.
 */
@Injectable()
export class UpdaterPipe implements PipeTransform {
  constructor(private readonly updaterId: string) {}

  transform(value: unknown) {
    if (!value || typeof value !== 'object') {
      return value;
    }
    return {
      ...(value as Record<string, unknown>),
      updatedBy: this.updaterId,
    };
  }
}
