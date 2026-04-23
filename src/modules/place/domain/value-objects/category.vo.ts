export class CategoryVo {
  constructor(public readonly value: string) {
    if (!value.trim()) {
      throw new Error('Category cannot be empty.');
    }
  }
}
