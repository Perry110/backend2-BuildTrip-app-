import { IResponse } from '../interfaces/response.interface';

/**
 * Envelope chuẩn cho response (thành công / lỗi nghiệp vụ).
 * - `message`: mô tả ngắn cho client.
 * - `errorMessage`: chi tiết thêm (mã lỗi, field, stack business…) — dùng khi throw HttpException.
 */
export class ResponseCommon<T = unknown> implements IResponse<T> {
  constructor(
    code: number,
    isSuccess: boolean,
    message: string,
    data: T | null,
    errorMessage?: unknown,
  ) {
    this.code = code;
    this.isSuccess = isSuccess;
    this.success = isSuccess;
    this.message = message;
    this.data = data;
    if (errorMessage !== undefined) {
      this.errorMessage = errorMessage;
    }
  }

  code: number;
  isSuccess: boolean;
  success: boolean;
  message: string;
  data: T | null;
  errorMessage?: unknown;
}
