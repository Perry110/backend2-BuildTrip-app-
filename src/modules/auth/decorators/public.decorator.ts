import { SetMetadata } from '@nestjs/common';

/** Metadata: route không cần JWT (bỏ qua JwtAuthGuard). */
export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
