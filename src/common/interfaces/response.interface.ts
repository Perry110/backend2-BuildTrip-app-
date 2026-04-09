export interface IResponse<T = unknown> {
  code: number;
  isSuccess: boolean;
  success: boolean;
  message: string;
  data: T | null;
  errorMessage?: unknown;
}
