import type {
  ApiError,
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@evolith/shared";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function successResponse<TData>(
  context: Context,
  data: TData,
  status: ContentfulStatusCode = 200,
): Response {
  const body: ApiSuccessResponse<TData> = { data };
  return context.json(body, status);
}

export function errorResponse(
  context: Context,
  message: string,
  status: ContentfulStatusCode,
  code?: string,
): Response {
  const error: ApiError = code ? { message, code } : { message };
  const body: ApiErrorResponse = { error };

  return context.json(body, status);
}
